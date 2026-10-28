from pydantic import BaseModel, Field


class Voice(BaseModel):
    id: str
    name: str
    style: str
    tag: str
    gender: str = "Unspecified"
    engine: str = "edge"
    languages: list[str] = Field(description="Language ids this voice can speak.")
    is_custom: bool = False


class Language(BaseModel):
    id: str
    label: str
    native: str


class TTSLimits(BaseModel):
    max_text_length: int
    min_speed: float
    max_speed: float


class VoiceListResponse(BaseModel):
    voices: list[Voice]
    languages: list[Language]
    limits: TTSLimits
