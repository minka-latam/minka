-- Make completed provider payment confirmations idempotent at the DB layer.
-- Historical duplicate completed logs are audit noise; keep the newest row.
WITH ranked_completed_logs AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "paymentprovider", "paymentid"
      ORDER BY "createdat" DESC NULLS LAST, "id" DESC
    ) AS row_number
  FROM "payment_logs"
  WHERE "status" = 'completed'
)
DELETE FROM "payment_logs"
WHERE "id" IN (
  SELECT "id"
  FROM ranked_completed_logs
  WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_logs_completed_provider_paymentid_unique"
ON "payment_logs" ("paymentprovider", "paymentid")
WHERE "status" = 'completed';
