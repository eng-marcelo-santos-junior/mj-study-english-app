import edge_tts


async def generate_audio(
    text: str,
    voice: str,
    rate: str = "+0%",
    pitch: str = "+0Hz",
) -> bytes:
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    chunks: list[bytes] = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    audio = b"".join(chunks)
    if not audio:
        raise RuntimeError("Edge TTS returned no audio data")
    return audio


async def list_voices(locale: str = "") -> list[dict]:
    voices: list[dict] = await edge_tts.list_voices()
    if locale:
        voices = [v for v in voices if v["Locale"].lower() == locale.lower()]
    return voices
