UPDATE "profiles" p
SET "active_campaigns_count" = COALESCE(c.count, 0)
FROM (
  SELECT
    "organizer_id",
    COUNT(*)::integer AS count
  FROM "campaigns"
  WHERE "campaign_status" IN ('active', 'completed')
  GROUP BY "organizer_id"
) c
WHERE p."id" = c."organizer_id";

UPDATE "profiles" p
SET "active_campaigns_count" = 0
WHERE NOT EXISTS (
  SELECT 1
  FROM "campaigns" c
  WHERE c."organizer_id" = p."id"
    AND c."campaign_status" IN ('active', 'completed')
);
