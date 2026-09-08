import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  uuid,
  doublePrecision,
  index,
  uniqueIndex,
  primaryKey,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/** Postgres bytea <-> Node Buffer (node-postgres maps these natively). */
export const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

/* === Enums === */
export const roleEnum = pgEnum("role", [
  "buyer",
  "dealer",
  "b2b_importer",
  "admin",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "silver",
  "gold",
  "platinum",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending_review",
  "active",
  "reserved",
  "sold",
  "archived",
  "rejected",
]);

export const leadTypeEnum = pgEnum("lead_type", [
  "inquiry",
  "contact_unlock",
  "test_drive",
  "export_inquiry",
  "finance_preapproval",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "subscription",
  "lead_unlock",
  "featured_listing",
  "b2b_connection",
]);

export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "paytabs",
  "stripe",
]);

export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "approved",
  "rejected",
]);

/**
 * How a listing can be bought. This is the single switch that makes the
 * marketplace feel B2C or B2B *per listing* rather than app-wide:
 *  - retail     → priced, buy/contact only (the default; a normal consumer car)
 *  - both       → priced AND open to bulk quote requests
 *  - quote_only → no public transaction price; bulk buyers request a quote
 */
export const saleModeEnum = pgEnum("sale_mode", ["retail", "both", "quote_only"]);

/** Quotation lifecycle: request → dealer response → buyer decision → order. */
export const quoteStatusEnum = pgEnum("quote_status", [
  "requested",
  "under_review",
  "responded",
  "accepted",
  "declined",
  "withdrawn",
  "expired",
]);

/** Order lifecycle for both single-car (B2C) and bulk (B2B) purchases. */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

/* === Users (mirror Clerk) === */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: varchar("clerk_id", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    name: varchar("name", { length: 160 }),
    imageUrl: text("image_url"),
    role: roleEnum("role").notNull().default("buyer"),
    preferredLocale: varchar("preferred_locale", { length: 8 }).default("en"),
    /**
     * Emirates ID identity verification — required for EVERY account (both
     * "individual" and "dealer" signups) before they can sell. The number is
     * globally unique so one Emirates ID maps to exactly one account (blocks
     * duplicate accounts). Dealers additionally provide a trade license on the
     * dealers table. Stored here (not only on dealers) so the uniqueness rule
     * and the "verified" gate apply to individuals too.
     */
    emiratesIdNumber: varchar("emirates_id_number", { length: 32 }),
    emiratesIdFrontUrl: text("emirates_id_front_url"),
    emiratesIdBackUrl: text("emirates_id_back_url"),
    idSubmittedAt: timestamp("id_submitted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    clerkIdx: uniqueIndex("users_clerk_idx").on(t.clerkId),
    emailIdx: index("users_email_idx").on(t.email),
    // One Emirates ID = one account. NULLs are allowed (multiple), so
    // unverified accounts don't collide; only real ID numbers are unique.
    emiratesIdIdx: uniqueIndex("users_emirates_id_idx").on(t.emiratesIdNumber),
  }),
);

/* === Dealers === */
export const dealers = pgTable(
  "dealers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clerkOrgId: varchar("clerk_org_id", { length: 64 }),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    businessName: varchar("business_name", { length: 200 }).notNull(),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    tagline: varchar("tagline", { length: 240 }),
    description: text("description"),
    tradeLicense: varchar("trade_license", { length: 64 }),
    tradeLicenseDocUrl: text("trade_license_doc_url"),
    emirate: varchar("emirate", { length: 32 }).notNull(),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    workingHours: jsonb("working_hours"),
    phone: varchar("phone", { length: 32 }),
    whatsapp: varchar("whatsapp", { length: 32 }),
    website: text("website"),
    subscriptionTier: subscriptionTierEnum("subscription_tier")
      .notNull()
      .default("free"),
    listingQuotaUsed: integer("listing_quota_used").notNull().default(0),
    isVerified: boolean("is_verified").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    verifiedAt: timestamp("verified_at"),
    /** Seller onboarding review state — gates promotion to the "dealer" role. */
    kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
    emiratesIdNumber: varchar("emirates_id_number", { length: 32 }),
    emiratesIdFrontUrl: text("emirates_id_front_url"),
    emiratesIdBackUrl: text("emirates_id_back_url"),
    kycRejectionReason: text("kyc_rejection_reason"),
    kycSubmittedAt: timestamp("kyc_submitted_at"),
    kycReviewedAt: timestamp("kyc_reviewed_at"),
    stripeCustomerId: varchar("stripe_customer_id", { length: 128 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }),
    /** Tier a Stripe Checkout session is currently open for, until the webhook confirms it. */
    pendingTier: subscriptionTierEnum("pending_tier"),
    rating: doublePrecision("rating").default(0),
    reviewCount: integer("review_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("dealers_slug_idx").on(t.slug),
    emirateIdx: index("dealers_emirate_idx").on(t.emirate),
  }),
);

