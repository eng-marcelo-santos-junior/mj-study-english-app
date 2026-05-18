from unittest.mock import AsyncMock, patch

from app.config import get_settings
from app.main import app

SAMPLE_AUDIO = b"FAKE_MP3_AUDIO_DATA"
SAMPLE_URL = "https://test.supabase.co/storage/v1/sign/flashcard-audios/uid/cid/front.mp3?token=x"

VALID_GENERATE_PAYLOAD = {
    "card_id": "card-abc-123",
    "user_id": "user-xyz-456",
    "side": "front",
    "text": "Based on the requirements, we need to redesign the data pipeline.",
    "language": "en-US",
    "voice": "en-US-JennyNeural",
}


# ── /synthesize ──────────────────────────────────────────────────────────────


async def test_synthesize_success(client):
    with patch(
        "app.routers.tts.tts_generator.generate_audio",
        new=AsyncMock(return_value=SAMPLE_AUDIO),
    ):
        response = await client.post(
            "/synthesize", json={"text": "hello world", "voice": "en-US-JennyNeural"}
        )

    assert response.status_code == 200
    assert response.content == SAMPLE_AUDIO
    assert response.headers["content-type"] == "audio/mpeg"


async def test_synthesize_rejects_empty_text(client):
    response = await client.post("/synthesize", json={"text": "", "voice": "en-US-JennyNeural"})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]


async def test_synthesize_handles_tts_failure(client):
    with patch(
        "app.routers.tts.tts_generator.generate_audio",
        new=AsyncMock(side_effect=RuntimeError("Edge TTS returned no audio data")),
    ):
        response = await client.post(
            "/synthesize", json={"text": "hello", "voice": "en-US-JennyNeural"}
        )

    assert response.status_code == 502
    assert "Edge TTS returned no audio data" in response.json()["detail"]


# ── /tts/generate ─────────────────────────────────────────────────────────────


async def test_generate_success(client, base_settings):
    app.dependency_overrides[get_settings] = lambda: base_settings

    with (
        patch(
            "app.routers.tts.tts_generator.generate_audio",
            new=AsyncMock(return_value=SAMPLE_AUDIO),
        ),
        patch(
            "app.routers.tts.storage_service.upload_audio",
            new=AsyncMock(return_value=SAMPLE_URL),
        ),
    ):
        response = await client.post("/tts/generate", json=VALID_GENERATE_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["card_id"] == "card-abc-123"
    assert body["side"] == "front"
    assert body["audio_url"] == SAMPLE_URL
    assert body["storage_path"] == "user-xyz-456/card-abc-123/front.mp3"
    assert body["voice"] == "en-US-JennyNeural"
    assert body["language"] == "en-US"
    assert body["format"] == "mp3"
    assert body["audio_size_bytes"] == len(SAMPLE_AUDIO)


async def test_generate_rejects_empty_text(client, base_settings):
    app.dependency_overrides[get_settings] = lambda: base_settings

    payload = {**VALID_GENERATE_PAYLOAD, "text": ""}
    response = await client.post("/tts/generate", json=payload)
    # Pydantic validator raises 422
    assert response.status_code == 422


async def test_generate_rejects_text_above_limit(client, base_settings):
    app.dependency_overrides[get_settings] = lambda: base_settings

    payload = {**VALID_GENERATE_PAYLOAD, "text": "a" * 6000}
    response = await client.post("/tts/generate", json=payload)
    assert response.status_code == 400
    assert "maximum length" in response.json()["detail"]


async def test_generate_rejects_invalid_side(client, base_settings):
    app.dependency_overrides[get_settings] = lambda: base_settings

    payload = {**VALID_GENERATE_PAYLOAD, "side": "middle"}
    response = await client.post("/tts/generate", json=payload)
    assert response.status_code == 422


async def test_generate_requires_auth_when_key_configured(client, settings_with_key):
    app.dependency_overrides[get_settings] = lambda: settings_with_key

    response = await client.post("/tts/generate", json=VALID_GENERATE_PAYLOAD)
    assert response.status_code == 401
    assert "API key" in response.json()["detail"]


async def test_generate_accepts_valid_bearer_token(client, settings_with_key):
    app.dependency_overrides[get_settings] = lambda: settings_with_key

    with (
        patch(
            "app.routers.tts.tts_generator.generate_audio",
            new=AsyncMock(return_value=SAMPLE_AUDIO),
        ),
        patch(
            "app.routers.tts.storage_service.upload_audio",
            new=AsyncMock(return_value=SAMPLE_URL),
        ),
    ):
        response = await client.post(
            "/tts/generate",
            json=VALID_GENERATE_PAYLOAD,
            headers={"Authorization": "Bearer supersecretkey"},
        )

    assert response.status_code == 200


async def test_generate_handles_tts_failure(client, base_settings):
    app.dependency_overrides[get_settings] = lambda: base_settings

    with patch(
        "app.routers.tts.tts_generator.generate_audio",
        new=AsyncMock(side_effect=RuntimeError("Edge TTS returned no audio data")),
    ):
        response = await client.post("/tts/generate", json=VALID_GENERATE_PAYLOAD)

    assert response.status_code == 502
    assert "TTS generation failed" in response.json()["detail"]


async def test_generate_handles_storage_failure(client, base_settings):
    app.dependency_overrides[get_settings] = lambda: base_settings

    with (
        patch(
            "app.routers.tts.tts_generator.generate_audio",
            new=AsyncMock(return_value=SAMPLE_AUDIO),
        ),
        patch(
            "app.routers.tts.storage_service.upload_audio",
            new=AsyncMock(side_effect=RuntimeError("Bucket not found")),
        ),
    ):
        response = await client.post("/tts/generate", json=VALID_GENERATE_PAYLOAD)

    assert response.status_code == 502
    assert "Storage upload failed" in response.json()["detail"]


async def test_generate_no_temp_files_created(client, base_settings, tmp_path):
    """Audio bytes are processed entirely in memory — no temp files on disk."""
    import os

    app.dependency_overrides[get_settings] = lambda: base_settings

    files_before = set(os.listdir(tmp_path))

    with (
        patch(
            "app.routers.tts.tts_generator.generate_audio",
            new=AsyncMock(return_value=SAMPLE_AUDIO),
        ),
        patch(
            "app.routers.tts.storage_service.upload_audio",
            new=AsyncMock(return_value=SAMPLE_URL),
        ),
    ):
        await client.post("/tts/generate", json=VALID_GENERATE_PAYLOAD)

    files_after = set(os.listdir(tmp_path))
    assert files_before == files_after
