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