/* === Subscriptions === */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealerId: uuid("dealer_id")
    .notNull()
    .references(() => dealers.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  periodStart: timestamp("period_start").defaultNow().notNull(),
  periodEnd: timestamp("period_end"),
  paytabsRef: varchar("paytabs_ref", { length: 128 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* === Listings === */
export const listings = pgTable(
  "listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "cascade",
    }),
    sellerId: uuid("seller_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    make: varchar("make", { length: 64 }).notNull(),
    model: varchar("model", { length: 96 }).notNull(),
    trim: varchar("trim", { length: 96 }),
    year: integer("year").notNull(),
    bodyType: varchar("body_type", { length: 32 }),
    fuel: varchar("fuel", { length: 24 }),
    transmission: varchar("transmission", { length: 24 }),
    drivetrain: varchar("drivetrain", { length: 32 }),
    /** Denormalised deal score ("Great"|"Good"|"Fair") vs make/model median. */
    dealRating: varchar("deal_rating", { length: 16 }),
    kms: integer("kms").notNull().default(0),
    colorExterior: varchar("color_exterior", { length: 32 }),
    colorInterior: varchar("color_interior", { length: 32 }),
    regionalSpec: varchar("regional_spec", { length: 32 }),
    vin: varchar("vin", { length: 32 }),
    cylinders: integer("cylinders"),
    doors: integer("doors"),
    seats: integer("seats"),
    horsepower: integer("horsepower"),
    priceAED: bigint("price_aed", { mode: "number" }).notNull(),
    /** Denormalised: the price before the most recent change (for drop badges). */
    previousPrice: bigint("previous_price", { mode: "number" }),
    priceUpdatedAt: timestamp("price_updated_at"),
    monthlyEMI: integer("monthly_emi"),
    condition: varchar("condition", { length: 32 }),
    description: text("description"),
    features: jsonb("features").$type<string[]>().default([]),
    emirate: varchar("emirate", { length: 32 }).notNull(),
    locationLat: doublePrecision("location_lat"),
    locationLng: doublePrecision("location_lng"),
    status: listingStatusEnum("status").notNull().default("draft"),
    /**
     * Purchase configuration — set by the seller when listing. Drives which
     * CTAs the buyer sees (Contact/Buy, Request bulk quote, or both).
     */
    saleMode: saleModeEnum("sale_mode").notNull().default("retail"),
    /** Minimum units a bulk buyer must request (only meaningful when bulk is on). */
    bulkMinQty: integer("bulk_min_qty").notNull().default(2),
    /** Units the seller has available at this spec (1 for a single used car). */
    stockQty: integer("stock_qty").notNull().default(1),
    isExportReady: boolean("is_export_ready").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isInspected: boolean("is_inspected").notNull().default(false),
    featuredUntil: timestamp("featured_until"),
    viewCount: integer("view_count").notNull().default(0),
    inquiryCount: integer("inquiry_count").notNull().default(0),
    publishedAt: timestamp("published_at"),
    soldAt: timestamp("sold_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("listings_slug_idx").on(t.slug),
    statusIdx: index("listings_status_idx").on(t.status),
    makeModelIdx: index("listings_make_model_idx").on(t.make, t.model),
    priceIdx: index("listings_price_idx").on(t.priceAED),
    emirateIdx: index("listings_emirate_idx").on(t.emirate),
    dealerIdx: index("listings_dealer_idx").on(t.dealerId),
    exportIdx: index("listings_export_idx").on(t.isExportReady),
  }),
);

/**
 * Timestamped listing-view events — one row per detail-page view. Powers
 * time-range analytics (today / last 7 / last 30 days) which the denormalised
 * listings.viewCount counter can't answer. Kept lean (listing + timestamp);
 * dealer/seller scoping is derived by joining to listings.
 */
export const listingViewEvents = pgTable(
  "listing_view_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    listingIdx: index("view_events_listing_idx").on(t.listingId),
    createdIdx: index("view_events_created_idx").on(t.createdAt),
  }),
);
export type ListingViewEvent = typeof listingViewEvents.$inferSelect;

export const listingMedia = pgTable("listing_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: varchar("type", { length: 16 }).notNull().default("photo"),
  isHero: boolean("is_hero").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Uploaded image bytes stored in Postgres (no external object store / no local
 * disk needed — survives serverless deploys). Served by GET /api/media/[id].
 * Used when Cloudflare R2 is not configured.
 */
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  mimeType: varchar("mime_type", { length: 64 }).notNull().default("image/jpeg"),
  size: integer("size").notNull().default(0),
  data: bytea("data").notNull(),
  /**
   * SECURITY: identity documents must not share a public namespace with car
   * photos. "public" is served to anyone (listing images); "private" requires
   * the uploading user/org or a platform admin. Defaults to public so existing
   * listing media keeps working; every KYC upload sets "private" explicitly.
   */
  visibility: varchar("visibility", { length: 16 }).notNull().default("public"),
  ownerUserId: uuid("owner_user_id"),
  ownerOrgId: uuid("owner_org_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type MediaAsset = typeof mediaAssets.$inferSelect;

/* === Leads === */
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").references(() => listings.id, {
    onDelete: "cascade",
  }),
  buyerId: uuid("buyer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  dealerId: uuid("dealer_id").references(() => dealers.id, {
    onDelete: "cascade",
  }),
  type: leadTypeEnum("type").notNull(),
  feeAED: integer("fee_aed").notNull().default(0),
  paid: boolean("paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  message: text("message"),
  buyerName: varchar("buyer_name", { length: 160 }),
  buyerEmail: varchar("buyer_email", { length: 320 }),
  buyerPhone: varchar("buyer_phone", { length: 32 }),
  destinationCountry: varchar("destination_country", { length: 64 }),
  quantity: integer("quantity"),
  shippingPreference: varchar("shipping_preference", { length: 32 }),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* === Lead replies (two-way thread on top of a one-shot lead) === */
export const leadReplies = pgTable("lead_replies", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  senderRole: varchar("sender_role", { length: 16 }).notNull(), // "buyer" | "dealer"
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* === Saved listings & searches === */
export const savedListings = pgTable(
  "saved_listings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.listingId] }) }),
);

/** Cross-device compare tray for signed-in users (mirrors saved_listings). */
export const compareListings = pgTable(
  "compare_listings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.listingId] }) }),
);

export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }),
  query: jsonb("query").$type<Record<string, string>>().notNull(),
  alertFrequency: varchar("alert_frequency", { length: 16 }).default("daily"),
  /** High-water mark: only listings newer than this are "new matches". */
  lastNotifiedAt: timestamp("last_notified_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SavedSearch = typeof savedSearches.$inferSelect;

/* === Trust: dealer reviews === */
export const dealerReviews = pgTable("dealer_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  dealerId: uuid("dealer_id")
    .notNull()
    .references(() => dealers.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: varchar("author_name", { length: 120 }),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 160 }),
  body: text("body"),
  /** published | pending | rejected */
  status: varchar("status", { length: 16 }).notNull().default("published"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type DealerReview = typeof dealerReviews.$inferSelect;

/* === Trust: listing reports (fraud / scam flags) === */
export const listingReports = pgTable("listing_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").references(() => users.id, {
    onDelete: "set null",
  }),
  reason: varchar("reason", { length: 64 }).notNull(),
  details: text("details"),
  reporterEmail: varchar("reporter_email", { length: 200 }),
  /** open | reviewing | resolved | dismissed */
  status: varchar("status", { length: 16 }).notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ListingReport = typeof listingReports.$inferSelect;

/* === Price history (price-drop tracking + alerts) === */
export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  oldPrice: bigint("old_price", { mode: "number" }).notNull(),
  newPrice: bigint("new_price", { mode: "number" }).notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});
