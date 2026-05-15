ALTER TABLE "campaign_verifications" DROP CONSTRAINT IF EXISTS "campaign_verifications_campaign_id_fkey";
ALTER TABLE "campaign_verifications"
  ADD CONSTRAINT "campaign_verifications_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "campaign_media" DROP CONSTRAINT IF EXISTS "campaign_media_campaign_id_fkey";
ALTER TABLE "campaign_media"
  ADD CONSTRAINT "campaign_media_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "campaign_updates" DROP CONSTRAINT IF EXISTS "campaign_updates_campaign_id_fkey";
ALTER TABLE "campaign_updates"
  ADD CONSTRAINT "campaign_updates_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "donations" DROP CONSTRAINT IF EXISTS "donations_campaign_id_fkey";
ALTER TABLE "donations"
  ADD CONSTRAINT "donations_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_campaign_id_fkey";
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "saved_campaigns" DROP CONSTRAINT IF EXISTS "saved_campaigns_campaign_id_fkey";
ALTER TABLE "saved_campaigns"
  ADD CONSTRAINT "saved_campaigns_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_campaign_id_fkey";
ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fund_transfers" DROP CONSTRAINT IF EXISTS "fund_transfers_campaign_id_fkey";
ALTER TABLE "fund_transfers"
  ADD CONSTRAINT "fund_transfers_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "campaigns" DROP COLUMN "status";
