-- AlterTable
ALTER TABLE "flashcards" ADD COLUMN "front_audio_url" TEXT,
ADD COLUMN "front_audio_path" TEXT,
ADD COLUMN "front_audio_size" INTEGER,
ADD COLUMN "front_audio_name" TEXT,
ADD COLUMN "back_audio_url" TEXT,
ADD COLUMN "back_audio_path" TEXT,
ADD COLUMN "back_audio_size" INTEGER,
ADD COLUMN "back_audio_name" TEXT,
ADD COLUMN "audio_updated_at" TIMESTAMP(3);
