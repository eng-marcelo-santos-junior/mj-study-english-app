from typing import Literal

from pydantic import BaseModel, field_validator


class HealthResponse(BaseModel):
    status: str


class VoiceItem(BaseModel):
    name: str
    short_name: str
    locale: str
    gender: str


class VoicesResponse(BaseModel):
    voices: list[VoiceItem]


class GenerateRequest(BaseModel):
    card_id: str
    user_id: str
    side: Literal["front", "back"]
    text: str
    language: str
    voice: str
    rate: str = "+0%"
    pitch: str = "+0Hz"

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text cannot be empty")
        return v

    @field_validator("voice")
    @classmethod
    def voice_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("voice must be specified")
        return v


class GenerateResponse(BaseModel):
    card_id: str
    side: str
    audio_url: str
    storage_path: str
    voice: str
    language: str
    format: str = "mp3"
    audio_size_bytes: int = 0


class SynthesizeRequest(BaseModel):
    text: str
    voice: str
