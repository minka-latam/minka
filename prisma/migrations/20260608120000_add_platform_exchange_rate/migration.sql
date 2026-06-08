ALTER TABLE "donations"
ADD COLUMN "exchange_rate" DECIMAL(10,4),
ADD COLUMN "provider_amount" DECIMAL,
ADD COLUMN "provider_tip_amount" DECIMAL,
ADD COLUMN "provider_total_amount" DECIMAL,
ADD COLUMN "provider_currency" TEXT;

CREATE TABLE "platform_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "usd_to_bob_exchange_rate" DECIMAL(10,4) NOT NULL DEFAULT 6.9600,
  "updated_by_id" UUID,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "platform_settings_updated_by_id_fkey"
    FOREIGN KEY ("updated_by_id")
    REFERENCES "profiles"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT "platform_settings_usd_to_bob_exchange_rate_positive"
    CHECK ("usd_to_bob_exchange_rate" > 0)
);

INSERT INTO "platform_settings" ("id", "usd_to_bob_exchange_rate")
VALUES ('default', 6.9600)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "platform_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_platform_settings"
ON "platform_settings"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
      AND "profiles"."status" = 'active'::"Status"
  )
);

CREATE POLICY "admin_update_platform_settings"
ON "platform_settings"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
      AND "profiles"."status" = 'active'::"Status"
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
      AND "profiles"."status" = 'active'::"Status"
  )
);
