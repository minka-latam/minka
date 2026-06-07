ALTER TABLE "campaigns"
ADD COLUMN "subtitle" TEXT NOT NULL DEFAULT '';

UPDATE "campaigns"
SET
  "subtitle" = COALESCE("description", ''),
  "description" = COALESCE(NULLIF("story", ''), "description")
WHERE "story" IS NOT NULL;

ALTER TABLE "campaigns"
DROP COLUMN "story";
