CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."lead_type" ADD VALUE 'finance_preapproval';--> statement-breakpoint
CREATE TABLE "catalog_makes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(96) NOT NULL,
	"slug" varchar(96) NOT NULL,
	"country" varchar(64),
	"is_popular" boolean DEFAULT false NOT NULL,
	"vpic_make_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"body_type" varchar(48),
	"latest_year" integer,
	"first_seen_year" integer,
	"image_url" text,
	"image_source" varchar(32),
	"vpic_model_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(16) DEFAULT 'running' NOT NULL,
	"trigger" varchar(16) DEFAULT 'cron' NOT NULL,
	"stats" jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "catalog_trims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"trim_name" varchar(128) DEFAULT 'Base' NOT NULL,
	"specs" jsonb,
	"spec_source" varchar(32),
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealer_id" uuid NOT NULL,
	"user_id" uuid,
	"author_name" varchar(120),
	"rating" integer NOT NULL,
	"title" varchar(160),
	"body" text,
	"status" varchar(16) DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"sender_role" varchar(16) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"inspector_name" varchar(160) NOT NULL,
	"inspected_at" timestamp DEFAULT now() NOT NULL,
	"categories" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "listing_inspections_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
CREATE TABLE "listing_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"reporter_id" uuid,
	"reason" varchar(64) NOT NULL,
	"details" text,
	"reporter_email" varchar(200),
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mime_type" varchar(64) DEFAULT 'image/jpeg' NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"old_price" bigint NOT NULL,
	"new_price" bigint NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"source" varchar(16) DEFAULT 'dealer' NOT NULL,
	"vin" varchar(32),
	"title_status" varchar(16) DEFAULT 'clean' NOT NULL,
	"owners" integer,
	"accidents_reported" boolean,
	"odometer_consistent" boolean,
	"accidents" jsonb DEFAULT '[]'::jsonb,
	"service_records" jsonb DEFAULT '[]'::jsonb,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_history_listing_id_unique" UNIQUE("listing_id")
);
--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "trade_license_doc_url" text;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "kyc_status" "kyc_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "emirates_id_number" varchar(32);--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "emirates_id_front_url" text;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "emirates_id_back_url" text;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "kyc_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "kyc_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "kyc_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "stripe_customer_id" varchar(128);--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "stripe_subscription_id" varchar(128);--> statement-breakpoint
ALTER TABLE "dealers" ADD COLUMN "pending_tier" "subscription_tier";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "drivetrain" varchar(32);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "deal_rating" varchar(16);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "previous_price" bigint;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "price_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_event_id" varchar(128);--> statement-breakpoint
ALTER TABLE "saved_searches" ADD COLUMN "last_notified_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "catalog_models" ADD CONSTRAINT "catalog_models_make_id_catalog_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."catalog_makes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_trims" ADD CONSTRAINT "catalog_trims_model_id_catalog_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."catalog_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_reviews" ADD CONSTRAINT "dealer_reviews_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_reviews" ADD CONSTRAINT "dealer_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_replies" ADD CONSTRAINT "lead_replies_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_inspections" ADD CONSTRAINT "listing_inspections_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_reports" ADD CONSTRAINT "listing_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_history" ADD CONSTRAINT "vehicle_history_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_makes_slug_idx" ON "catalog_makes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_models_make_slug_idx" ON "catalog_models" USING btree ("make_id","slug");--> statement-breakpoint
CREATE INDEX "catalog_models_latest_year_idx" ON "catalog_models" USING btree ("latest_year");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_trims_unique_idx" ON "catalog_trims" USING btree ("model_id","year","trim_name");--> statement-breakpoint
CREATE INDEX "catalog_trims_year_idx" ON "catalog_trims" USING btree ("year");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_stripe_event_id_unique" UNIQUE("stripe_event_id");