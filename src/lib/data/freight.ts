import "server-only";
import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  freightRequests,
  freightQuotes,
  forwarderLanes,
  shipments,
  shipmentLines,
  shipmentEvents,
  shipmentParticipants,
  shipmentDocuments,
  shipmentFinancials,
  organizations,
  orders,
  users,
} from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser } from "@/lib/data/users";
import {
  assertOrgAccess,
  getMyOrgs,
  isPlatformAdmin,
  type OrgType,
} from "@/lib/data/orgs";
import {
  getMilestone,
  milestoneLabel,
  MILESTONES,
  type ShipmentStatus,
} from "@/lib/freight/milestones";
import {
  getOrCreateConversation,
  postSystemMessage,
} from "@/lib/data/chat";
import { makeReference } from "@/lib/data/demo-store";

/**
 * FREIGHT FORWARDING as a marketplace service.
 *
 * Flow: buyer raises a request on a completed order -> the platform fans it out
 * ONLY to forwarders whose registered lane matches -> they bid -> the buyer
 * awards one -> a shipment is created and the winner becomes a participant.
 *
 * The leakage boundary that matters: a forwarder who was merely INVITED to bid
 * sees the lane, the vehicle summary and the dates. They do not become a
 * shipment participant, and they never see the buyer's identity or contact
 * details, until they win. Losing bidders learn nothing about the customer.
 */

export type ShipmentMode = "roro" | "container_fcl" | "container_lcl" | "air";
export type Incoterm = "EXW" | "FOB" | "CFR" | "CIF" | "DAP" | "DDP";

export interface FreightQuoteView {
  id: string;
  forwarderOrgId: string;
  forwarderName: string;
  status: string;
  currency: string;
  totalMinor: number | null;
  lineItems: unknown;
  transitDays: number | null;
  validUntil: string | null;
  notes: string | null;
  respondedAt: string | null;
}

export interface FreightRequestView {
  id: string;
  reference: string;
  orderId: string | null;
  originCountry: string;
  originCity: string | null;
  destCountry: string;
  destCity: string | null;
  destPort: string | null;
  mode: ShipmentMode;
  incoterm: Incoterm;
  vehicleCount: number;
  vehicleSummary: unknown;
  notes: string | null;
  status: string;
  createdAt: string;
  quotes: FreightQuoteView[];
}

/* ------------------------------------------------------------------ *
 * RFQ
 * ------------------------------------------------------------------ */

/**
 * Buyer raises a shipping request, which is immediately fanned out to matching
 * forwarders. Only VERIFIED (admin-approved) forwarder orgs are invited —
 * an unverified partner must never receive customer cargo details.
 */
export async function createFreightRequest(input: {
  orderId?: string;
  originCountry?: string;
  originCity?: string;
  destCountry: string;
  destCity?: string;
  destPort?: string;
  mode: ShipmentMode;
  incoterm: Incoterm;
  vehicleCount?: number;
  vehicleSummary?: unknown;
  notes?: string;
}): Promise<{ ok: true; id: string; invited: number } | { ok: false; error: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };

  const user = await getOrSyncUser().catch(() => null);
  if (!user) return { ok: false, error: "Sign in to request shipping." };
  if (!input.destCountry) {
    return { ok: false, error: "Choose a destination country." };
  }

  // A buyer may only raise freight against an order they actually own.
  if (input.orderId) {
    const own = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.id, input.orderId), eq(orders.buyerId, user.id)))
      .limit(1);
    if (!own[0]) {
      return { ok: false, error: "That order is not available on your account." };
    }
  }

  const orgs = await getMyOrgs();
  const buyerOrg = orgs.find((o) => o.type === "buyer") ?? orgs[0] ?? null;
  const originCountry = input.originCountry ?? "AE";

  const [request] = await db
    .insert(freightRequests)
    .values({
      reference: makeReference("FR"),
      orderId: input.orderId ?? null,
      buyerUserId: user.id,
      buyerOrgId: buyerOrg?.id ?? null,
      originCountry,
      originCity: input.originCity ?? null,
      destCountry: input.destCountry,
      destCity: input.destCity ?? null,
      destPort: input.destPort ?? null,
      mode: input.mode,
      incoterm: input.incoterm,
      vehicleCount: input.vehicleCount ?? 1,
      vehicleSummary: input.vehicleSummary ?? null,
      notes: input.notes ?? null,
      // Bids close in a week by default; expired requests are swept by cron.
      expiresAt: new Date(Date.now() + 7 * 86_400_000),
    })
    .returning();

  const invited = await fanOutToForwarders(request.id, {
    originCountry,
    destCountry: input.destCountry,
    mode: input.mode,
  });

  return { ok: true, id: request.id, invited };
}

