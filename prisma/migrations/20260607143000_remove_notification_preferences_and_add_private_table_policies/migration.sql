DROP TABLE IF EXISTS "notification_preferences";

ALTER TABLE "admin_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_bank_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_notification_logs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_admin_audit_logs" ON "admin_audit_logs";
CREATE POLICY "admin_read_admin_audit_logs"
ON "admin_audit_logs"
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
      AND "profiles"."status" = 'active'::"Status"
  )
);

DROP POLICY IF EXISTS "service_insert_admin_audit_logs" ON "admin_audit_logs";
CREATE POLICY "service_insert_admin_audit_logs"
ON "admin_audit_logs"
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "read_campaign_bank_accounts" ON "campaign_bank_accounts";
CREATE POLICY "read_campaign_bank_accounts"
ON "campaign_bank_accounts"
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
      AND "profiles"."status" = 'active'::"Status"
  )
  OR EXISTS (
    SELECT 1
    FROM "campaigns"
    WHERE "campaigns"."id" = "campaign_bank_accounts"."campaign_id"
      AND "campaigns"."organizer_id" = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_own_campaign_bank_accounts" ON "campaign_bank_accounts";
CREATE POLICY "insert_own_campaign_bank_accounts"
ON "campaign_bank_accounts"
FOR INSERT
TO public
WITH CHECK (
  "created_by_id" = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM "campaigns"
    WHERE "campaigns"."id" = "campaign_bank_accounts"."campaign_id"
      AND "campaigns"."organizer_id" = auth.uid()
  )
);

DROP POLICY IF EXISTS "update_own_campaign_bank_accounts" ON "campaign_bank_accounts";
CREATE POLICY "update_own_campaign_bank_accounts"
ON "campaign_bank_accounts"
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
      AND "profiles"."status" = 'active'::"Status"
  )
  OR EXISTS (
    SELECT 1
    FROM "campaigns"
    WHERE "campaigns"."id" = "campaign_bank_accounts"."campaign_id"
      AND "campaigns"."organizer_id" = auth.uid()
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
  OR EXISTS (
    SELECT 1
    FROM "campaigns"
    WHERE "campaigns"."id" = "campaign_bank_accounts"."campaign_id"
      AND "campaigns"."organizer_id" = auth.uid()
  )
);

DROP POLICY IF EXISTS "admin_read_logs" ON "system_notification_logs";
CREATE POLICY "admin_read_logs"
ON "system_notification_logs"
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
      AND "profiles"."status" = 'active'::"Status"
  )
);

DROP POLICY IF EXISTS "service_insert_logs" ON "system_notification_logs";
CREATE POLICY "service_insert_logs"
ON "system_notification_logs"
FOR INSERT
TO service_role
WITH CHECK (true);