export type PriceHistory = typeof priceHistory.$inferSelect;

/* === Vehicle inspection reports === */
export const listingInspections = pgTable("listing_inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" })
    .unique(),
  inspectorName: varchar("inspector_name", { length: 160 }).notNull(),
  inspectedAt: timestamp("inspected_at").defaultNow().notNull(),
  /** [{ name, items: [{ label, status, note }] }] — see lib/inspection.ts */
  categories: jsonb("categories")
    .$type<import("@/lib/inspection").InspectionCategory[]>()
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ListingInspection = typeof listingInspections.$inferSelect;

/**
 * Vehicle history report for a listing — a dealer/admin-submitted or
 * provider-fetched record (title, owners, accidents, service). One per listing.
 * See lib/vehicle-history.ts for the payload shape.
 */
export const vehicleHistory = pgTable("vehicle_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" })
    .unique(),
  source: varchar("source", { length: 16 }).notNull().default("dealer"),
  vin: varchar("vin", { length: 32 }),
  titleStatus: varchar("title_status", { length: 16 }).notNull().default("clean"),
  owners: integer("owners"),
  accidentsReported: boolean("accidents_reported"),
  odometerConsistent: boolean("odometer_consistent"),
  /** [{ date, severity, note }] */
  accidents: jsonb("accidents")
    .$type<import("@/lib/vehicle-history").AccidentRecord[]>()
    .default([]),
  /** [{ date, km, note }] */
  serviceRecords: jsonb("service_records")
    .$type<import("@/lib/vehicle-history").ServiceRecord[]>()
    .default([]),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type VehicleHistoryRow = typeof vehicleHistory.$inferSelect;

/* === B2B === */
export const b2bBuyers = pgTable("b2b_buyers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  country: varchar("country", { length: 64 }).notNull(),
  tradeLicenseUrl: text("trade_license_url"),
  contactPhone: varchar("contact_phone", { length: 32 }),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exportInquiries = pgTable("export_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  b2bBuyerId: uuid("b2b_buyer_id")
    .notNull()
    .references(() => b2bBuyers.id, { onDelete: "cascade" }),
  listingIds: jsonb("listing_ids").$type<string[]>().notNull(),
  destinationCountry: varchar("destination_country", { length: 64 }).notNull(),
  shippingPreference: varchar("shipping_preference", { length: 32 }),
  docRequests: jsonb("doc_requests").$type<string[]>().default([]),
  notes: text("notes"),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================================
   Quotations — the B2B side of the marketplace.

   A quote can be raised against a specific listing ("I want 10 of these") or
   against a dealer with no listing attached ("I need 20 SUVs, here's my spec").
   It carries its own message thread and converts into an order on acceptance.
   ========================================================================= */
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Human-facing reference shown in dashboards and notifications (QT-XXXXXX). */
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "cascade",
    }),
    /** Private sellers can receive quotes too — routed by sellerId when no dealer. */
    sellerId: uuid("seller_id").references(() => users.id, {
      onDelete: "set null",
    }),
    buyerId: uuid("buyer_id").references(() => users.id, { onDelete: "set null" }),
    buyerName: varchar("buyer_name", { length: 160 }),
    buyerEmail: varchar("buyer_email", { length: 320 }),
    buyerPhone: varchar("buyer_phone", { length: 32 }),
    buyerCompany: varchar("buyer_company", { length: 200 }),
    /* --- What the buyer asked for --- */
    quantity: integer("quantity").notNull().default(1),
    requirements: text("requirements"),
    targetUnitPriceAED: bigint("target_unit_price_aed", { mode: "number" }),
    destinationCountry: varchar("destination_country", { length: 64 }),
    /* --- What the seller came back with --- */
    quotedUnitPriceAED: bigint("quoted_unit_price_aed", { mode: "number" }),
    quotedTotalAED: bigint("quoted_total_aed", { mode: "number" }),
    quotedQuantity: integer("quoted_quantity"),
    quotedNotes: text("quoted_notes"),
    validUntil: timestamp("valid_until"),
    respondedAt: timestamp("responded_at"),
    status: quoteStatusEnum("status").notNull().default("requested"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    dealerIdx: index("quotes_dealer_idx").on(t.dealerId),
    buyerIdx: index("quotes_buyer_idx").on(t.buyerId),
    statusIdx: index("quotes_status_idx").on(t.status),
    listingIdx: index("quotes_listing_idx").on(t.listingId),
  }),
);

