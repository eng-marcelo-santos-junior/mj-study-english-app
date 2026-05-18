from unittest.mock import AsyncMock, patch

MOCK_VOICES_RAW = [
    {
        "ShortName": "en-US-JennyNeural",
        "FriendlyName": "Microsoft Jenny Online (Natural) - English (United States)",
        "Gender": "Female",
        "Locale": "en-US",
    },
    {
        "ShortName": "en-US-GuyNeural",
        "FriendlyName": "Microsoft Guy Online (Natural) - English (United States)",
        "Gender": "Male",
        "Locale": "en-US",
    },
    {
        "ShortName": "pt-BR-FranciscaNeural",
        "FriendlyName": "Microsoft Francisca Online (Natural) - Portuguese (Brazil)",
        "Gender": "Female",
        "Locale": "pt-BR",
    },
]


async def test_list_voices_returns_all(client):
    with patch(
        "app.routers.voices.tts_generator.list_voices",
        new=AsyncMock(return_value=MOCK_VOICES_RAW),
    ):
        response = await client.get("/voices")

    assert response.status_code == 200
    body = response.json()
    assert "voices" in body
    assert len(body["voices"]) == 3
    assert body["voices"][0]["short_name"] == "en-US-JennyNeural"
    assert body["voices"][0]["gender"] == "Female"
    assert body["voices"][0]["locale"] == "en-US"


async def test_list_voices_filters_by_language(client):
    filtered = [v for v in MOCK_VOICES_RAW if v["Locale"] == "en-US"]
    with patch(
        "app.routers.voices.tts_generator.list_voices",
        new=AsyncMock(return_value=filtered),
    ):
        response = await client.get("/voices?language=en-US")

    assert response.status_code == 200
    body = response.json()
    assert len(body["voices"]) == 2
    assert all(v["locale"] == "en-US" for v in body["voices"])


async def test_list_voices_returns_empty_on_tts_error(client):
    with patch(
        "app.routers.voices.tts_generator.list_voices",
        new=AsyncMock(side_effect=RuntimeError("network error")),
    ):
        response = await client.get("/voices")

    assert response.status_code == 502
    assert "Failed to fetch voices" in response.json()["detail"]
