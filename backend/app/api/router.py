from fastapi import APIRouter

from app.api.routes import health, stt, tts, voices

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(voices.router)
api_router.include_router(tts.router)
api_router.include_router(stt.router)