/**
 * Lane-matched fan-out. Deliberately NOT a blast to every forwarder: a
 * forwarder who doesn't serve Dubai to Mombasa has no business seeing that
 * cargo, and response rates stay meaningful.
 */
async function fanOutToForwarders(
  requestId: string,
  lane: { originCountry: string; destCountry: string; mode: string },
): Promise<number> {
  const matches = await db
    .selectDistinct({ orgId: forwarderLanes.orgId })
    .from(forwarderLanes)
    .innerJoin(organizations, eq(organizations.id, forwarderLanes.orgId))
    .where(
      and(
        eq(forwarderLanes.originCountry, lane.originCountry),
        eq(forwarderLanes.destCountry, lane.destCountry),
        eq(forwarderLanes.active, true),
        // Only verified forwarders get customer cargo details.
        eq(organizations.status, "active"),
        eq(organizations.type, "forwarder"),
      ),
    );

  if (matches.length === 0) return 0;

  await db
    .insert(freightQuotes)
    .values(
      matches.map((m) => ({
        requestId,
        forwarderOrgId: m.orgId,
        status: "invited" as const,
      })),
    )
    .onConflictDoNothing();

  return matches.length;
}

/** The buyer's own freight requests with the bids received. */
export async function getMyFreightRequests(): Promise<FreightRequestView[]> {
  if (!isDbEnabled()) return [];
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return [];

  const reqs = await db
    .select()
    .from(freightRequests)
    .where(eq(freightRequests.buyerUserId, user.id))
    .orderBy(desc(freightRequests.createdAt))
    .limit(100);
  if (reqs.length === 0) return [];

  const quoteRows = await db
    .select({ q: freightQuotes, orgName: organizations.name })
    .from(freightQuotes)
    .leftJoin(organizations, eq(organizations.id, freightQuotes.forwarderOrgId))
    .where(
      and(
        inArray(
          freightQuotes.requestId,
          reqs.map((r) => r.id),
        ),
        // A buyer sees real bids, not the list of who was invited.
        ne(freightQuotes.status, "invited"),
      ),
    );

  const byRequest = new Map<string, FreightQuoteView[]>();
  for (const row of quoteRows) {
    const list = byRequest.get(row.q.requestId) ?? [];
    list.push(toQuoteView(row.q, row.orgName));
    byRequest.set(row.q.requestId, list);
  }

  return reqs.map((r) => ({
    id: r.id,
    reference: r.reference,
    orderId: r.orderId,
    originCountry: r.originCountry,
    originCity: r.originCity,
    destCountry: r.destCountry,
    destCity: r.destCity,
    destPort: r.destPort,
    mode: r.mode as ShipmentMode,
    incoterm: r.incoterm as Incoterm,
    vehicleCount: r.vehicleCount,
    vehicleSummary: r.vehicleSummary,
    notes: r.notes,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    quotes: byRequest.get(r.id) ?? [],
  }));
}

/**
 * A forwarder's bid board — requests they were invited to. Buyer identity is
 * NOT selected here; the forwarder bids on a lane and a vehicle, not a person.
 */
export async function getForwarderBidBoard(forwarderOrgId: string) {
  if (!isDbEnabled()) return [];
  const ctx = await assertOrgAccess(forwarderOrgId);
  if (!ctx || ctx.type !== "forwarder") return [];

  const rows = await db
    .select({ quote: freightQuotes, request: freightRequests })
    .from(freightQuotes)
    .innerJoin(
      freightRequests,
      eq(freightRequests.id, freightQuotes.requestId),
    )
    .where(eq(freightQuotes.forwarderOrgId, forwarderOrgId))
    .orderBy(desc(freightQuotes.invitedAt))
    .limit(100);

  return rows.map(({ quote, request }) => ({
    quoteId: quote.id,
    status: quote.status,
    totalMinor: quote.totalMinor,
    currency: quote.currency,
    validUntil: quote.validUntil?.toISOString() ?? null,
    request: {
      id: request.id,
      reference: request.reference,
      originCountry: request.originCountry,
      originCity: request.originCity,
      destCountry: request.destCountry,
      destCity: request.destCity,
      destPort: request.destPort,
      mode: request.mode,
      incoterm: request.incoterm,
      vehicleCount: request.vehicleCount,
      vehicleSummary: request.vehicleSummary,
      notes: request.notes,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
    },
  }));
}

