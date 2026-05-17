-- AddColumn: TTS metadata fields for generated audio
ALTER TABLE "flashcards"
  ADD COLUMN "front_audio_source"        TEXT,
  ADD COLUMN "front_audio_provider"      TEXT,
  ADD COLUMN "front_audio_language"      TEXT,
  ADD COLUMN "front_audio_voice"         TEXT,
  ADD COLUMN "front_audio_text_hash"     TEXT,
  ADD COLUMN "front_audio_generated_at"  TIMESTAMPTZ,
  ADD COLUMN "back_audio_source"         TEXT,
  ADD COLUMN "back_audio_provider"       TEXT,
  ADD COLUMN "back_audio_language"       TEXT,
  ADD COLUMN "back_audio_voice"          TEXT,
  ADD COLUMN "back_audio_text_hash"      TEXT,
  ADD COLUMN "back_audio_generated_at"   TIMESTAMPTZ;
