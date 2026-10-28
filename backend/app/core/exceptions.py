from typing import Any


class AppError(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int = 400,
        details: list[Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []


class VoiceNotFoundError(AppError):
    def __init__(self, voice_id: str) -> None:
        super().__init__(
            code="voice_not_found",
            message=f"Unknown voice_id '{voice_id}'.",
            status_code=422,
            details=[{"field": "voice_id", "value": voice_id}],
        )


class LanguageNotSupportedError(AppError):
    def __init__(self, language: str, voice_id: str | None = None) -> None:
        message = (
            f"Voice '{voice_id}' does not support language '{language}'."
            if voice_id
            else f"Unsupported language '{language}'."
        )
        super().__init__(
            code="language_not_supported",
            message=message,
            status_code=422,
            details=[{"field": "language", "value": language}],
        )


class PiperModelNotFoundError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="piper_model_not_found",
            message=(
                "The local Piper voice model is missing. "
                "Run 'python scripts/download_model.py' in the backend folder."
            ),
            status_code=503,
        )


class PiperSynthesisError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="piper_synthesis_failed",
            message="The local Piper model could not generate speech.",
            status_code=500,
        )


class ServerBusyError(AppError):
    def __init__(self) -> None:
        super().__init__(
            code="server_busy",
            message="The speech engine is busy. Please try again in a few seconds.",
            status_code=503,
        )


class RateLimitError(AppError):
    def __init__(self, retry_after: int) -> None:
        super().__init__(
            code="rate_limited",
            message="Too many requests. Please wait a moment and try again.",
            status_code=429,
            details=[{"retry_after_seconds": retry_after}],
        )
        self.retry_after = retry_after
