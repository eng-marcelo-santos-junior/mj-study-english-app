-- Add new columns with a default (empty string) so existing rows don't fail
ALTER TABLE "flashcards" ADD COLUMN "front_content" TEXT NOT NULL DEFAULT '';
ALTER TABLE "flashcards" ADD COLUMN "back_content" TEXT NOT NULL DEFAULT '';

-- Copy existing data from old columns into new columns
UPDATE "flashcards" SET "front_content" = "front", "back_content" = "back";

-- Remove the default constraints now that data is migrated
ALTER TABLE "flashcards" ALTER COLUMN "front_content" DROP DEFAULT;
ALTER TABLE "flashcards" ALTER COLUMN "back_content" DROP DEFAULT;

-- Drop old columns
ALTER TABLE "flashcards" DROP COLUMN "front";
ALTER TABLE "flashcards" DROP COLUMN "back";
