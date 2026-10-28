from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.config import Settings, get_settings
from app.core.rate_limit import rate_limit
from app.core.security import read_upload_file_safely, validate_identifier
from app.schemas.voice import Voice, VoiceListResponse
from app.services.voice_cloning import VoiceCloningService
from app.services.voices import list_voices

router = APIRouter(tags=["voices"])


@router.get("/voices", response_model=VoiceListResponse)
def voices(settings: Annotated[Settings, Depends(get_settings)]) -> VoiceListResponse:
    return list_voices(settings)


@router.post(
    "/voices/custom",
    response_model=Voice,
    dependencies=[Depends(rate_limit)],
)
async def create_custom_voice(
    file: Annotated[UploadFile, File(...)],
    name: Annotated[str, Form(...)],
    description: Annotated[str, Form()] = "Özel Klonlanmış Ses",
) -> Voice:
    clean_name = name.strip()
    if not clean_name:
        raise HTTPException(status_code=422, detail="Ses adı boş bırakılamaz.")

    # Max 25 MB limit for reference sample upload
    audio_bytes = await read_upload_file_safely(file, max_bytes=25 * 1024 * 1024)
    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Geçersiz veya çok küçük ses dosyası.")

    created = VoiceCloningService.register_voice_sample(
        name=clean_name,
        audio_bytes=audio_bytes,
        description=description.strip(),
    )
    return Voice.model_validate(created)


@router.delete("/voices/custom/{voice_id}")
def delete_custom_voice(voice_id: str) -> dict[str, str]:
    # Prevent path traversal by strictly validating voice_id format
    safe_id = validate_identifier(voice_id, param_name="voice_id")
    success = VoiceCloningService.delete_custom_voice(safe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Özel ses bulunamadı.")
    return {"status": "deleted", "id": safe_id}
