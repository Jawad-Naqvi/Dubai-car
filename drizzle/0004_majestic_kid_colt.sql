ALTER TABLE "media_assets" ADD COLUMN "visibility" varchar(16) DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "owner_org_id" uuid;