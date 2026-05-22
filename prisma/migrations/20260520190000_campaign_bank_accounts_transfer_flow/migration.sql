CREATE TYPE "BankAccountStatus" AS ENUM ('active', 'replaced', 'disabled');

CREATE TABLE "campaign_bank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_type" TEXT,
    "status" "BankAccountStatus" NOT NULL DEFAULT 'active',
    "created_by_id" UUID NOT NULL,
    "replaced_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaign_bank_accounts_campaign_id_idx" ON "campaign_bank_accounts"("campaign_id");
CREATE INDEX "campaign_bank_accounts_created_by_id_idx" ON "campaign_bank_accounts"("created_by_id");
CREATE UNIQUE INDEX "campaign_bank_accounts_one_active_per_campaign_idx"
ON "campaign_bank_accounts"("campaign_id")
WHERE "status" = 'active';

ALTER TABLE "campaign_bank_accounts"
ADD CONSTRAINT "campaign_bank_accounts_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "campaign_bank_accounts"
ADD CONSTRAINT "campaign_bank_accounts_created_by_id_fkey"
FOREIGN KEY ("created_by_id") REFERENCES "profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fund_transfers"
ADD COLUMN "campaign_bank_account_id" UUID,
ADD COLUMN "requested_by_id" UUID,
ADD COLUMN "reviewed_by_id" UUID,
ADD COLUMN "reviewed_at" TIMESTAMP(6),
ADD COLUMN "completed_at" TIMESTAMP(6),
ADD COLUMN "rejected_at" TIMESTAMP(6);

UPDATE "fund_transfers"
SET "requested_by_id" = "campaigns"."organizer_id"
FROM "campaigns"
WHERE "fund_transfers"."campaign_id" = "campaigns"."id"
  AND "fund_transfers"."requested_by_id" IS NULL;

ALTER TABLE "fund_transfers"
ALTER COLUMN "requested_by_id" SET NOT NULL;

ALTER TABLE "fund_transfers"
DROP COLUMN IF EXISTS "frequency";

DROP TYPE IF EXISTS "TransferFrequency";

CREATE INDEX "fund_transfers_campaign_bank_account_id_idx" ON "fund_transfers"("campaign_bank_account_id");
CREATE INDEX "fund_transfers_requested_by_id_idx" ON "fund_transfers"("requested_by_id");
CREATE INDEX "fund_transfers_reviewed_by_id_idx" ON "fund_transfers"("reviewed_by_id");

ALTER TABLE "fund_transfers"
ADD CONSTRAINT "fund_transfers_campaign_bank_account_id_fkey"
FOREIGN KEY ("campaign_bank_account_id") REFERENCES "campaign_bank_accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fund_transfers"
ADD CONSTRAINT "fund_transfers_requested_by_id_fkey"
FOREIGN KEY ("requested_by_id") REFERENCES "profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fund_transfers"
ADD CONSTRAINT "fund_transfers_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id") REFERENCES "profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
