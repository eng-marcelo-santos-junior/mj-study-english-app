#!/usr/bin/env python3
"""
TTS server powered by edge-tts (Microsoft Edge text-to-speech).

Endpoints
---------
GET  /voices?locale=<BCP-47>   List voices, optionally filtered by locale (e.g. "en-US").
POST /synthesize               Generate MP3 audio from text using a specific voice.

Environment variables
---------------------
PORT              TCP port to listen on (default: 5001).
ALLOWED_ORIGINS   Comma-separated CORS origins (default: "http://localhost:3000").

Quick start
-----------
    pip install -r requirements.txt
    python server.py
    # or with auto-reload during development:
    # uvicorn server:app --port 5001 --reload
"""

import os

import edge_tts
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Edge TTS Server", version="1.0.0")

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/voices")
async def list_voices(locale: str = Query(default="")) -> list[dict]:
    """
    Return available Edge TTS voices.

    If *locale* is provided (e.g. "en-US") only voices whose Locale matches
    (case-insensitive) are returned.

    Each voice object contains at minimum:
        ShortName, FriendlyName, Gender, Locale
    """
    voices = await edge_tts.list_voices()
    if locale:
        voices = [v for v in voices if v["Locale"].lower() == locale.lower()]
    return voices


class SynthesizeRequest(BaseModel):
    text: str
    voice: str  # ShortName — e.g. "en-US-JennyNeural"


@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest) -> Response:
    """
    Convert *text* to speech using the specified Edge TTS *voice* and return
    the result as an MP3 binary response.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")
    if not req.voice.strip():
        raise HTTPException(status_code=400, detail="voice must be specified")

    communicate = edge_tts.Communicate(req.text, req.voice)

    chunks: list[bytes] = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])

    audio = b"".join(chunks)
    if not audio:
        raise HTTPException(status_code=502, detail="Edge TTS returned no audio data")

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'attachment; filename="tts.mp3"'},
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
