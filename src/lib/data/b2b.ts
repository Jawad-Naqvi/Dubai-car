import "server-only";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { b2bBuyers, exportInquiries, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore, demoId, type DemoB2BBuyer } from "./demo-store";
import type { CurrentUser } from "./users";
import { sendEmail } from "@/lib/notify";

export const b2bRegisterSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  country: z.string().min(2, "Country is required"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  tradeLicenseUrl: z.string().optional(),
});

export type B2BRegisterInput = z.infer<typeof b2bRegisterSchema>;

export async function registerB2BBuyer(
  raw: unknown,
  user?: CurrentUser,
): Promise<{ id: string }> {
  const input = b2bRegisterSchema.parse(raw);

  if (!isDbEnabled()) {
    const buyer: DemoB2BBuyer = {
      id: demoId("B2B"),
      companyName: input.companyName,
      country: input.country,
      contactPhone: input.contactPhone,
      email: input.email || undefined,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    demoStore().b2bBuyers.unshift(buyer);
    return { id: buyer.id };
  }

  // Attach to the signed-in user, or create a lightweight importer account from
  // the submitted contact details (so guest registrations still persist).
  let userId = user?.id;
  if (!userId) {
    const email =
      input.email || `b2b+${Date.now()}@guest.${"dxbmotors.ae"}`;
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) {
      userId = existing[0].id;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          clerkId: `guest_b2b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          email,
          name: input.contactName || input.companyName,
          role: "b2b_importer",
        })
        .returning({ id: users.id });
      userId = created.id;
    }
  }

  const [row] = await db
    .insert(b2bBuyers)
    .values({
      userId,
      companyName: input.companyName,
      country: input.country,
      contactPhone: input.contactPhone,
      tradeLicenseUrl: input.tradeLicenseUrl,
      isVerified: false,
    })
    .onConflictDoNothing()
    .returning({ id: b2bBuyers.id });

  await db
    .update(users)
    .set({ role: "b2b_importer" })
    .where(eq(users.id, userId));

  return { id: row?.id ?? "existing" };
}

export interface B2BBuyerView {
  id: string;
  companyName: string;
  country: string;
  contactPhone?: string;
  email?: string;
  isVerified: boolean;
  createdAt: string;
}

export async function getB2BBuyers(): Promise<B2BBuyerView[]> {
  if (!isDbEnabled()) {
    return demoStore().b2bBuyers.map((b) => ({ ...b }));
  }
  const rows = await db
    .select()
    .from(b2bBuyers)
    .orderBy(desc(b2bBuyers.createdAt))
    .limit(200);
  return rows.map((b) => ({
    id: b.id,
    companyName: b.companyName,
    country: b.country,
    contactPhone: b.contactPhone ?? undefined,
    isVerified: b.isVerified,
    createdAt: b.createdAt.toISOString(),
  }));
}

/** The importer (b2b_buyers) record for a signed-in user, if they have one. */
export async function getB2BBuyerForUser(
  userId: string,
): Promise<B2BBuyerView | null> {
  if (!isDbEnabled()) {
    const b = demoStore().b2bBuyers[0];
    return b ? { ...b } : null;
  }
  try {
    const rows = await db
      .select()
      .from(b2bBuyers)
      .where(eq(b2bBuyers.userId, userId))
      .limit(1);
    const b = rows[0];
    if (!b) return null;
    return {
      id: b.id,
      companyName: b.companyName,
      country: b.country,
      contactPhone: b.contactPhone ?? undefined,
      isVerified: b.isVerified,
      createdAt: b.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export interface ExportInquiryView {
  id: string;
  destinationCountry: string;
  vehicleCount: number;
  shippingPreference?: string;
  docRequests: string[];
  notes?: string;
  status: string;
  createdAt: string;
}

/**
 * Export inquiries submitted by a signed-in importer. Joins export_inquiries →
 * b2b_buyers on the buyer's userId. Read-only. Falls back to sample inquiries in
 * demo mode so the page always renders.
 */
export async function getExportInquiriesForUser(
  userId: string,
): Promise<ExportInquiryView[]> {
  if (!isDbEnabled()) {
    const now = Date.now();
    return [
      {
        id: "EXP-1",
        destinationCountry: "Kenya",
        vehicleCount: 3,
        shippingPreference: "RoRo",
        docRequests: ["Export Certificate", "RTA Deregistration Letter"],
        notes: "Right-hand-drive SUVs preferred.",
        status: "new",
        createdAt: new Date(now - 3 * 24 * 3600_000).toISOString(),
      },
      {
        id: "EXP-2",
        destinationCountry: "Nigeria",
        vehicleCount: 8,
        shippingPreference: "Container",
        docRequests: ["Vehicle Title / Ownership"],
        notes: undefined,
        status: "quoted",
        createdAt: new Date(now - 9 * 24 * 3600_000).toISOString(),
      },
    ];
  }
  try {
    const rows = await db
      .select({
        id: exportInquiries.id,
        destinationCountry: exportInquiries.destinationCountry,
        listingIds: exportInquiries.listingIds,
        shippingPreference: exportInquiries.shippingPreference,
        docRequests: exportInquiries.docRequests,
        notes: exportInquiries.notes,
        status: exportInquiries.status,
        createdAt: exportInquiries.createdAt,
      })
      .from(exportInquiries)
      .innerJoin(b2bBuyers, eq(exportInquiries.b2bBuyerId, b2bBuyers.id))
      .where(eq(b2bBuyers.userId, userId))
      .orderBy(desc(exportInquiries.createdAt))
      .limit(100);
    return rows.map((r) => ({
      id: r.id,
      destinationCountry: r.destinationCountry,
      vehicleCount: (r.listingIds ?? []).length,
      shippingPreference: r.shippingPreference ?? undefined,
      docRequests: r.docRequests ?? [],
      notes: r.notes ?? undefined,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

/**
 * Request an export document for the signed-in importer's most recent
 * inquiry — appends to that inquiry's real docRequests column and emails the
 * export desk, replacing the old localStorage-only "Request" button.
 */
export async function requestExportDoc(userId: string, docKey: string): Promise<void> {
  if (!isDbEnabled()) return; // demo mode has no persisted inquiries to attach to

  const [buyer] = await db
    .select({ id: b2bBuyers.id, companyName: b2bBuyers.companyName })
    .from(b2bBuyers)
    .where(eq(b2bBuyers.userId, userId))
    .limit(1);
  if (!buyer) throw new Error("No importer account found.");

  const [inquiry] = await db
    .select({ id: exportInquiries.id, docRequests: exportInquiries.docRequests })
    .from(exportInquiries)
    .where(eq(exportInquiries.b2bBuyerId, buyer.id))
    .orderBy(desc(exportInquiries.createdAt))
    .limit(1);
  if (!inquiry) {
    throw new Error("Submit an export inquiry before requesting documents.");
  }

  const next = Array.from(new Set([...(inquiry.docRequests ?? []), docKey]));
  await db
    .update(exportInquiries)
    .set({ docRequests: next })
    .where(eq(exportInquiries.id, inquiry.id));

  await sendEmail({
    to: process.env.LEADS_NOTIFY_EMAIL,
    subject: `Document request from ${buyer.companyName}`,
    body: `${buyer.companyName} requested "${docKey}" for export inquiry ${inquiry.id}. Coordinate with the seller and reply to the importer.`,
    label: "b2b doc request",
  });
}

export async function verifyB2BBuyer(
  id: string,
  verified: boolean,
): Promise<boolean> {
  if (!isDbEnabled()) {
    const b = demoStore().b2bBuyers.find((x) => x.id === id);
    if (b) b.isVerified = verified;
    return true;
  }
  await db
    .update(b2bBuyers)
    .set({ isVerified: verified, verifiedAt: verified ? new Date() : null })
    .where(eq(b2bBuyers.id, id));
  return true;
}
