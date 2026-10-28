import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from pydantic import BaseModel

from app.core.rate_limit import rate_limit
from app.core.security import read_upload_file_safely, validate_external_url
from app.schemas.stt import (
    STTDiarizeRequest,
    STTDiarizeResponse,
    STTRefineRequest,
    STTRefineResponse,
    STTResponse,
    STTTranslateRequest,
    STTTranslateResponse,
)
from app.services.dialogue_diarizer import diarize_dialogue_sync
from app.services.stt import STTService
from app.services.transcript_refiner import refine_and_extract_highlights
from app.services.translator import translate_transcript_sync

router = APIRouter(tags=["stt"])


class URLTranscribeRequest(BaseModel):
    url: str
    language: str | None = None
    target_language: str | None = None


@router.post(
    "/transcribe/file",
    response_model=STTResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit)],
)
async def transcribe_file(
    file: Annotated[UploadFile, File(...)],
    language: Annotated[str | None, Form()] = None,
    target_language: Annotated[str | None, Form()] = None,
) -> STTResponse:
    # Safely stream and enforce max 50MB file size limit to prevent OOM
    content = await read_upload_file_safely(file, max_bytes=50 * 1024 * 1024)
    service = STTService()
    result = await service.transcribe_audio_file(
        file_bytes=content,
        filename=file.filename or "audio.mp3",
        language=language,
    )
    if target_language and target_language.strip() and target_language != "none":
        tr_res = await asyncio.to_thread(
            translate_transcript_sync,
            result.get("text", ""),
            target_language.strip(),
            result.get("language") or language or "auto",
        )
        result["translated_text"] = tr_res["translated_text"]
        result["target_language"] = tr_res["target_language"]
    return STTResponse(**result)


@router.post(
    "/transcribe/url",
    response_model=STTResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit)],
)
async def transcribe_url(
    payload: URLTranscribeRequest,
) -> STTResponse:
    # SSRF protection: validate scheme, hostname and block private/loopback/cloud metadata IPs
    safe_url = validate_external_url(payload.url)
    service = STTService()
    result = await service.transcribe_url(
        url=safe_url,
        language=payload.language,
    )
    if (
        payload.target_language
        and payload.target_language.strip()
        and payload.target_language != "none"
    ):
        tr_res = await asyncio.to_thread(
            translate_transcript_sync,
            result.get("text", ""),
            payload.target_language.strip(),
            result.get("language") or payload.language or "auto",
        )
        result["translated_text"] = tr_res["translated_text"]
        result["target_language"] = tr_res["target_language"]
    return STTResponse(**result)


@router.post(
    "/transcribe/refine",
    response_model=STTRefineResponse,
    status_code=status.HTTP_200_OK,
)
async def refine_transcript(
    payload: STTRefineRequest,
) -> STTRefineResponse:
    result = await asyncio.to_thread(
        refine_and_extract_highlights,
        payload.text,
        payload.language,
    )
    return STTRefineResponse(**result)


@router.post(
    "/transcribe/translate",
    response_model=STTTranslateResponse,
    status_code=status.HTTP_200_OK,
)
async def translate_transcript(
    payload: STTTranslateRequest,
) -> STTTranslateResponse:
    result = await asyncio.to_thread(
        translate_transcript_sync,
        payload.text,
        payload.target_language,
        payload.source_language,
    )
    return STTTranslateResponse(**result)


@router.post(
    "/transcribe/diarize",
    response_model=STTDiarizeResponse,
    status_code=status.HTTP_200_OK,
)
async def diarize_transcript_endpoint(
    payload: STTDiarizeRequest,
) -> STTDiarizeResponse:
    segments_dict = [s.model_dump() for s in payload.segments]
    result = await asyncio.to_thread(
        diarize_dialogue_sync,
        payload.text,
        segments_dict,
        payload.speaker_count,
        payload.api_key,
    )
    return STTDiarizeResponse(**result)

