from functools import lru_cache
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_PATH = BACKEND_DIR / "models" / "piper" / "tr_TR-dfki-medium.onnx"


class Settings(BaseSettings):
    app_name: str = "TTS App API"
    app_version: str = "0.2.0"
    environment: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    tts_max_text_length: int = 100000
    tts_min_speed: float = 0.5
    tts_max_speed: float = 2.0
    # Synthesis runs one at a time; this caps how many requests may wait.
    tts_max_queue: int = 4
    tts_rate_limit_per_minute: int = 30

    piper_model_path: Path = DEFAULT_MODEL_PATH
    piper_use_cuda: bool = False

    # The .env file is resolved relative to the backend folder so the server
    # behaves the same no matter which directory uvicorn is started from.
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("piper_model_path")
    @classmethod
    def resolve_model_path(cls, value: Path) -> Path:
        return value if value.is_absolute() else (BACKEND_DIR / value).resolve()

    @model_validator(mode="after")
    def check_ranges(self) -> "Settings":
        if self.tts_min_speed <= 0 or self.tts_min_speed > self.tts_max_speed:
            raise ValueError("TTS_MIN_SPEED must be > 0 and <= TTS_MAX_SPEED")
        if self.tts_max_text_length < 1:
            raise ValueError("TTS_MAX_TEXT_LENGTH must be positive")
        if self.tts_max_queue < 1:
            raise ValueError("TTS_MAX_QUEUE must be positive")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def piper_config_path(self) -> Path:
        return Path(f"{self.piper_model_path}.json")

    @property
    def piper_model_available(self) -> bool:
        return self.piper_model_path.is_file() and self.piper_config_path.is_file()


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
