CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('requested', 'under_review', 'responded', 'accepted', 'declined', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "public"."sale_mode" AS ENUM('retail', 'both', 'quote_only');--> statement-breakpoint
CREATE TABLE "compare_listings" (
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compare_listings_user_id_listing_id_pk" PRIMARY KEY("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "listing_view_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event" varchar(64) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"href" text,
	"channels" jsonb DEFAULT '[]'::jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(24) NOT NULL,
	"quote_id" uuid,
	"listing_id" uuid,
	"dealer_id" uuid,
	"seller_id" uuid,
	"buyer_id" uuid,
	"buyer_name" varchar(160),
	"buyer_email" varchar(320),
	"buyer_phone" varchar(32),
	"kind" varchar(16) DEFAULT 'retail' NOT NULL,
	"title" varchar(240),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_aed" bigint NOT NULL,
	"total_aed" bigint NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "quote_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"sender_role" varchar(16) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(24) NOT NULL,
	"listing_id" uuid,
	"dealer_id" uuid,
	"seller_id" uuid,
	"buyer_id" uuid,
	"buyer_name" varchar(160),
	"buyer_email" varchar(320),
	"buyer_phone" varchar(32),
	"buyer_company" varchar(200),
	"quantity" integer DEFAULT 1 NOT NULL,
	"requirements" text,
	"target_unit_price_aed" bigint,
	"destination_country" varchar(64),
	"quoted_unit_price_aed" bigint,
	"quoted_total_aed" bigint,
	"quoted_quantity" integer,
	"quoted_notes" text,
	"valid_until" timestamp,
	"responded_at" timestamp,
	"status" "quote_status" DEFAULT 'requested' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "sale_mode" "sale_mode" DEFAULT 'retail' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "bulk_min_qty" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "stock_qty" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emirates_id_number" varchar(32);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emirates_id_front_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emirates_id_back_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "compare_listings" ADD CONSTRAINT "compare_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compare_listings" ADD CONSTRAINT "compare_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_view_events" ADD CONSTRAINT "listing_view_events_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_messages" ADD CONSTRAINT "quote_messages_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "view_events_listing_idx" ON "listing_view_events" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "view_events_created_idx" ON "listing_view_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_dealer_idx" ON "orders" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "orders_buyer_idx" ON "orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_dealer_idx" ON "quotes" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "quotes_buyer_idx" ON "quotes" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "quotes_status_idx" ON "quotes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quotes_listing_idx" ON "quotes" USING btree ("listing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_emirates_id_idx" ON "users" USING btree ("emirates_id_number");