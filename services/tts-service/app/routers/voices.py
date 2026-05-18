from fastapi import APIRouter, HTTPException, Query

from app.schemas import VoiceItem, VoicesResponse
from app.services import tts_generator

router = APIRouter()


@router.get("/voices", response_model=VoicesResponse)
async def list_voices(language: str = Query(default="")) -> VoicesResponse:
    try:
        raw = await tts_generator.list_voices(locale=language)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch voices: {exc}") from exc

    voices = [
        VoiceItem(
            name=v["FriendlyName"],
            short_name=v["ShortName"],
            locale=v["Locale"],
            gender=v["Gender"],
        )
        for v in raw
    ]
    return VoicesResponse(voices=voices)