/** Negotiation thread on a quote (both sides post here). */
export const quoteMessages = pgTable("quote_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  senderRole: varchar("sender_role", { length: 16 }).notNull(), // "buyer" | "dealer"
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =========================================================================
   Orders — the shared destination of BOTH journeys. A B2C buyer reserving a
   single car and a B2B buyer accepting a bulk quote both land here, so the
   dealer has one place to run their sales pipeline.
   ========================================================================= */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** Set when the order came from an accepted quote (B2B path). */
    quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "cascade",
    }),
    sellerId: uuid("seller_id").references(() => users.id, {
      onDelete: "set null",
    }),
    buyerId: uuid("buyer_id").references(() => users.id, { onDelete: "set null" }),
    buyerName: varchar("buyer_name", { length: 160 }),
    buyerEmail: varchar("buyer_email", { length: 320 }),
    buyerPhone: varchar("buyer_phone", { length: 32 }),
    /** "retail" (single car) | "bulk" (from a quote) — drives buyer-facing wording. */
    kind: varchar("kind", { length: 16 }).notNull().default("retail"),
    title: varchar("title", { length: 240 }),
    quantity: integer("quantity").notNull().default(1),
    unitPriceAED: bigint("unit_price_aed", { mode: "number" }).notNull(),
    totalAED: bigint("total_aed", { mode: "number" }).notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    dealerIdx: index("orders_dealer_idx").on(t.dealerId),
    buyerIdx: index("orders_buyer_idx").on(t.buyerId),
    statusIdx: index("orders_status_idx").on(t.status),
  }),
);

/**
 * In-app notification log. Every dispatch through the notification service
 * writes a row here as well as fanning out to email/WhatsApp, so both buyers
 * and dealers get a durable history instead of only transient emails.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Event key, e.g. "quote.responded" — see lib/notifications/events.ts */
    event: varchar("event", { length: 64 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    href: text("href"),
    /** Which channels actually delivered, e.g. ["email","whatsapp"]. */
    channels: jsonb("channels").$type<string[]>().default([]),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
    createdIdx: index("notifications_created_idx").on(t.createdAt),
  }),
);

export type Quote = typeof quotes.$inferSelect;
export type QuoteMessage = typeof quoteMessages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

