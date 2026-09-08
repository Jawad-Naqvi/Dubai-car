CREATE TYPE "public"."conversation_kind" AS ENUM('listing', 'quote', 'order', 'shipment', 'support');--> statement-breakpoint
CREATE TYPE "public"."doc_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."freight_quote_status" AS ENUM('invited', 'submitted', 'withdrawn', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."freight_request_status" AS ENUM('open', 'awarded', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."incoterm" AS ENUM('EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP');--> statement-breakpoint
CREATE TYPE "public"."message_visibility" AS ENUM('all_parties', 'admin_only', 'buyer_admin', 'dealer_admin', 'forwarder_admin');--> statement-breakpoint
CREATE TYPE "public"."org_member_role" AS ENUM('owner', 'admin', 'staff');--> statement-breakpoint
CREATE TYPE "public"."org_status" AS ENUM('incomplete', 'pending', 'active', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('buyer', 'dealer', 'forwarder', 'platform');--> statement-breakpoint
CREATE TYPE "public"."shipment_doc_status" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'issued', 'void');--> statement-breakpoint
CREATE TYPE "public"."shipment_event_category" AS ENUM('SHIPMENT', 'TRANSPORT', 'EQUIPMENT');--> statement-breakpoint
CREATE TYPE "public"."shipment_event_classifier" AS ENUM('PLN', 'EST', 'ACT');--> statement-breakpoint
CREATE TYPE "public"."shipment_mode" AS ENUM('roro', 'container_fcl', 'container_lcl', 'air');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('booked', 'collected', 'export_clearance', 'at_origin_port', 'loaded', 'in_transit', 'arrived', 'import_clearance', 'released', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid,
	"party_role" "org_type" DEFAULT 'buyer' NOT NULL,
	"last_read_at" timestamp,
	"muted_at" timestamp,
	"left_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_participants_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "conversation_kind" NOT NULL,
	"subject_id" uuid,
	"title" varchar(240),
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"last_message_preview" varchar(200),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"dial_code" varchar(8),
	"origin_enabled" boolean DEFAULT false NOT NULL,
	"destination_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forwarder_lanes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"origin_country" varchar(2) NOT NULL,
	"dest_country" varchar(2) NOT NULL,
	"mode" "shipment_mode" DEFAULT 'roro' NOT NULL,
	"transit_days" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freight_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"forwarder_org_id" uuid NOT NULL,
	"status" "freight_quote_status" DEFAULT 'invited' NOT NULL,
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"total_minor" bigint,
	"line_items" jsonb,
	"transit_days" integer,
	"valid_until" timestamp,
	"notes" text,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freight_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(24) NOT NULL,
	"order_id" uuid,
	"buyer_user_id" uuid,
	"buyer_org_id" uuid,
	"origin_country" varchar(2) DEFAULT 'AE' NOT NULL,
	"origin_city" varchar(120),
	"dest_country" varchar(2) NOT NULL,
	"dest_city" varchar(120),
	"dest_port" varchar(120),
	"mode" "shipment_mode" DEFAULT 'roro' NOT NULL,
	"incoterm" "incoterm" DEFAULT 'CIF' NOT NULL,
	"vehicle_count" integer DEFAULT 1 NOT NULL,
	"vehicle_summary" jsonb,
	"notes" text,
	"status" "freight_request_status" DEFAULT 'open' NOT NULL,
	"expires_at" timestamp,
	"awarded_quote_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freight_requests_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "identity_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"org_id" uuid,
	"country_code" varchar(2) DEFAULT 'AE' NOT NULL,
	"doc_type" varchar(48) NOT NULL,
	"doc_number" varchar(64),
	"front_media_id" uuid,
	"back_media_id" uuid,
	"expires_at" timestamp,
	"status" "doc_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by_user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"email" varchar(320),
	"org_type" "org_type" NOT NULL,
	"org_id" uuid,
	"member_role" "org_member_role" DEFAULT 'owner' NOT NULL,
	"grants_admin" boolean DEFAULT false NOT NULL,
	"org_name" varchar(200),
	"country_code" varchar(2) DEFAULT 'AE' NOT NULL,
	"note" text,
	"invited_by_user_id" uuid,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"accepted_by_user_id" uuid,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "kyc_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"party_type" "org_type" NOT NULL,
	"doc_type" varchar(48) NOT NULL,
	"label" varchar(120) NOT NULL,
	"help_text" text,
	"required" boolean DEFAULT true NOT NULL,
	"two_sided" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_user_id" uuid,
	"sender_org_id" uuid,
	"sender_role" "org_type" DEFAULT 'buyer' NOT NULL,
	"body" text NOT NULL,
	"visibility" "message_visibility" DEFAULT 'all_parties' NOT NULL,
	"system_event" varchar(48),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_member_role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_org_id_user_id_pk" PRIMARY KEY("org_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "org_type" NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(140),
	"country_code" varchar(2) DEFAULT 'AE' NOT NULL,
	"status" "org_status" DEFAULT 'incomplete' NOT NULL,
	"contact_email" varchar(320),
	"contact_phone" varchar(32),
	"dealer_id" uuid,
	"rejection_reason" text,
	"submitted_at" timestamp,
	"verified_at" timestamp,
	"verified_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_type" "org_type" DEFAULT 'forwarder' NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"contact_name" varchar(160) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(32),
	"country_code" varchar(2) DEFAULT 'AE' NOT NULL,
	"website" text,
	"message" text,
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp,
	"invitation_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"line_id" uuid,
	"doc_type" varchar(48) NOT NULL,
	"title" varchar(200),
	"media_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "shipment_doc_status" DEFAULT 'draft' NOT NULL,
	"visible_to" jsonb,
	"uploaded_by_org_id" uuid,
	"uploaded_by_user_id" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"line_id" uuid,
	"category" "shipment_event_category" NOT NULL,
	"milestone" varchar(48) NOT NULL,
	"classifier" "shipment_event_classifier" DEFAULT 'ACT' NOT NULL,
	"event_at" timestamp NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"location" varchar(160),
	"source" varchar(24) DEFAULT 'forwarder' NOT NULL,
	"actor_org_id" uuid,
	"actor_user_id" uuid,
	"note" text,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "shipment_financials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"kind" varchar(32) NOT NULL,
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"amount_minor" bigint NOT NULL,
	"description" varchar(240),
	"settled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"order_id" uuid,
	"listing_id" uuid,
	"buyer_user_id" uuid,
	"dealer_id" uuid,
	"description" varchar(240),
	"vin" varchar(32),
	"house_bl_number" varchar(64),
	"declared_value_minor" bigint,
	"currency" varchar(3) DEFAULT 'AED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_participants" (
	"shipment_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"party_role" "org_type" NOT NULL,
	"removed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipment_participants_shipment_id_org_id_pk" PRIMARY KEY("shipment_id","org_id")
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(24) NOT NULL,
	"forwarder_org_id" uuid,
	"quote_id" uuid,
	"mode" "shipment_mode" DEFAULT 'roro' NOT NULL,
	"incoterm" "incoterm" DEFAULT 'CIF' NOT NULL,
	"origin_country" varchar(2) DEFAULT 'AE' NOT NULL,
	"origin_port" varchar(120),
	"dest_country" varchar(2) NOT NULL,
	"dest_port" varchar(120),
	"booking_number" varchar(64),
	"container_number" varchar(32),
	"bl_number" varchar(64),
	"vessel_name" varchar(120),
	"voyage_number" varchar(40),
	"etd" timestamp,
	"eta" timestamp,
	"atd" timestamp,
	"ata" timestamp,
	"status" "shipment_status" DEFAULT 'booked' NOT NULL,
	"status_updated_at" timestamp DEFAULT now() NOT NULL,
	"document_release_hold" boolean DEFAULT true NOT NULL,
	"document_released_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forwarder_lanes" ADD CONSTRAINT "forwarder_lanes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freight_quotes" ADD CONSTRAINT "freight_quotes_request_id_freight_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."freight_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freight_quotes" ADD CONSTRAINT "freight_quotes_forwarder_org_id_organizations_id_fk" FOREIGN KEY ("forwarder_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freight_requests" ADD CONSTRAINT "freight_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freight_requests" ADD CONSTRAINT "freight_requests_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freight_requests" ADD CONSTRAINT "freight_requests_buyer_org_id_organizations_id_fk" FOREIGN KEY ("buyer_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_org_id_organizations_id_fk" FOREIGN KEY ("sender_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_documents" ADD CONSTRAINT "shipment_documents_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_documents" ADD CONSTRAINT "shipment_documents_line_id_shipment_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."shipment_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_documents" ADD CONSTRAINT "shipment_documents_uploaded_by_org_id_organizations_id_fk" FOREIGN KEY ("uploaded_by_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_documents" ADD CONSTRAINT "shipment_documents_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_line_id_shipment_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."shipment_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_actor_org_id_organizations_id_fk" FOREIGN KEY ("actor_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_financials" ADD CONSTRAINT "shipment_financials_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_financials" ADD CONSTRAINT "shipment_financials_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_lines" ADD CONSTRAINT "shipment_lines_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_lines" ADD CONSTRAINT "shipment_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_lines" ADD CONSTRAINT "shipment_lines_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_lines" ADD CONSTRAINT "shipment_lines_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_lines" ADD CONSTRAINT "shipment_lines_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_participants" ADD CONSTRAINT "shipment_participants_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_participants" ADD CONSTRAINT "shipment_participants_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_forwarder_org_id_organizations_id_fk" FOREIGN KEY ("forwarder_org_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_quote_id_freight_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."freight_quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conv_participants_user_idx" ON "conversation_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_subject_idx" ON "conversations" USING btree ("kind","subject_id");--> statement-breakpoint
CREATE INDEX "conversations_recent_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "forwarder_lanes_match_idx" ON "forwarder_lanes" USING btree ("origin_country","dest_country","mode","active");--> statement-breakpoint
CREATE INDEX "forwarder_lanes_org_idx" ON "forwarder_lanes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "freight_quotes_request_idx" ON "freight_quotes" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "freight_quotes_forwarder_idx" ON "freight_quotes" USING btree ("forwarder_org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "freight_quotes_uniq" ON "freight_quotes" USING btree ("request_id","forwarder_org_id");--> statement-breakpoint
CREATE INDEX "freight_requests_status_idx" ON "freight_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "freight_requests_buyer_idx" ON "freight_requests" USING btree ("buyer_user_id");--> statement-breakpoint
CREATE INDEX "freight_requests_lane_idx" ON "freight_requests" USING btree ("origin_country","dest_country");--> statement-breakpoint
CREATE INDEX "identity_docs_user_idx" ON "identity_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "identity_docs_org_idx" ON "identity_documents" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "identity_docs_status_idx" ON "identity_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_expires_idx" ON "invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "kyc_req_lookup_idx" ON "kyc_requirements" USING btree ("country_code","party_type");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_req_uniq" ON "kyc_requirements" USING btree ("country_code","party_type","doc_type");--> statement-breakpoint
CREATE INDEX "messages_conv_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "org_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orgs_type_idx" ON "organizations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "orgs_status_idx" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orgs_country_idx" ON "organizations" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "partner_apps_status_idx" ON "partner_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipment_docs_shipment_idx" ON "shipment_documents" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_docs_type_idx" ON "shipment_documents" USING btree ("doc_type");--> statement-breakpoint
CREATE INDEX "shipment_events_shipment_idx" ON "shipment_events" USING btree ("shipment_id","event_at");--> statement-breakpoint
CREATE INDEX "shipment_events_milestone_idx" ON "shipment_events" USING btree ("milestone");--> statement-breakpoint
CREATE INDEX "shipment_financials_shipment_idx" ON "shipment_financials" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_financials_org_idx" ON "shipment_financials" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "shipment_lines_shipment_idx" ON "shipment_lines" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_lines_order_idx" ON "shipment_lines" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "shipment_lines_buyer_idx" ON "shipment_lines" USING btree ("buyer_user_id");--> statement-breakpoint
CREATE INDEX "shipment_participants_org_idx" ON "shipment_participants" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "shipments_status_idx" ON "shipments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipments_forwarder_idx" ON "shipments" USING btree ("forwarder_org_id");--> statement-breakpoint
CREATE INDEX "shipments_container_idx" ON "shipments" USING btree ("container_number");