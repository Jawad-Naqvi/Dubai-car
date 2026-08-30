import "server-only";
import type { MockListing } from "@/lib/mock-data";

export type DemoListing = MockListing & {
  moderationStatus:
    | "draft"
    | "pending_review"
    | "active"
    | "rejected"
    | "archived";
  ownerUserId?: string;
  createdAt: string;
  viewCount: number;
  inquiryCount: number;
};

/**
 * In-memory store used ONLY when no real database is configured. It lets every
 * write flow (leads, new listings, valuations, export & B2B requests) actually
 * persist for the lifetime of the dev server, so the whole product is
 * demonstrable end-to-end before Neon is wired. A `globalThis` cache keeps the
 * data alive across Next.js hot reloads. Once DATABASE_URL is real, the data
 * layer ignores this entirely and reads/writes Postgres.
 */
export interface DemoLead {
  id: string;
  listingId?: string;
  listingTitle?: string;
  type: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  message?: string;
  destinationCountry?: string;
  quantity?: number;
  shippingPreference?: string;
  feeAED: number;
  status: string;
  createdAt: string;
}

export interface DemoLeadReply {
  id: string;
  leadId: string;
  senderRole: "buyer" | "dealer";
  body: string;
  createdAt: string;
}

export interface DemoValuation {
  id: string;
  make: string;
  model: string;
  year: number;
  kms: number;
  condition: string;
  estimatedValueAED: number;
  low: number;
  high: number;
  createdAt: string;
}

export interface DemoB2BBuyer {
  id: string;
  companyName: string;
  country: string;
  contactPhone?: string;
  email?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface DemoPayment {
  id: string;
  amountAED: number;
  type: string;
  gateway: string;
  status: string;
  description: string;
  createdAt: string;
}

/** A quotation request — the B2B counterpart to a lead. */
export interface DemoQuote {
  id: string;
  reference: string;
  listingId?: string;
  listingTitle?: string;
  dealerSlug?: string;
  dealerName: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerCompany?: string;
  quantity: number;
  requirements?: string;
  targetUnitPriceAED?: number;
  destinationCountry?: string;
  quotedUnitPriceAED?: number;
  quotedTotalAED?: number;
  quotedQuantity?: number;
  quotedNotes?: string;
  validUntil?: string;
  respondedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoQuoteMessage {
  id: string;
  quoteId: string;
  senderRole: "buyer" | "dealer";
  body: string;
  createdAt: string;
}

export interface DemoOrder {
  id: string;
  reference: string;
  quoteId?: string;
  listingId?: string;
  dealerName: string;
  dealerSlug?: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  kind: "retail" | "bulk";
  title: string;
  quantity: number;
  unitPriceAED: number;
  totalAED: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Store {
  leads: DemoLead[];
  leadReplies: DemoLeadReply[];
  newListings: DemoListing[];
  valuations: DemoValuation[];
  b2bBuyers: DemoB2BBuyer[];
  payments: DemoPayment[];
  quotes: DemoQuote[];
  quoteMessages: DemoQuoteMessage[];
  orders: DemoOrder[];
  currentTier: string;
}

const g = globalThis as unknown as { __dxbDemo?: Partial<Store> };

export function demoStore(): Store {
  const s = (g.__dxbDemo ??= {});
  // Backfill any fields added after the global was first created (survives HMR).
  s.leads ??= [];
  s.leadReplies ??= [];
  s.newListings ??= [];
  s.valuations ??= [];
  s.b2bBuyers ??= [];
  s.quotes ??= [];
  s.quoteMessages ??= [];
  s.orders ??= [];
  s.currentTier ??= "gold";
  if (!s.payments) {
    s.payments = [
      {
        id: "INV-SEED-1",
        amountAED: 699,
        type: "subscription",
        gateway: "paytabs",
        status: "paid",
        description: "Gold subscription · current period",
        createdAt: new Date().toISOString(),
      },
    ];
  }
  return s as Store;
}

let counter = 1000;
export function demoId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

/**
 * Human-facing reference for quotes/orders (QT-M4K2P9, OR-M4K2QB).
 *
 * Derived from the clock plus randomness rather than a counter: an in-memory
 * counter restarts with the process, which collided with references already in
 * the database and broke the write with a unique-constraint error. Time-based
 * ids keep working across restarts, deploys and multiple server instances.
 */
export function makeReference(prefix: "QT" | "OR") {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  // 4 random chars (~1.7M combinations) so two references minted in the same
  // millisecond — concurrent requests — still don't collide.
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6).padEnd(4, "0");
  return `${prefix}-${stamp}${rand}`;
}
