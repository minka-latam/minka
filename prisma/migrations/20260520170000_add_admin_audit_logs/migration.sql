CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_admin_id_idx" ON "admin_audit_logs"("admin_id");
CREATE INDEX "admin_audit_logs_entity_type_entity_id_idx" ON "admin_audit_logs"("entity_type", "entity_id");

ALTER TABLE "admin_audit_logs"
ADD CONSTRAINT "admin_audit_logs_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