/* === Payments === */
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  amountAED: integer("amount_aed").notNull(),
  type: paymentTypeEnum("type").notNull(),
  gateway: paymentGatewayEnum("gateway").notNull(),
  gatewayRef: varchar("gateway_ref", { length: 200 }),
  /** Stripe event ID (e.g. from checkout.session.completed) — makes webhook processing idempotent. */
  stripeEventId: varchar("stripe_event_id", { length: 128 }).unique(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* === Banners === */
export const banners = pgTable("banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  placement: varchar("placement", { length: 32 }).notNull(),
  imageUrl: text("image_url").notNull(),
  link: text("link"),
  title: varchar("title", { length: 200 }),
  startsAt: timestamp("starts_at").defaultNow().notNull(),
  endsAt: timestamp("ends_at"),
  dealerId: uuid("dealer_id").references(() => dealers.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
});

/* === Valuations === */
export const valuations = pgTable("valuations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  inputs: jsonb("inputs").notNull(),
  estimatedValueAED: integer("estimated_value_aed").notNull(),
  confidence: doublePrecision("confidence").default(0.7),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* === Audit Log === */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entity_type", { length: 32 }),
  entityId: varchar("entity_id", { length: 64 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* === Relations === */
export const usersRelations = relations(users, ({ many, one }) => ({
  dealer: one(dealers, { fields: [users.id], references: [dealers.userId] }),
  b2bBuyer: one(b2bBuyers, { fields: [users.id], references: [b2bBuyers.userId] }),
  savedListings: many(savedListings),
  savedSearches: many(savedSearches),
  leads: many(leads),
}));

export const dealersRelations = relations(dealers, ({ many, one }) => ({
  user: one(users, { fields: [dealers.userId], references: [users.id] }),
  listings: many(listings),
  subscriptions: many(subscriptions),
  leads: many(leads),
}));

export const listingsRelations = relations(listings, ({ many, one }) => ({
  dealer: one(dealers, { fields: [listings.dealerId], references: [dealers.id] }),
  seller: one(users, { fields: [listings.sellerId], references: [users.id] }),
  media: many(listingMedia),
  leads: many(leads),
}));

export const listingMediaRelations = relations(listingMedia, ({ one }) => ({
  listing: one(listings, { fields: [listingMedia.listingId], references: [listings.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Dealer = typeof dealers.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingMedia = typeof listingMedia.$inferSelect;
export type Lead = typeof leads.$inferSelect;

/* === Vehicle Catalog (auto-synced from public car-data APIs) ===
 * Populated by src/lib/catalog/sync.ts — vPIC for makes/models (live, incl.
 * next-model-year vehicles), Wikimedia/IMAGIN for imagery, API-Ninjas/CarAPI
 * for spec enrichment. Zero manual data entry.
 */
export const catalogMakes = pgTable(
  "catalog_makes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 96 }).notNull(),
    slug: varchar("slug", { length: 96 }).notNull(),
    country: varchar("country", { length: 64 }),
    isPopular: boolean("is_popular").default(false).notNull(),
    vpicMakeId: integer("vpic_make_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("catalog_makes_slug_idx").on(t.slug)],
);

export const catalogModels = pgTable(
  "catalog_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    makeId: uuid("make_id")
      .references(() => catalogMakes.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    slug: varchar("slug", { length: 128 }).notNull(),
    bodyType: varchar("body_type", { length: 48 }),
    /** newest model year seen for this model */
    latestYear: integer("latest_year"),
    /** first model year this model appeared in the catalog */
    firstSeenYear: integer("first_seen_year"),
    imageUrl: text("image_url"),
    imageSource: varchar("image_source", { length: 32 }),
    vpicModelId: integer("vpic_model_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("catalog_models_make_slug_idx").on(t.makeId, t.slug),
    index("catalog_models_latest_year_idx").on(t.latestYear),
  ],
);

export const catalogTrims = pgTable(
  "catalog_trims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelId: uuid("model_id")
      .references(() => catalogModels.id, { onDelete: "cascade" })
      .notNull(),
    year: integer("year").notNull(),
    trimName: varchar("trim_name", { length: 128 }).default("Base").notNull(),
    /** normalized spec payload from the enrichment providers */
    specs: jsonb("specs"),
    specSource: varchar("spec_source", { length: 32 }),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("catalog_trims_unique_idx").on(t.modelId, t.year, t.trimName),
    index("catalog_trims_year_idx").on(t.year),
  ],
);

export const catalogSyncRuns = pgTable("catalog_sync_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: varchar("status", { length: 16 }).default("running").notNull(),
  trigger: varchar("trigger", { length: 16 }).default("cron").notNull(),
  stats: jsonb("stats"),
  error: text("error"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export const catalogMakesRelations = relations(catalogMakes, ({ many }) => ({
  models: many(catalogModels),
}));
export const catalogModelsRelations = relations(catalogModels, ({ one, many }) => ({
  make: one(catalogMakes, { fields: [catalogModels.makeId], references: [catalogMakes.id] }),
  trims: many(catalogTrims),
}));
export const catalogTrimsRelations = relations(catalogTrims, ({ one }) => ({
  model: one(catalogModels, { fields: [catalogTrims.modelId], references: [catalogModels.id] }),
}));

export type CatalogMake = typeof catalogMakes.$inferSelect;
export type CatalogModel = typeof catalogModels.$inferSelect;
export type CatalogTrim = typeof catalogTrims.$inferSelect;
export type CatalogSyncRun = typeof catalogSyncRuns.$inferSelect;

/* ===========================================================================
   PLATFORM FOUNDATION — organizations, invitations, country-agnostic KYC.

   Design notes that matter:
   - An ORGANIZATION, not a user, is the unit of tenancy. A forwarder is a
     company with staff; so is a dealer. Every access check and every shipment
     participant scopes by org, so one login can hold several contexts.
   - Country requirements are DATA (see countries / kycRequirements), never
     `if (country === "AE")`. UAE is the launch market and the only seeded
     pack; adding Japan or Germany later is row insertion, not a refactor.
   - Money is stored as (amountMinor, currency). AED is the default so nothing
     changes today, but the seam exists for a second currency.
   =========================================================================== */

export const orgTypeEnum = pgEnum("org_type", [
  "buyer",
  "dealer",
  "forwarder",
  "platform",
]);

/**
 * Lifecycle of an organization's verification:
 *  incomplete - onboarding started, documents skipped ("add later")
 *  pending    - documents submitted, awaiting admin review
 *  active     - admin verified; full capabilities unlocked
 *  rejected   - needs changes, can resubmit
 *  suspended  - admin revoked access
 */
export const orgStatusEnum = pgEnum("org_status", [
  "incomplete",
  "pending",
  "active",
  "rejected",
  "suspended",
]);

export const orgMemberRoleEnum = pgEnum("org_member_role", [
  "owner",
  "admin",
  "staff",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: orgTypeEnum("type").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 140 }).unique(),
    /** ISO-3166 alpha-2. Drives which KYC requirement pack applies. */
    countryCode: varchar("country_code", { length: 2 }).notNull().default("AE"),
    status: orgStatusEnum("status").notNull().default("incomplete"),
    contactEmail: varchar("contact_email", { length: 320 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    /** Links a dealer org back to its existing storefront row (migration path). */
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    rejectionReason: text("rejection_reason"),
    submittedAt: timestamp("submitted_at"),
    verifiedAt: timestamp("verified_at"),
    verifiedByUserId: uuid("verified_by_user_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    typeIdx: index("orgs_type_idx").on(t.type),
    statusIdx: index("orgs_status_idx").on(t.status),
    countryIdx: index("orgs_country_idx").on(t.countryCode),
  }),
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgMemberRoleEnum("role").notNull().default("staff"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.orgId, t.userId] }),
    userIdx: index("org_members_user_idx").on(t.userId),
  }),
);

/**
 * Admin-issued onboarding links. The ROLE TRAVELS IN THE INVITE, never in a
 * query param the visitor controls - this is what makes forwarder onboarding
 * invite-only. Only a hash of the token is stored, so a database leak cannot
 * be replayed into an account.
 */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }),
    /** Org type this invite creates (or joins, when orgId is set). */
    orgType: orgTypeEnum("org_type").notNull(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    memberRole: orgMemberRoleEnum("member_role").notNull().default("owner"),
    /** Grants platform-admin rights on acceptance - replaces the admin PIN. */
    grantsAdmin: boolean("grants_admin").notNull().default(false),
    orgName: varchar("org_name", { length: 200 }),
    countryCode: varchar("country_code", { length: 2 }).notNull().default("AE"),
    note: text("note"),
    invitedByUserId: uuid("invited_by_user_id"),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    acceptedByUserId: uuid("accepted_by_user_id"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("invitations_email_idx").on(t.email),
    expiresIdx: index("invitations_expires_idx").on(t.expiresAt),
  }),
);

/**
 * Public "apply to become a partner" submissions (freight forwarders, and any
 * future partner type). Admin reviews, then issues an invitation - applicants
 * never self-serve into a privileged role.
 */
export const partnerApplications = pgTable(
  "partner_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgType: orgTypeEnum("org_type").notNull().default("forwarder"),
    companyName: varchar("company_name", { length: 200 }).notNull(),
    contactName: varchar("contact_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    countryCode: varchar("country_code", { length: 2 }).notNull().default("AE"),
    website: text("website"),
    /** Free-text pitch: lanes served, fleet, licences held. */
    message: text("message"),
    status: varchar("status", { length: 24 }).notNull().default("new"),
    reviewedByUserId: uuid("reviewed_by_user_id"),
    reviewedAt: timestamp("reviewed_at"),
    invitationId: uuid("invitation_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("partner_apps_status_idx").on(t.status),
  }),
);

/** Countries the platform operates in. UAE is seeded active at launch. */
export const countries = pgTable("countries", {
  code: varchar("code", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AED"),
  dialCode: varchar("dial_code", { length: 8 }),
  /** Cars can be sold FROM here. */
  originEnabled: boolean("origin_enabled").notNull().default(false),
  /** Cars can be shipped TO here. */
  destinationEnabled: boolean("destination_enabled").notNull().default(false),
});

/**
 * The country requirement pack. "Emirates ID" is not a schema column any more -
 * it is a row: (AE, dealer, national_id, "Emirates ID", required).
 */
export const kycRequirements = pgTable(
  "kyc_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    /** Which kind of org must supply it. */
    partyType: orgTypeEnum("party_type").notNull(),
    /** Neutral type: national_id, passport, trade_licence, freight_licence... */
    docType: varchar("doc_type", { length: 48 }).notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    helpText: text("help_text"),
    required: boolean("required").notNull().default(true),
    /** Needs a two-sided capture (front + back). */
    twoSided: boolean("two_sided").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    lookupIdx: index("kyc_req_lookup_idx").on(t.countryCode, t.partyType),
    uniq: uniqueIndex("kyc_req_uniq").on(t.countryCode, t.partyType, t.docType),
  }),
);

export const docStatusEnum = pgEnum("doc_status", [
  "pending",
  "approved",
  "rejected",
]);

/**
 * Country-agnostic identity/verification documents, replacing the hardcoded
 * `users.emirates_id_*` and `dealers.trade_licence_*` columns. Attached to a
 * user (personal ID) or an org (company papers).
 */
export const identityDocuments = pgTable(
  "identity_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    countryCode: varchar("country_code", { length: 2 }).notNull().default("AE"),
    docType: varchar("doc_type", { length: 48 }).notNull(),
    docNumber: varchar("doc_number", { length: 64 }),
    frontMediaId: uuid("front_media_id"),
    backMediaId: uuid("back_media_id"),
    expiresAt: timestamp("expires_at"),
    status: docStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedByUserId: uuid("reviewed_by_user_id"),
  },
  (t) => ({
    userIdx: index("identity_docs_user_idx").on(t.userId),
    orgIdx: index("identity_docs_org_idx").on(t.orgId),
    statusIdx: index("identity_docs_status_idx").on(t.status),
  }),
);

/* ===========================================================================
   CONVERSATION LAYER — one thread per record, many parties, per-message
   visibility.

   Deliberately NOT one inbox per party-pair. A shipment involves a buyer, a
   dealer and a forwarder; splitting that into three pairwise inboxes is what
   fragments a transaction. Instead: one canonical thread bound to the subject
   record, every participant reads it, and a message can be narrowed with
   `visibility` when someone needs a private word with the platform.
   =========================================================================== */

export const conversationKindEnum = pgEnum("conversation_kind", [
  "listing",
  "quote",
  "order",
  "shipment",
  "support",
]);

/** Who may read a given message inside an otherwise shared thread. */
export const messageVisibilityEnum = pgEnum("message_visibility", [
  "all_parties",
  "admin_only",
  "buyer_admin",
  "dealer_admin",
  "forwarder_admin",
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: conversationKindEnum("kind").notNull(),
    /** The record this thread hangs off (listing / quote / order / shipment). */
    subjectId: uuid("subject_id"),
    title: varchar("title", { length: 240 }),
    /** Denormalized for inbox ordering without touching the message table. */
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
    lastMessagePreview: varchar("last_message_preview", { length: 200 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    subjectIdx: index("conversations_subject_idx").on(t.kind, t.subjectId),
    recentIdx: index("conversations_recent_idx").on(t.lastMessageAt),
  }),
);

/**
 * Membership IS the authorization. A read or write is allowed only when the
 * caller has a row here - there is no "or admin sees everything" shortcut in
 * the query layer; admins are added as participants explicitly.
 */
export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    /** Party role in THIS thread - drives which visibility levels they see. */
    partyRole: orgTypeEnum("party_role").notNull().default("buyer"),
    /** Unread counting: messages newer than this are unread for this user. */
    lastReadAt: timestamp("last_read_at"),
    mutedAt: timestamp("muted_at"),
    leftAt: timestamp("left_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.conversationId, t.userId] }),
    userIdx: index("conv_participants_user_idx").on(t.userId),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    senderOrgId: uuid("sender_org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    /** Party role at send time, so history survives a role change. */
    senderRole: orgTypeEnum("sender_role").notNull().default("buyer"),
    body: text("body").notNull(),
    visibility: messageVisibilityEnum("visibility")
      .notNull()
      .default("all_parties"),
    /** Set for system-generated milestone/status posts in the same timeline. */
    systemEvent: varchar("system_event", { length: 48 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    convIdx: index("messages_conv_idx").on(t.conversationId, t.createdAt),
  }),
);

/* ===========================================================================
   FREIGHT FORWARDING — the added service.

   Two rules drive this shape:
   1. A SHIPMENT IS NOT AN ORDER. Forwarders consolidate 2-4 cars from
      different buyers and dealers into one container, so a shipment holds
      many lines and each line points at one order. Modelling one shipment per
      order would have to be undone the first time anyone consolidates.
   2. STATUS IS AN EVENT LOG, not a column. shipmentEvents is append-only and
      follows the DCSA track-and-trace shape (category + code + ACT/EST/PLN),
      so the same code recorded as EST is the ETA and as ACT is the arrival.
      `shipments.status` is a cached projection for querying, never the truth.
   =========================================================================== */

/** RO-RO has no container number, so it gets no carrier API coverage. */
export const shipmentModeEnum = pgEnum("shipment_mode", [
  "roro",
  "container_fcl",
  "container_lcl",
  "air",
]);

/** Decides who pays and who acts at each leg. */
export const incotermEnum = pgEnum("incoterm", [
  "EXW",
  "FOB",
  "CFR",
  "CIF",
  "DAP",
  "DDP",
]);

export const freightRequestStatusEnum = pgEnum("freight_request_status", [
  "open",
  "awarded",
  "cancelled",
  "expired",
]);

export const freightQuoteStatusEnum = pgEnum("freight_quote_status", [
  "invited",
  "submitted",
  "withdrawn",
  "accepted",
  "rejected",
  "expired",
]);

/** Buyer-facing progress. Projected from the event log. */
export const shipmentStatusEnum = pgEnum("shipment_status", [
  "booked",
  "collected",
  "export_clearance",
  "at_origin_port",
  "loaded",
  "in_transit",
  "arrived",
  "import_clearance",
  "released",
  "delivered",
  "cancelled",
]);

export const shipmentEventCategoryEnum = pgEnum("shipment_event_category", [
  "SHIPMENT",
  "TRANSPORT",
  "EQUIPMENT",
]);

/** DCSA classifier: the same event code as a plan, an estimate, or a fact. */
export const shipmentEventClassifierEnum = pgEnum("shipment_event_classifier", [
  "PLN",
  "EST",
  "ACT",
]);

export const shipmentDocStatusEnum = pgEnum("shipment_doc_status", [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "issued",
  "void",
]);

/**
 * Lanes a forwarder actually serves. An RFQ fans out only to forwarders whose
 * lane matches - never a blast to every forwarder on the platform.
 */
export const forwarderLanes = pgTable(
  "forwarder_lanes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    originCountry: varchar("origin_country", { length: 2 }).notNull(),
    destCountry: varchar("dest_country", { length: 2 }).notNull(),
    mode: shipmentModeEnum("mode").notNull().default("roro"),
    /** Indicative transit for buyer-facing estimates. */
    transitDays: integer("transit_days"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    matchIdx: index("forwarder_lanes_match_idx").on(
      t.originCountry,
      t.destCountry,
      t.mode,
      t.active,
    ),
    orgIdx: index("forwarder_lanes_org_idx").on(t.orgId),
  }),
);

/** The buyer's request for shipping on a completed order (the RFQ). */
export const freightRequests = pgTable(
  "freight_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    buyerUserId: uuid("buyer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    buyerOrgId: uuid("buyer_org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    originCountry: varchar("origin_country", { length: 2 })
      .notNull()
      .default("AE"),
    originCity: varchar("origin_city", { length: 120 }),
    destCountry: varchar("dest_country", { length: 2 }).notNull(),
    destCity: varchar("dest_city", { length: 120 }),
    destPort: varchar("dest_port", { length: 120 }),
    mode: shipmentModeEnum("mode").notNull().default("roro"),
    incoterm: incotermEnum("incoterm").notNull().default("CIF"),
    vehicleCount: integer("vehicle_count").notNull().default(1),
    /** Snapshot of what is being shipped, so the RFQ survives listing edits. */
    vehicleSummary: jsonb("vehicle_summary"),
    notes: text("notes"),
    status: freightRequestStatusEnum("status").notNull().default("open"),
    expiresAt: timestamp("expires_at"),
    awardedQuoteId: uuid("awarded_quote_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("freight_requests_status_idx").on(t.status),
    buyerIdx: index("freight_requests_buyer_idx").on(t.buyerUserId),
    laneIdx: index("freight_requests_lane_idx").on(
      t.originCountry,
      t.destCountry,
    ),
  }),
);

/**
 * One row per invited forwarder. Created at fan-out with status "invited", so
 * response rates are measurable and a forwarder can decline without silence.
 * NOTE: an invitation does NOT grant sight of the buyer's identity - only the
 * lane, the vehicle summary and the dates.
 */
export const freightQuotes = pgTable(
  "freight_quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => freightRequests.id, { onDelete: "cascade" }),
    forwarderOrgId: uuid("forwarder_org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    status: freightQuoteStatusEnum("status").notNull().default("invited"),
    currency: varchar("currency", { length: 3 }).notNull().default("AED"),
    /** Minor units (fils/cents) - avoids float rounding on money. */
    totalMinor: bigint("total_minor", { mode: "number" }),
    /** Itemised: freight, THC, documentation, customs, insurance, inland. */
    lineItems: jsonb("line_items"),
    transitDays: integer("transit_days"),
    /** Mandatory on submit - quotes expire by cron, not by hope. */
    validUntil: timestamp("valid_until"),
    notes: text("notes"),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    respondedAt: timestamp("responded_at"),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    requestIdx: index("freight_quotes_request_idx").on(t.requestId),
    forwarderIdx: index("freight_quotes_forwarder_idx").on(t.forwarderOrgId),
    uniq: uniqueIndex("freight_quotes_uniq").on(t.requestId, t.forwarderOrgId),
  }),
);

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    forwarderOrgId: uuid("forwarder_org_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    quoteId: uuid("quote_id").references(() => freightQuotes.id, {
      onDelete: "set null",
    }),
    mode: shipmentModeEnum("mode").notNull().default("roro"),
    incoterm: incotermEnum("incoterm").notNull().default("CIF"),
    originCountry: varchar("origin_country", { length: 2 })
      .notNull()
      .default("AE"),
    originPort: varchar("origin_port", { length: 120 }),
    destCountry: varchar("dest_country", { length: 2 }).notNull(),
    destPort: varchar("dest_port", { length: 120 }),
    /** Carrier identifiers, appearing in this order as the shipment matures. */
    bookingNumber: varchar("booking_number", { length: 64 }),
    containerNumber: varchar("container_number", { length: 32 }),
    blNumber: varchar("bl_number", { length: 64 }),
    vesselName: varchar("vessel_name", { length: 120 }),
    voyageNumber: varchar("voyage_number", { length: 40 }),
    etd: timestamp("etd"),
    eta: timestamp("eta"),
    atd: timestamp("atd"),
    ata: timestamp("ata"),
    /** Cached projection of the event log - never the source of truth. */
    status: shipmentStatusEnum("status").notNull().default("booked"),
    statusUpdatedAt: timestamp("status_updated_at").defaultNow().notNull(),
    /**
     * Documents of title stay locked until funds clear. Releasing a telex
     * before payment hands over control of the cargo, so this is an explicit
     * state rather than an implicit convention.
     */
    documentReleaseHold: boolean("document_release_hold")
      .notNull()
      .default(true),
    documentReleasedAt: timestamp("document_released_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("shipments_status_idx").on(t.status),
    forwarderIdx: index("shipments_forwarder_idx").on(t.forwarderOrgId),
    containerIdx: index("shipments_container_idx").on(t.containerNumber),
  }),
);

/**
 * One vehicle on a shipment. This is the many-to-many join that makes
 * consolidation possible: several lines, from several orders and several
 * dealers, can share one container.
 */
export const shipmentLines = pgTable(
  "shipment_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    listingId: uuid("listing_id").references(() => listings.id, {
      onDelete: "set null",
    }),
    buyerUserId: uuid("buyer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    description: varchar("description", { length: 240 }),
    vin: varchar("vin", { length: 32 }),
    /** House B/L - one per customer even when the container has a single MBL. */
    houseBlNumber: varchar("house_bl_number", { length: 64 }),
    declaredValueMinor: bigint("declared_value_minor", { mode: "number" }),
    currency: varchar("currency", { length: 3 }).notNull().default("AED"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    shipmentIdx: index("shipment_lines_shipment_idx").on(t.shipmentId),
    orderIdx: index("shipment_lines_order_idx").on(t.orderId),
    buyerIdx: index("shipment_lines_buyer_idx").on(t.buyerUserId),
  }),
);