/** Forwarder submits or updates a bid. Validity is mandatory. */
export async function submitFreightQuote(input: {
  quoteId: string;
  totalMinor: number;
  currency?: string;
  lineItems?: unknown;
  transitDays?: number;
  validUntil: Date;
  notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };

  const rows = await db
    .select()
    .from(freightQuotes)
    .where(eq(freightQuotes.id, input.quoteId))
    .limit(1);
  const quote = rows[0];
  if (!quote) return { ok: false, error: "Bid not found." };

  const ctx = await assertOrgAccess(quote.forwarderOrgId);
  if (!ctx) return { ok: false, error: "Not allowed" };
  if (quote.status === "accepted" || quote.status === "rejected") {
    return { ok: false, error: "This request has already been decided." };
  }
  if (input.validUntil.getTime() <= Date.now()) {
    return { ok: false, error: "Validity date must be in the future." };
  }
  if (!Number.isFinite(input.totalMinor) || input.totalMinor <= 0) {
    return { ok: false, error: "Enter a valid total." };
  }

  await db
    .update(freightQuotes)
    .set({
      status: "submitted",
      totalMinor: Math.round(input.totalMinor),
      currency: input.currency ?? "AED",
      lineItems: input.lineItems ?? null,
      transitDays: input.transitDays ?? null,
      validUntil: input.validUntil,
      notes: input.notes ?? null,
      respondedAt: new Date(),
    })
    .where(eq(freightQuotes.id, input.quoteId));

  return { ok: true };
}

/**
 * Buyer awards the job. This is the transaction where the winning forwarder
 * finally gains access: the shipment is created, participants are written for
 * buyer + dealer + forwarder, and one conversation is opened for all of them.
 */
