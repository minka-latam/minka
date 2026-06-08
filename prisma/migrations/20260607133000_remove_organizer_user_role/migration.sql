DROP POLICY IF EXISTS "admin_read_payment_logs" ON "payment_logs";

UPDATE "profiles"
SET "role" = 'user'
WHERE "role" = 'organizer';

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

ALTER TABLE "profiles"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole"
    USING "role"::text::"UserRole",
  ALTER COLUMN "role" SET DEFAULT 'user';

DROP TYPE "UserRole_old";

CREATE POLICY "admin_read_payment_logs"
ON "payment_logs"
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM "profiles"
    WHERE "profiles"."id" = auth.uid()
      AND "profiles"."role" = 'admin'::"UserRole"
  )
);
