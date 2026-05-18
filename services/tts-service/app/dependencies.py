from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)


async def verify_api_key(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer),
    settings: Settings = Depends(get_settings),
) -> None:
    if not settings.tts_internal_api_key:
        return
    if not credentials or credentials.credentials != settings.tts_internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
