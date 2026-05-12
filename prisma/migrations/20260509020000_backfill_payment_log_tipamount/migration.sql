-- Backfill Tripto payment log tips from historical metadata.
-- Existing metadata is intentionally preserved for audit history.
UPDATE "payment_logs"
SET "tipamount" = ("metadata"::jsonb ->> 'tip_amount')::DECIMAL
WHERE "paymentprovider" = 'tripto'
  AND "tipamount" IS NULL
  AND "metadata" IS NOT NULL
  AND "metadata"::jsonb ? 'tip_amount'
  AND ("metadata"::jsonb ->> 'tip_amount') ~ '^-?[0-9]+(\.[0-9]+)?$';
