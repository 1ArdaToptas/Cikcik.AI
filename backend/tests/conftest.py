import io
import wave

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.core.rate_limit import reset_rate_limits
from app.main import app


@pytest.fixture(autouse=True)
def _clean_state():
    reset_rate_limits()
    app.dependency_overrides.clear()
    yield
    reset_rate_limits()
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def override_settings():
    def _apply(**overrides) -> Settings:
        custom = get_settings().model_copy(update=overrides)
        app.dependency_overrides[get_settings] = lambda: custom
        return custom

    return _apply


@pytest.fixture
def fake_piper(monkeypatch):
    """Replace real synthesis with a tiny valid WAV so tests don't need the model."""

    def _fake(self, *, text: str, speed: float):
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(22050)
            wav_file.writeframes(b"\x00\x00" * 22050)
        return buffer.getvalue(), 1.0

    monkeypatch.setattr("app.services.piper.PiperClient.synthesize", _fake)