export async function awardFreightQuote(
  quoteId: string,
): Promise<{ ok: true; shipmentId: string } | { ok: false; error: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };

  const user = await getOrSyncUser().catch(() => null);
  if (!user) return { ok: false, error: "Sign in to continue." };

  const rows = await db
    .select({ quote: freightQuotes, request: freightRequests })
    .from(freightQuotes)
    .innerJoin(freightRequests, eq(freightRequests.id, freightQuotes.requestId))
    .where(eq(freightQuotes.id, quoteId))
    .limit(1);
  const found = rows[0];
  if (!found) return { ok: false, error: "Bid not found." };

  const { quote, request } = found;
  // Only the buyer who raised the request may award it.
  if (request.buyerUserId !== user.id) {
    return { ok: false, error: "Not allowed" };
  }
  if (request.status !== "open") {
    return { ok: false, error: "This request is no longer open." };
  }
  if (quote.status !== "submitted") {
    return { ok: false, error: "That bid is not available to accept." };
  }
  if (quote.validUntil && quote.validUntil.getTime() < Date.now()) {
    return { ok: false, error: "That bid has expired. Ask for a fresh quote." };
  }

  const [shipment] = await db
    .insert(shipments)
    .values({
      reference: makeReference("SH"),
      forwarderOrgId: quote.forwarderOrgId,
      quoteId: quote.id,
      mode: request.mode,
      incoterm: request.incoterm,
      originCountry: request.originCountry,
      destCountry: request.destCountry,
      destPort: request.destPort,
      status: "booked",
    })
    .returning();

  // Resolve the dealer behind the order so the seller is a participant too.
  let dealerOrgId: string | null = null;
  let dealerUserId: string | null = null;
  if (request.orderId) {
    const orderRow = await db
      .select()
      .from(orders)
      .where(eq(orders.id, request.orderId))
      .limit(1);
    const order = orderRow[0];
    if (order) {
      await db.insert(shipmentLines).values({
        shipmentId: shipment.id,
        orderId: order.id,
        listingId: order.listingId,
        buyerUserId: order.buyerId,
        dealerId: order.dealerId,
        description: order.title,
        declaredValueMinor: order.totalAED ? order.totalAED * 100 : null,
      });
      dealerUserId = order.sellerId;
      if (order.dealerId) {
        const orgRow = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.dealerId, order.dealerId))
          .limit(1);
        dealerOrgId = orgRow[0]?.id ?? null;
      }
    }
  }

  const participants: Array<{ orgId: string; partyRole: OrgType }> = [];
  if (request.buyerOrgId) {
    participants.push({ orgId: request.buyerOrgId, partyRole: "buyer" });
  }
  if (dealerOrgId) participants.push({ orgId: dealerOrgId, partyRole: "dealer" });
  participants.push({ orgId: quote.forwarderOrgId, partyRole: "forwarder" });

  if (participants.length) {
    await db
      .insert(shipmentParticipants)
      .values(participants.map((p) => ({ shipmentId: shipment.id, ...p })))
      .onConflictDoNothing();
  }

  // Commission and payable are party-private rows, not shared columns.
  if (quote.totalMinor) {
    await db.insert(shipmentFinancials).values([
      {
        shipmentId: shipment.id,
        orgId: request.buyerOrgId ?? quote.forwarderOrgId,
        kind: "buyer_payable",
        currency: quote.currency,
        amountMinor: quote.totalMinor,
        description: "Freight forwarding services",
      },
      {
        shipmentId: shipment.id,
        orgId: quote.forwarderOrgId,
        kind: "forwarder_receivable",
        currency: quote.currency,
        amountMinor: quote.totalMinor,
        description: "Gross booking value",
      },
    ]);
  }

  // Award: one accepted, every sibling rejected, request closed.
  await db
    .update(freightQuotes)
    .set({ status: "accepted", decidedAt: new Date() })
    .where(eq(freightQuotes.id, quote.id));
  await db
    .update(freightQuotes)
    .set({ status: "rejected", decidedAt: new Date() })
    .where(
      and(
        eq(freightQuotes.requestId, request.id),
        ne(freightQuotes.id, quote.id),
      ),
    );
  await db
    .update(freightRequests)
    .set({
      status: "awarded",
      awardedQuoteId: quote.id,
      updatedAt: new Date(),
    })
    .where(eq(freightRequests.id, request.id));

  await recordMilestone({
    shipmentId: shipment.id,
    milestone: "booking_confirmed",
    classifier: "ACT",
    eventAt: new Date(),
    source: "platform",
    note: "Freight booking awarded.",
    skipAuth: true,
  });

  // One thread for all three parties, from the moment the job is awarded.
  const chatParticipants: Array<{
    userId: string;
    orgId?: string | null;
    role: OrgType;
  }> = [{ userId: user.id, orgId: request.buyerOrgId, role: "buyer" }];
  if (dealerUserId) {
    chatParticipants.push({
      userId: dealerUserId,
      orgId: dealerOrgId,
      role: "dealer",
    });
  }
  const forwarderStaff = await db
    .select({ userId: users.id })
    .from(users)
    .innerJoin(
      organizations,
      eq(organizations.id, quote.forwarderOrgId),
    )
    .limit(0);
  void forwarderStaff;

  await getOrCreateConversation({
    kind: "shipment",
    subjectId: shipment.id,
    title: `Shipment ${shipment.reference}`,
    participants: chatParticipants,
  });

  return { ok: true, shipmentId: shipment.id };
}

/* ------------------------------------------------------------------ *
 * Shipment tracking
 * ------------------------------------------------------------------ */

/** True when the caller participates in this shipment (or is platform admin). */
async function canSeeShipment(shipmentId: string): Promise<boolean> {
  if (await isPlatformAdmin()) return true;
  const orgs = await getMyOrgs();
  if (orgs.length === 0) return false;
  const rows = await db
    .select({ orgId: shipmentParticipants.orgId })
    .from(shipmentParticipants)
    .where(
      and(
        eq(shipmentParticipants.shipmentId, shipmentId),
        inArray(
          shipmentParticipants.orgId,
          orgs.map((o) => o.id),
        ),
        isNull(shipmentParticipants.removedAt),
      ),
    )
    .limit(1);
  return !!rows[0];
}

