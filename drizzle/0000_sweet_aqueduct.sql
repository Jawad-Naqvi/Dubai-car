CREATE TYPE "public"."lead_type" AS ENUM('inquiry', 'contact_unlock', 'test_drive', 'export_inquiry');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'pending_review', 'active', 'reserved', 'sold', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('paytabs', 'stripe');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('subscription', 'lead_unlock', 'featured_listing', 'b2b_connection');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('buyer', 'dealer', 'b2b_importer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(32),
	"entity_id" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_buyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"country" varchar(64) NOT NULL,
	"trade_license_url" text,
	"contact_phone" varchar(32),
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "b2b_buyers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement" varchar(32) NOT NULL,
	"image_url" text NOT NULL,
	"link" text,
	"title" varchar(200),
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp,
	"dealer_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clerk_org_id" varchar(64),
	"slug" varchar(120) NOT NULL,
	"business_name" varchar(200) NOT NULL,
	"logo_url" text,
	"cover_url" text,
	"tagline" varchar(240),
	"description" text,
	"trade_license" varchar(64),
	"emirate" varchar(32) NOT NULL,
	"address" text,
	"lat" double precision,
	"lng" double precision,
	"working_hours" jsonb,
	"phone" varchar(32),
	"whatsapp" varchar(32),
	"website" text,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"listing_quota_used" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"rating" double precision DEFAULT 0,
	"review_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dealers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "export_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"b2b_buyer_id" uuid NOT NULL,
	"listing_ids" jsonb NOT NULL,
	"destination_country" varchar(64) NOT NULL,
	"shipping_preference" varchar(32),
	"doc_requests" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"buyer_id" uuid,
	"dealer_id" uuid,
	"type" "lead_type" NOT NULL,
	"fee_aed" integer DEFAULT 0 NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	"message" text,
	"buyer_name" varchar(160),
	"buyer_email" varchar(320),
	"buyer_phone" varchar(32),
	"destination_country" varchar(64),
	"quantity" integer,
	"shipping_preference" varchar(32),
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"url" text NOT NULL,
	"type" varchar(16) DEFAULT 'photo' NOT NULL,
	"is_hero" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"dealer_id" uuid,
	"seller_id" uuid,
	"make" varchar(64) NOT NULL,
	"model" varchar(96) NOT NULL,
	"trim" varchar(96),
	"year" integer NOT NULL,
	"body_type" varchar(32),
	"fuel" varchar(24),
	"transmission" varchar(24),
	"kms" integer DEFAULT 0 NOT NULL,
	"color_exterior" varchar(32),
	"color_interior" varchar(32),
	"regional_spec" varchar(32),
	"vin" varchar(32),
	"cylinders" integer,
	"doors" integer,
	"seats" integer,
	"horsepower" integer,
	"price_aed" bigint NOT NULL,
	"monthly_emi" integer,
	"condition" varchar(32),
	"description" text,
	"features" jsonb DEFAULT '[]'::jsonb,
	"emirate" varchar(32) NOT NULL,
	"location_lat" double precision,
	"location_lng" double precision,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"is_export_ready" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_inspected" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"inquiry_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"sold_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"amount_aed" integer NOT NULL,
	"type" "payment_type" NOT NULL,
	"gateway" "payment_gateway" NOT NULL,
	"gateway_ref" varchar(200),
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_listings_user_id_listing_id_pk" PRIMARY KEY("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120),
	"query" jsonb NOT NULL,
	"alert_frequency" varchar(16) DEFAULT 'daily',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"tier" "subscription_tier" NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"period_start" timestamp DEFAULT now() NOT NULL,
	"period_end" timestamp,
	"paytabs_ref" varchar(128),
	"stripe_subscription_id" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(64) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(32),
	"name" varchar(160),
	"image_url" text,
	"role" "role" DEFAULT 'buyer' NOT NULL,
	"preferred_locale" varchar(8) DEFAULT 'en',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "valuations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"inputs" jsonb NOT NULL,
	"estimated_value_aed" integer NOT NULL,
	"confidence" double precision DEFAULT 0.7,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_buyers" ADD CONSTRAINT "b2b_buyers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealers" ADD CONSTRAINT "dealers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_inquiries" ADD CONSTRAINT "export_inquiries_b2b_buyer_id_b2b_buyers_id_fk" FOREIGN KEY ("b2b_buyer_id") REFERENCES "public"."b2b_buyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dealers_slug_idx" ON "dealers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "dealers_emirate_idx" ON "dealers" USING btree ("emirate");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_slug_idx" ON "listings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listings_make_model_idx" ON "listings" USING btree ("make","model");--> statement-breakpoint
CREATE INDEX "listings_price_idx" ON "listings" USING btree ("price_aed");--> statement-breakpoint
CREATE INDEX "listings_emirate_idx" ON "listings" USING btree ("emirate");--> statement-breakpoint
CREATE INDEX "listings_dealer_idx" ON "listings" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "listings_export_idx" ON "listings" USING btree ("is_export_ready");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");