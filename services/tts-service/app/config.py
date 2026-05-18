from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_audio_bucket: str = "flashcard-audios"
    max_tts_text_length: int = 5000
    cors_allowed_origins: str = "http://localhost:3000"
    tts_internal_api_key: str = ""
    port: int = 5001

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
