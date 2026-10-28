import asyncio
import threading
from uuid import uuid4

from app.core.config import Settings, get_settings
from app.core.exceptions import (
    LanguageNotSupportedError,
    ServerBusyError,
    VoiceNotFoundError,
)
from app.data.catalog import SUPPORTED_LANGUAGE_IDS
from app.schemas.tts import TTSRequest, TTSResult
from app.services.edge import EdgeTTSClient
from app.services.piper import PiperClient
from app.services.voice_cloning import VoiceCloningService
from app.services.voices import get_voice

_pending = 0
_pending_lock = threading.Lock()


def _validate(payload: TTSRequest) -> dict:
    voice = get_voice(payload.voice_id)
    if voice is None:
        raise VoiceNotFoundError(payload.voice_id)
    if payload.language not in SUPPORTED_LANGUAGE_IDS:
        raise LanguageNotSupportedError(payload.language)
    if payload.language not in voice["languages"]:
        raise LanguageNotSupportedError(payload.language, voice_id=payload.voice_id)
    return voice


async def generate_speech(
    payload: TTSRequest,
    settings: Settings | None = None,
) -> TTSResult:
    global _pending
    settings = settings or get_settings()
    voice = _validate(payload)

    with _pending_lock:
        if _pending >= settings.tts_max_queue:
            raise ServerBusyError()
        _pending += 1

    try:
        engine = voice.get("engine", "edge")

        if engine == "edge":
            edge_client = EdgeTTSClient()
            audio, duration = await edge_client.synthesize(
                voice_id=payload.voice_id,
                text=payload.text,
                speed=payload.speed,
            )
            media_type = "audio/mpeg"
        elif engine == "custom_clone":
            audio, duration = await asyncio.to_thread(
                VoiceCloningService.synthesize_with_voice,
                text=payload.text,
                voice_id=payload.voice_id,
                language=payload.language,
                speed=payload.speed,
            )
            media_type = "audio/wav"
        else:
            # Piper local engine
            piper_client = PiperClient(settings)
            audio, duration = await asyncio.to_thread(
                piper_client.synthesize,
                text=payload.text,
                speed=payload.speed,
            )
            media_type = "audio/wav"

    finally:
        with _pending_lock:
            _pending -= 1

    return TTSResult(
        id=f"gen_{uuid4().hex}",
        audio=audio,
        media_type=media_type,
        duration_seconds=duration,
        provider=engine,
    )
