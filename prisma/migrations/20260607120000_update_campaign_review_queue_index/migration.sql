WITH affected_organizers AS (
  UPDATE "campaigns"
  SET "campaign_status" = 'active'
  WHERE "campaign_status" = 'draft'
    AND "submitted_for_review_at" IS NOT NULL
    AND "reviewed_at" IS NULL
  RETURNING "organizer_id"
),
organizer_counts AS (
  SELECT
    campaigns."organizer_id",
    COUNT(*)::integer AS "active_campaigns_count"
  FROM "campaigns"
  WHERE campaigns."campaign_status" IN ('active', 'completed')
    AND campaigns."organizer_id" IN (
      SELECT DISTINCT "organizer_id" FROM affected_organizers
    )
  GROUP BY campaigns."organizer_id"
)
UPDATE "profiles"
SET "active_campaigns_count" = organizer_counts."active_campaigns_count"
FROM organizer_counts
WHERE "profiles"."id" = organizer_counts."organizer_id";

DROP INDEX IF EXISTS "campaigns_pending_review_idx";

CREATE INDEX "campaigns_pending_review_idx"
ON "campaigns"("submitted_for_review_at")
WHERE "campaign_status" = 'active'
  AND "submitted_for_review_at" IS NOT NULL
  AND "reviewed_at" IS NULL;
