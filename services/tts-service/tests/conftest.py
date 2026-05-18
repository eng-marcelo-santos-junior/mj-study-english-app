import pytest
from httpx import ASGITransport, AsyncClient

from app.config import Settings, get_settings
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def base_settings() -> Settings:
    return Settings(
        supabase_url="https://test.supabase.co",
        supabase_service_role_key="test-service-key",
        supabase_audio_bucket="flashcard-audios",
        max_tts_text_length=5000,
        cors_allowed_origins="http://localhost:3000",
        tts_internal_api_key="",
    )


@pytest.fixture
def settings_with_key() -> Settings:
    return Settings(
        supabase_url="https://test.supabase.co",
        supabase_service_role_key="test-service-key",
        supabase_audio_bucket="flashcard-audios",
        max_tts_text_length=5000,
        cors_allowed_origins="http://localhost:3000",
        tts_internal_api_key="supersecretkey",
    )


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    yield
    app.dependency_overrides.clear()
