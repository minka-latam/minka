UPDATE "fund_transfers"
SET "status" = 'cancelled'::"TransferStatus"
WHERE "status" = 'rejected'::"TransferStatus";

ALTER TABLE "fund_transfers"
ALTER COLUMN "status" DROP DEFAULT;

CREATE TYPE "TransferStatus_new" AS ENUM ('processing', 'completed', 'cancelled');

ALTER TABLE "fund_transfers"
ALTER COLUMN "status" TYPE "TransferStatus_new"
USING "status"::text::"TransferStatus_new";

DROP TYPE "TransferStatus";

ALTER TYPE "TransferStatus_new" RENAME TO "TransferStatus";

ALTER TABLE "fund_transfers"
ALTER COLUMN "status" SET DEFAULT 'processing'::"TransferStatus";

ALTER TABLE "fund_transfers"
DROP COLUMN IF EXISTS "rejected_at";
