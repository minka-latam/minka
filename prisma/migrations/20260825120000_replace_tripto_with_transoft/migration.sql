-- Replace the legacy Tripto integration with provider-neutral card fields and
-- the notification-token storage required by Transoft. This migration combines
-- the complete change because none of the superseded migrations were deployed.

ALTER TABLE "donations"
RENAME COLUMN "tripto_payment_id" TO "provider_payment_id";

ALTER TABLE "donations"
RENAME COLUMN "tripto_checkout_url" TO "provider_checkout_url";

ALTER TABLE "donations"
RENAME COLUMN "tripto_session_id" TO "provider_session_id";

ALTER TABLE "donations"
ADD COLUMN "provider_reference" TEXT,
ADD COLUMN "provider_session_expires_at" TIMESTAMP(6),
ADD COLUMN "provider_payment_date" TIMESTAMPTZ(6);

ALTER TYPE "PaymentProvider" ADD VALUE IF NOT EXISTS 'transoft';

COMMENT ON COLUMN "donations"."provider_payment_id" IS
  'External payment identifier. Existing values may belong to the legacy Tripto integration.';

COMMENT ON COLUMN "donations"."provider_checkout_url" IS
  'Hosted checkout URL. Existing values may belong to the legacy Tripto integration.';

COMMENT ON COLUMN "donations"."provider_session_id" IS
  'Hosted payment session identifier. Existing values may belong to the legacy Tripto integration.';

CREATE TABLE "transoft_notification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "donation_id" UUID NOT NULL,
    "book_code" VARCHAR(64) NOT NULL,
    "expected_status" VARCHAR(64) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transoft_notification_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transoft_notification_tokens_donation_id_fkey"
      FOREIGN KEY ("donation_id") REFERENCES "donations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "transoft_notification_tokens_token_hash_key"
ON "transoft_notification_tokens"("token_hash");

CREATE INDEX "transoft_notification_tokens_book_code_idx"
ON "transoft_notification_tokens"("book_code");

CREATE INDEX "transoft_notification_tokens_donation_id_used_at_idx"
ON "transoft_notification_tokens"("donation_id", "used_at");

CREATE INDEX "transoft_notification_tokens_expires_at_idx"
ON "transoft_notification_tokens"("expires_at");

-- The old platform-wide fixed exchange-rate setting is no longer authoritative.
-- USD transaction and BOB settlement/accounting are distinct concepts.
DROP TABLE IF EXISTS "platform_settings";
