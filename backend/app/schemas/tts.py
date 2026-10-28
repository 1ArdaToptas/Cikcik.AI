from pydantic import BaseModel, Field, field_validator

from app.core.config import settings


class TTSRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=settings.tts_max_text_length,
        description="Text to convert into speech.",
        examples=["Merhaba, bu yerel Piper modeliyle üretilmiş bir sestir."],
    )
    voice_id: str = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Catalog voice identifier.",
        examples=["piper-tr"],
    )
    language: str = Field(
        ...,
        min_length=2,
        max_length=16,
        description="BCP-47 style language id, for example tr-tr.",
        examples=["tr-tr"],
    )
    speed: float = Field(
        default=1.0,
        ge=settings.tts_min_speed,
        le=settings.tts_max_speed,
        description="Playback rate relative to the default voice speed.",
        examples=[1.0],
    )

    @field_validator("text")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if not normalized:
            raise ValueError("text must not be empty")
        return normalized

    @field_validator("voice_id", "language")
    @classmethod
    def normalize_token(cls, value: str) -> str:
        return value.strip().lower()


class TTSResult(BaseModel):
    """Internal result of a synthesis; the API returns the audio bytes directly."""

    id: str
    audio: bytes
    media_type: str = "audio/wav"
    duration_seconds: float
    provider: str = "piper"
