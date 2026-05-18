import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health, tts, voices


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title="TTS Service", version="1.0.0", docs_url="/docs", redoc_url=None)

    origins = [o.strip() for o in settings.cors_allowed_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )

    app.include_router(health.router)
    app.include_router(voices.router)
    app.include_router(tts.router)

    return app


app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=False)