/**
 * Who can see this shipment. Row-scoping by org, exactly like conversations.
 * The winning forwarder gets a row ONLY at award - losing bidders never
 * become participants, which is the main leakage boundary in the RFQ flow.
 */
export const shipmentParticipants = pgTable(
  "shipment_participants",
  {
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    partyRole: orgTypeEnum("party_role").notNull(),
    removedAt: timestamp("removed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.shipmentId, t.orgId] }),
    orgIdx: index("shipment_participants_org_idx").on(t.orgId),
  }),
);

/**
 * Append-only. Never UPDATE, never DELETE - a three-party financial
 * transaction needs a defensible history when someone disputes a date.
 * `eventAt` is when it happened in the world; `recordedAt` is when we learned
 * it. Those diverge constantly and both matter.
 */
export const shipmentEvents = pgTable(
  "shipment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    /** Null = whole shipment; set = this one vehicle (gate-in, release). */
    lineId: uuid("line_id").references(() => shipmentLines.id, {
      onDelete: "cascade",
    }),
    category: shipmentEventCategoryEnum("category").notNull(),
    /** Country-neutral milestone key; labels come from the country pack. */
    milestone: varchar("milestone", { length: 48 }).notNull(),
    classifier: shipmentEventClassifierEnum("classifier")
      .notNull()
      .default("ACT"),
    eventAt: timestamp("event_at").notNull(),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
    location: varchar("location", { length: 160 }),
    /** api | forwarder | admin - RO-RO milestones are always manual. */
    source: varchar("source", { length: 24 }).notNull().default("forwarder"),
    actorOrgId: uuid("actor_org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    payload: jsonb("payload"),
  },
  (t) => ({
    shipmentIdx: index("shipment_events_shipment_idx").on(
      t.shipmentId,
      t.eventAt,
    ),
    milestoneIdx: index("shipment_events_milestone_idx").on(t.milestone),
  }),
);

