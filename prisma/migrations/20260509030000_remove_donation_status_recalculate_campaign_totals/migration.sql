-- Repair completed QR donation tips from existing payment logs before recalculating campaign totals.
WITH latest_tip_log AS (
  SELECT DISTINCT ON ((metadata::jsonb ->> 'donationId'))
    (metadata::jsonb ->> 'donationId')::uuid AS donation_id,
    tipamount
  FROM "payment_logs"
  WHERE metadata IS NOT NULL
    AND metadata::jsonb ? 'donationId'
    AND (metadata::jsonb ->> 'donationId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND tipamount IS NOT NULL
    AND tipamount <> 0
  ORDER BY (metadata::jsonb ->> 'donationId'), createdat DESC NULLS LAST
)
UPDATE "donations" AS d
SET
  "tip_amount" = l.tipamount,
  "total_amount" = d."amount" + l.tipamount,
  "updated_at" = now()
FROM latest_tip_log AS l
WHERE d."id" = l.donation_id
  AND d."payment_status" = 'completed'
  AND COALESCE(d."tip_amount", 0) = 0;

-- Campaign accounting is derived from completed donations only.
WITH campaign_totals AS (
  SELECT
    c."id",
    COALESCE(SUM(d."amount") FILTER (WHERE d."payment_status" = 'completed'), 0) AS collected_amount,
    COALESCE(SUM(COALESCE(d."tip_amount", 0)) FILTER (WHERE d."payment_status" = 'completed'), 0) AS tip_collected,
    COUNT(d."id") FILTER (WHERE d."payment_status" = 'completed')::integer AS donor_count
  FROM "campaigns" AS c
  LEFT JOIN "donations" AS d ON d."campaign_id" = c."id"
  GROUP BY c."id"
)
UPDATE "campaigns" AS c
SET
  "collected_amount" = t.collected_amount,
  "tip_collected" = t.tip_collected,
  "donor_count" = t.donor_count,
  "percentage_funded" = CASE
    WHEN c."goal_amount" > 0 THEN ((t.collected_amount / c."goal_amount") * 100)::double precision
    ELSE 0
  END,
  "updated_at" = now()
FROM campaign_totals AS t
WHERE c."id" = t."id";

ALTER TABLE "donations" DROP COLUMN IF EXISTS "status";
