ALTER TABLE "donations"
ADD COLUMN "claim_token_hash" TEXT,
ADD COLUMN "claimed_at" TIMESTAMP(6);

UPDATE "campaigns"
SET
  "goal_amount" = ROUND("goal_amount"::numeric, 2),
  "collected_amount" = ROUND("collected_amount"::numeric, 2),
  "tip_collected" = ROUND("tip_collected"::numeric, 2);

UPDATE "donations"
SET
  "amount" = ROUND("amount"::numeric, 2),
  "tip_amount" = CASE
    WHEN "tip_amount" IS NULL THEN NULL
    ELSE ROUND("tip_amount"::numeric, 2)
  END,
  "total_amount" = CASE
    WHEN "total_amount" IS NULL THEN NULL
    ELSE ROUND("total_amount"::numeric, 2)
  END,
  "provider_amount" = CASE
    WHEN "provider_amount" IS NULL THEN NULL
    ELSE ROUND("provider_amount"::numeric, 2)
  END,
  "provider_tip_amount" = CASE
    WHEN "provider_tip_amount" IS NULL THEN NULL
    ELSE ROUND("provider_tip_amount"::numeric, 2)
  END,
  "provider_total_amount" = CASE
    WHEN "provider_total_amount" IS NULL THEN NULL
    ELSE ROUND("provider_total_amount"::numeric, 2)
  END;

UPDATE "payment_logs"
SET
  "amount" = ROUND("amount"::numeric, 2),
  "tipamount" = CASE
    WHEN "tipamount" IS NULL THEN NULL
    ELSE ROUND("tipamount"::numeric, 2)
  END;

UPDATE "fund_transfers"
SET "amount" = ROUND("amount"::numeric, 2);

ALTER TABLE "campaigns"
ALTER COLUMN "goal_amount" TYPE DECIMAL(12,2) USING ROUND("goal_amount"::numeric, 2),
ALTER COLUMN "collected_amount" TYPE DECIMAL(12,2) USING ROUND("collected_amount"::numeric, 2),
ALTER COLUMN "tip_collected" TYPE DECIMAL(12,2) USING ROUND("tip_collected"::numeric, 2);

ALTER TABLE "donations"
ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2),
ALTER COLUMN "tip_amount" TYPE DECIMAL(12,2) USING ROUND("tip_amount"::numeric, 2),
ALTER COLUMN "total_amount" TYPE DECIMAL(12,2) USING ROUND("total_amount"::numeric, 2),
ALTER COLUMN "provider_amount" TYPE DECIMAL(12,2) USING ROUND("provider_amount"::numeric, 2),
ALTER COLUMN "provider_tip_amount" TYPE DECIMAL(12,2) USING ROUND("provider_tip_amount"::numeric, 2),
ALTER COLUMN "provider_total_amount" TYPE DECIMAL(12,2) USING ROUND("provider_total_amount"::numeric, 2);

ALTER TABLE "payment_logs"
ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2),
ALTER COLUMN "tipamount" TYPE DECIMAL(12,2) USING ROUND("tipamount"::numeric, 2);

ALTER TABLE "fund_transfers"
ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);
