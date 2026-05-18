from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response

from app.config import Settings, get_settings
from app.dependencies import verify_api_key
from app.schemas import GenerateRequest, GenerateResponse, SynthesizeRequest
from app.services import storage as storage_service
from app.services import tts_generator

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.post("/tts/generate", response_model=GenerateResponse)
async def generate(
    req: GenerateRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateResponse:
    if len(req.text) > settings.max_tts_text_length:
        raise HTTPException(
            status_code=400,
            detail=f"text exceeds maximum length of {settings.max_tts_text_length} characters",
        )

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Storage not configured on this server")

    try:
        audio = await tts_generator.generate_audio(req.text, req.voice, req.rate, req.pitch)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"TTS generation failed: {exc}") from exc

    storage_path = f"{req.user_id}/{req.card_id}/{req.side}.mp3"

    try:
        audio_url = await storage_service.upload_audio(
            audio,
            storage_path,
            settings.supabase_audio_bucket,
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {exc}") from exc

    return GenerateResponse(
        card_id=req.card_id,
        side=req.side,
        audio_url=audio_url,
        storage_path=storage_path,
        voice=req.voice,
        language=req.language,
        format="mp3",
        audio_size_bytes=len(audio),
    )


@router.post("/synthesize")
async def synthesize(req: SynthesizeRequest) -> Response:
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")
    if not req.voice.strip():
        raise HTTPException(status_code=400, detail="voice must be specified")

    try:
        audio = await tts_generator.generate_audio(req.text, req.voice)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'attachment; filename="tts.mp3"'},
    )
