import "server-only";
import type { MockListing } from "@/lib/mock-data";

export type DemoListing = MockListing & {
  moderationStatus: "pending_review" | "active" | "rejected" | "archived";
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

interface Store {
  leads: DemoLead[];
  newListings: DemoListing[];
  valuations: DemoValuation[];
  b2bBuyers: DemoB2BBuyer[];
  payments: DemoPayment[];
  currentTier: string;
}

const g = globalThis as unknown as { __dxbDemo?: Partial<Store> };

export function demoStore(): Store {
  const s = (g.__dxbDemo ??= {});
  // Backfill any fields added after the global was first created (survives HMR).
  s.leads ??= [];
  s.newListings ??= [];
  s.valuations ??= [];
  s.b2bBuyers ??= [];
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
