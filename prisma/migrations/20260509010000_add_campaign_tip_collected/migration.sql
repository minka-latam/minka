-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "tip_collected" DECIMAL NOT NULL DEFAULT 0;

-- Backfill completed active donation tips per campaign.
UPDATE "campaigns" c
SET "tip_collected" = COALESCE(tips.total_tip_collected, 0)
FROM (
    SELECT
        "campaign_id",
        SUM(COALESCE("tip_amount", 0)) AS total_tip_collected
    FROM "donations"
    WHERE "status" = 'active'
      AND "payment_status" = 'completed'
    GROUP BY "campaign_id"
) tips
WHERE c."id" = tips."campaign_id";
