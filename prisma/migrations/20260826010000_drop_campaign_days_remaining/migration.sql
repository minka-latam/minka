-- Remaining days are derived from end_date and the current Bolivia date.
-- Persisting the value created a second, stale source of truth.
ALTER TABLE "campaigns" DROP COLUMN "days_remaining";
