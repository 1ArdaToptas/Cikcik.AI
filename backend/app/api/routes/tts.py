from typing import Annotated

from fastapi import APIRouter, Depends, Response, status

from app.core.config import Settings, get_settings
from app.core.rate_limit import rate_limit
from app.schemas.tts import TTSRequest
from app.services.tts import generate_speech

router = APIRouter(tags=["tts"])


@router.post(
    "/tts",
    status_code=status.HTTP_201_CREATED,
    response_class=Response,
    dependencies=[Depends(rate_limit)],
    responses={
        201: {
            "content": {"audio/mpeg": {}, "audio/wav": {}},
            "description": (
                "Audio stream (mp3 for fluent neural voices, wav for offline Piper). "
                "Metadata is returned in X-Generation-Id, X-Duration-Seconds, "
                "X-Audio-Format and X-TTS-Provider headers."
            ),
        }
    },
)
async def create_speech(
    payload: TTSRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> Response:
    result = await generate_speech(payload, settings)
    fmt = "mp3" if result.media_type == "audio/mpeg" else "wav"
    return Response(
        content=result.audio,
        status_code=status.HTTP_201_CREATED,
        media_type=result.media_type,
        headers={
            "X-Generation-Id": result.id,
            "X-Duration-Seconds": str(result.duration_seconds),
            "X-TTS-Provider": result.provider,
            "X-Audio-Format": fmt,
            "Cache-Control": "no-store",
        },
    )