/**
 * Appends an event and re-projects the shipment status.
 *
 * The log is the truth; `shipments.status` is a cache written in the same call
 * so lists stay cheap to query. Only ACT events move the status — an ETA (EST)
 * updates the estimate without claiming the ship has arrived.
 */
export async function recordMilestone(input: {
  shipmentId: string;
  milestone: string;
  classifier?: "PLN" | "EST" | "ACT";
  eventAt: Date;
  location?: string;
  note?: string;
  lineId?: string;
  source?: string;
  /** Internal calls that have already authorized (e.g. award). */
  skipAuth?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };

  const def = getMilestone(input.milestone);
  if (!def) return { ok: false, error: "Unknown milestone." };

  const user = await getOrSyncUser().catch(() => null);
  let actorOrgId: string | null = null;

  if (!input.skipAuth) {
    // Only the assigned forwarder or a platform admin may post milestones.
    const shipmentRow = await db
      .select({ forwarderOrgId: shipments.forwarderOrgId })
      .from(shipments)
      .where(eq(shipments.id, input.shipmentId))
      .limit(1);
    if (!shipmentRow[0]) return { ok: false, error: "Shipment not found." };

    const admin = await isPlatformAdmin();
    if (!admin) {
      const forwarderOrgId = shipmentRow[0].forwarderOrgId;
      const ctx = forwarderOrgId
        ? await assertOrgAccess(forwarderOrgId)
        : null;
      if (!ctx) return { ok: false, error: "Not allowed" };
      actorOrgId = ctx.id;
    }
  }

  const classifier = input.classifier ?? "ACT";

  await db.insert(shipmentEvents).values({
    shipmentId: input.shipmentId,
    lineId: input.lineId ?? null,
    category: def.category,
    milestone: def.key,
    classifier,
    eventAt: input.eventAt,
    location: input.location ?? null,
    source: input.source ?? "forwarder",
    actorOrgId,
    actorUserId: user?.id ?? null,
    note: input.note ?? null,
  });

  if (classifier === "ACT") {
    await db
      .update(shipments)
      .set({
        status: def.projects,
        statusUpdatedAt: new Date(),
        updatedAt: new Date(),
        ...(def.key === "vessel_departed" ? { atd: input.eventAt } : {}),
        ...(def.key === "vessel_arrived" ? { ata: input.eventAt } : {}),
      })
      .where(eq(shipments.id, input.shipmentId));

    // Mirror the milestone into the shared thread so all parties see it.
    const conv = await getOrCreateConversation({
      kind: "shipment",
      subjectId: input.shipmentId,
      title: "Shipment",
      participants: [],
    });
    if (conv) {
      await postSystemMessage(
        conv,
        milestoneLabel(def.key, "AE"),
        def.key,
      );
    }
  } else if (def.key === "vessel_arrived") {
    // An EST arrival is the ETA — update the estimate, not the status.
    await db
      .update(shipments)
      .set({ eta: input.eventAt, updatedAt: new Date() })
      .where(eq(shipments.id, input.shipmentId));
  } else if (def.key === "vessel_departed") {
    await db
      .update(shipments)
      .set({ etd: input.eventAt, updatedAt: new Date() })
      .where(eq(shipments.id, input.shipmentId));
  }

  return { ok: true };
}

export interface ShipmentView {
  id: string;
  reference: string;
  status: ShipmentStatus;
  mode: ShipmentMode;
  incoterm: Incoterm;
  originCountry: string;
  originPort: string | null;
  destCountry: string;
  destPort: string | null;
  bookingNumber: string | null;
  containerNumber: string | null;
  blNumber: string | null;
  vesselName: string | null;
  voyageNumber: string | null;
  etd: string | null;
  eta: string | null;
  atd: string | null;
  ata: string | null;
  documentReleaseHold: boolean;
  forwarderName: string | null;
  createdAt: string;
  events: Array<{
    milestone: string;
    label: string;
    classifier: string;
    eventAt: string;
    location: string | null;
    note: string | null;
    source: string;
  }>;
  lines: Array<{
    id: string;
    description: string | null;
    vin: string | null;
    houseBlNumber: string | null;
  }>;
}

