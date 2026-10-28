from __future__ import annotations

import threading
import wave
from functools import lru_cache
from io import BytesIO
from pathlib import Path

from piper import PiperVoice
from piper.config import SynthesisConfig

from app.core.config import Settings
from app.core.exceptions import PiperModelNotFoundError, PiperSynthesisError
from app.core.logging import logger

# Piper's espeak-based phonemizer keeps global state, so synthesis is serialized.
_synthesis_lock = threading.Lock()


@lru_cache
def load_voice(model_path: str, use_cuda: bool) -> PiperVoice:
    path = Path(model_path)
    config_path = Path(f"{path}.json")
    if not path.is_file() or not config_path.is_file():
        raise PiperModelNotFoundError()
    logger.info("piper_model_loading path=%s cuda=%s", path, use_cuda)
    return PiperVoice.load(path, config_path=config_path, use_cuda=use_cuda)


class PiperClient:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def synthesize(self, *, text: str, speed: float) -> tuple[bytes, float]:
        voice = load_voice(
            str(self._settings.piper_model_path),
            self._settings.piper_use_cuda,
        )
        try:
            buffer = BytesIO()
            with _synthesis_lock, wave.open(buffer, "wb") as wav_file:
                voice.synthesize_wav(
                    text,
                    wav_file,
                    syn_config=SynthesisConfig(length_scale=1 / speed),
                )
            audio = buffer.getvalue()
            with wave.open(BytesIO(audio), "rb") as wav_file:
                frames = wav_file.getnframes()
                rate = wav_file.getframerate()
            if frames == 0 or rate == 0:
                raise ValueError("Piper produced empty audio")
            return audio, round(frames / rate, 3)
        except Exception as exc:
            logger.exception("piper_synthesis_failed chars=%s", len(text))
            raise PiperSynthesisError() from exc
