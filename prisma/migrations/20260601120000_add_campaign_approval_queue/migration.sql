ALTER TABLE "campaigns"
ADD COLUMN "submitted_for_review_at" TIMESTAMP(6),
ADD COLUMN "reviewed_at" TIMESTAMP(6);

CREATE INDEX "campaigns_pending_review_idx"
ON "campaigns"("submitted_for_review_at")
WHERE "campaign_status" = 'draft'
  AND "submitted_for_review_at" IS NOT NULL;