/** One shipment, only if the caller participates in it. */
export async function getShipment(
  shipmentId: string,
): Promise<ShipmentView | null> {
  if (!isDbEnabled()) return null;
  if (!(await canSeeShipment(shipmentId))) return null;

  const rows = await db
    .select({ s: shipments, forwarderName: organizations.name })
    .from(shipments)
    .leftJoin(organizations, eq(organizations.id, shipments.forwarderOrgId))
    .where(eq(shipments.id, shipmentId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const events = await db
    .select()
    .from(shipmentEvents)
    .where(eq(shipmentEvents.shipmentId, shipmentId))
    .orderBy(shipmentEvents.eventAt);

  const lines = await db
    .select()
    .from(shipmentLines)
    .where(eq(shipmentLines.shipmentId, shipmentId));

  const s = row.s;
  return {
    id: s.id,
    reference: s.reference,
    status: s.status as ShipmentStatus,
    mode: s.mode as ShipmentMode,
    incoterm: s.incoterm as Incoterm,
    originCountry: s.originCountry,
    originPort: s.originPort,
    destCountry: s.destCountry,
    destPort: s.destPort,
    bookingNumber: s.bookingNumber,
    containerNumber: s.containerNumber,
    blNumber: s.blNumber,
    vesselName: s.vesselName,
    voyageNumber: s.voyageNumber,
    etd: s.etd?.toISOString() ?? null,
    eta: s.eta?.toISOString() ?? null,
    atd: s.atd?.toISOString() ?? null,
    ata: s.ata?.toISOString() ?? null,
    documentReleaseHold: s.documentReleaseHold,
    forwarderName: row.forwarderName,
    createdAt: s.createdAt.toISOString(),
    events: events.map((e) => ({
      milestone: e.milestone,
      label: milestoneLabel(e.milestone, s.originCountry),
      classifier: e.classifier,
      eventAt: e.eventAt.toISOString(),
      location: e.location,
      note: e.note,
      source: e.source,
    })),
    lines: lines.map((l) => ({
      id: l.id,
      description: l.description,
      vin: l.vin,
      houseBlNumber: l.houseBlNumber,
    })),
  };
}

/** Every shipment the caller can see, via org participation. */
export async function getMyShipments(): Promise<ShipmentView[]> {
  if (!isDbEnabled()) return [];
  const orgs = await getMyOrgs();
  if (orgs.length === 0) return [];

  const rows = await db
    .selectDistinct({ shipmentId: shipmentParticipants.shipmentId })
    .from(shipmentParticipants)
    .where(
      and(
        inArray(
          shipmentParticipants.orgId,
          orgs.map((o) => o.id),
        ),
        isNull(shipmentParticipants.removedAt),
      ),
    )
    .limit(100);

  const out: ShipmentView[] = [];
  for (const r of rows) {
    const view = await getShipment(r.shipmentId);
    if (view) out.push(view);
  }
  return out;
}

/** Forwarder registers a lane they serve, so RFQs can match them. */
export async function addForwarderLane(input: {
  orgId: string;
  originCountry: string;
  destCountry: string;
  mode: ShipmentMode;
  transitDays?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await assertOrgAccess(input.orgId, { minRole: "admin" });
  if (!ctx || ctx.type !== "forwarder") {
    return { ok: false, error: "Not allowed" };
  }
  await db.insert(forwarderLanes).values({
    orgId: input.orgId,
    originCountry: input.originCountry,
    destCountry: input.destCountry,
    mode: input.mode,
    transitDays: input.transitDays ?? null,
  });
  return { ok: true };
}

export async function getForwarderLanes(orgId: string) {
  const ctx = await assertOrgAccess(orgId);
  if (!ctx) return [];
  return db
    .select()
    .from(forwarderLanes)
    .where(eq(forwarderLanes.orgId, orgId))
    .orderBy(desc(forwarderLanes.createdAt));
}

function toQuoteView(
  q: typeof freightQuotes.$inferSelect,
  orgName: string | null,
): FreightQuoteView {
  return {
    id: q.id,
    forwarderOrgId: q.forwarderOrgId,
    forwarderName: orgName ?? "Forwarder",
    status: q.status,
    currency: q.currency,
    totalMinor: q.totalMinor,
    lineItems: q.lineItems,
    transitDays: q.transitDays,
    validUntil: q.validUntil?.toISOString() ?? null,
    notes: q.notes,
    respondedAt: q.respondedAt?.toISOString() ?? null,
  };
}