/**
 * Shipment paperwork. `visibleTo` is an explicit allow-list of party roles
 * because some documents must NOT reach every party - a commercial invoice
 * showing dealer cost should not go to the forwarder.
 */
export const shipmentDocuments = pgTable(
  "shipment_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    lineId: uuid("line_id").references(() => shipmentLines.id, {
      onDelete: "cascade",
    }),
    /** commercial_invoice | bill_of_lading | export_certificate | ... */
    docType: varchar("doc_type", { length: 48 }).notNull(),
    title: varchar("title", { length: 200 }),
    mediaId: uuid("media_id"),
    version: integer("version").notNull().default(1),
    status: shipmentDocStatusEnum("status").notNull().default("draft"),
    /** Party roles allowed to read it. */
    visibleTo: jsonb("visible_to"),
    uploadedByOrgId: uuid("uploaded_by_org_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    shipmentIdx: index("shipment_docs_shipment_idx").on(t.shipmentId),
    typeIdx: index("shipment_docs_type_idx").on(t.docType),
  }),
);

/**
 * Party-private money. Each row is owned by ONE org, so ordinary row-level
 * scoping gives field-level secrecy: the dealer's cost, the forwarder's buy
 * rate and the platform's margin simply are not rows the other parties can
 * select. Far safer than remembering to omit a column in every query.
 */
export const shipmentFinancials = pgTable(
  "shipment_financials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    /** The ONLY org that may read this row (plus platform admins). */
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** buyer_payable | forwarder_receivable | platform_commission | cost */
    kind: varchar("kind", { length: 32 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("AED"),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    description: varchar("description", { length: 240 }),
    settledAt: timestamp("settled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    shipmentIdx: index("shipment_financials_shipment_idx").on(t.shipmentId),
    orgIdx: index("shipment_financials_org_idx").on(t.orgId),
  }),
);
