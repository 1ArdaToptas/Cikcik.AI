from pathlib import Path

import pytest

from app.core.config import BACKEND_DIR, Settings, get_settings

VALID_PIPER = {"text": "Merhaba dünya.", "voice_id": "piper-tr", "language": "tr-tr", "speed": 1.0}
VALID_EDGE = {"text": "Merhaba dünya.", "voice_id": "tr-ahmet", "language": "tr-tr", "speed": 1.0}
VALID_EN = {"text": "Hello world.", "voice_id": "en-jenny", "language": "en-us", "speed": 1.0}


# --- health -----------------------------------------------------------------


def test_health_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "piper"
    assert body["model_available"] is get_settings().piper_model_available
    assert body["status"] in {"ok", "degraded"}


def test_health_degraded_when_model_missing(client, override_settings, tmp_path):
    override_settings(piper_model_path=tmp_path / "missing.onnx")
    body = client.get("/api/health").json()
    assert body == {**body, "status": "degraded", "model_available": False}


# --- config -----------------------------------------------------------------


def test_relative_model_path_resolves_against_backend_dir():
    settings = Settings(piper_model_path=Path("models/piper/x.onnx"))
    assert settings.piper_model_path == (BACKEND_DIR / "models/piper/x.onnx").resolve()


def test_invalid_speed_range_rejected():
    with pytest.raises(ValueError):
        Settings(tts_min_speed=2.0, tts_max_speed=1.0)


# --- voices -----------------------------------------------------------------


def test_voices_catalog(client):
    body = client.get("/api/voices").json()
    voice_ids = {voice["id"] for voice in body["voices"]}
    language_ids = {language["id"] for language in body["languages"]}
    assert "piper-tr" in voice_ids
    assert "tr-ahmet" in voice_ids
    assert "en-jenny" in voice_ids
    assert {"tr-tr", "en-us", "en-gb"}.issubset(language_ids)
    for voice in body["voices"]:
        assert set(voice["languages"]) <= language_ids
    assert body["limits"]["max_text_length"] == get_settings().tts_max_text_length


# --- tts validation ---------------------------------------------------------


@pytest.mark.parametrize(
    ("patch", "code"),
    [
        ({"voice_id": "unknown_voice"}, "voice_not_found"),
        ({"voice_id": "tr-ahmet", "language": "en-us"}, "language_not_supported"),
        ({"text": "   "}, "validation_error"),
        ({"speed": 5}, "validation_error"),
        ({"text": "a" * (get_settings().tts_max_text_length + 1)}, "validation_error"),
    ],
)
def test_tts_rejects_invalid_input(client, fake_piper, patch, code):
    response = client.post("/api/tts", json={**VALID_PIPER, **patch})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == code


def test_tts_piper_returns_wav_with_metadata(client, fake_piper):
    response = client.post("/api/tts", json={**VALID_PIPER, "voice_id": " PIPER-TR "})
    assert response.status_code == 201
    assert response.headers["content-type"] == "audio/wav"
    assert response.headers["x-generation-id"].startswith("gen_")
    assert float(response.headers["x-duration-seconds"]) == 1.0
    assert response.content[:4] == b"RIFF"


def test_tts_model_missing_returns_503_for_piper(client, override_settings, tmp_path):
    override_settings(piper_model_path=tmp_path / "missing.onnx")
    response = client.post("/api/tts", json=VALID_PIPER)
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "piper_model_not_found"


def test_tts_rate_limited(client, fake_piper, override_settings):
    override_settings(tts_rate_limit_per_minute=2)
    assert client.post("/api/tts", json=VALID_PIPER).status_code == 201
    assert client.post("/api/tts", json=VALID_PIPER).status_code == 201
    response = client.post("/api/tts", json=VALID_PIPER)
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "rate_limited"
    assert int(response.headers["retry-after"]) >= 1


def test_cors_exposes_metadata_headers(client, fake_piper):
    response = client.post(
        "/api/tts", json=VALID_PIPER, headers={"Origin": "http://localhost:5173"}
    )
    exposed = response.headers["access-control-expose-headers"].lower()
    assert "x-generation-id" in exposed
    assert "x-duration-seconds" in exposed
    assert "x-audio-format" in exposed


def test_edge_neural_tts_synthesis(client):
    response = client.post("/api/tts", json=VALID_EDGE)
    assert response.status_code == 201
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.headers["x-tts-provider"] == "edge"
    assert len(response.content) > 1000


def test_edge_english_synthesis(client):
    response = client.post("/api/tts", json=VALID_EN)
    assert response.status_code == 201
    assert response.headers["content-type"] == "audio/mpeg"
    assert len(response.content) > 1000


# --- real piper model (skipped when the model has not been downloaded) -----------


@pytest.mark.skipif(not get_settings().piper_model_available, reason="Piper model not downloaded")
def test_real_piper_synthesis(client):
    response = client.post("/api/tts", json={**VALID_PIPER, "speed": 1.2})
    assert response.status_code == 201
    assert response.content[:4] == b"RIFF"
    assert float(response.headers["x-duration-seconds"]) > 0.3


def test_custom_voice_lifecycle(client):
    import io

    import numpy as np
    import soundfile as sf

    # Generate a clean 1-sec test wav
    sr = 22050
    t = np.linspace(0, 1.0, sr)
    y = (0.4 * np.sin(2 * np.pi * 200 * t)).astype(np.float32)
    buf = io.BytesIO()
    sf.write(buf, y, sr, format="WAV")
    audio_bytes = buf.getvalue()

    # 1. Register custom voice
    resp = client.post(
        "/api/voices/custom",
        data={"name": "Otomasyon Test Sesi", "description": "Ders notu testi"},
        files={"file": ("sample.wav", audio_bytes, "audio/wav")},
    )
    assert resp.status_code == 200
    voice = resp.json()
    voice_id = voice["id"]
    assert voice["name"] == "Otomasyon Test Sesi"
    assert voice["engine"] == "custom_clone"

    # 2. Check catalog contains custom voice
    cat = client.get("/api/voices").json()
    assert any(v["id"] == voice_id for v in cat["voices"])

    # 3. Synthesize speech using custom cloned voice
    tts_resp = client.post(
        "/api/tts",
        json={
            "text": "Özel klonlanmış ses karakteri ders notlarını başarıyla seslendiriyor.",
            "voice_id": voice_id,
            "language": "tr-tr",
            "speed": 1.0,
        },
    )
    assert tts_resp.status_code == 201
    assert len(tts_resp.content) > 1000

    # 4. Delete custom voice
    del_resp = client.delete(f"/api/voices/custom/{voice_id}")
    assert del_resp.status_code == 200

    # 5. Verify voice is removed
    cat_after = client.get("/api/voices").json()
    assert not any(v["id"] == voice_id for v in cat_after["voices"])


def test_transcribe_refine_preserves_content_and_extracts_highlights(client):
    sample_text = (
        "ııı merhaba arkadaşlar bugün bu derste yapay zeka ses teknolojilerini inceliyoruz. "
        "hava bugün oldukça güzel ve kahvemizi içtik. "
        "özellikle en önemli nokta şudur ki Whisper modeli yüzde 99 doğrulukla "
        "konuşmaları metne çevirir. "
        "bunun yanında yerel CPU optimizasyonu sayesinde verileriniz dışarı çıkmaz. "
        "sonuç olarak bu sistem hem hızlı hem de tamamen güvenlidir."
    )
    resp = client.post(
        "/api/transcribe/refine",
        json={"text": sample_text, "language": "tr"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "readable_text" in data
    assert "important_only_text" in data
    assert len(data["highlights"]) >= 2
    assert len(data["paragraphs"]) >= 1
    assert any("Whisper" in h or "önemli" in h.lower() for h in data["highlights"])


def test_transcribe_translate_endpoint(client, monkeypatch):
    def fake_translate_chunk(chunk: str, target_lang: str, source_lang: str = "auto"):
        return f"[{target_lang.upper()}] {chunk}", "tr"

    monkeypatch.setattr(
        "app.services.translator._translate_chunk_gtx",
        fake_translate_chunk,
    )
    resp = client.post(
        "/api/transcribe/translate",
        json={
            "text": "Merhaba dünya, bugün yapay zeka ses sistemlerini test ediyoruz.",
            "target_language": "en",
            "source_language": "tr",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["target_language"] == "en"
    assert "[EN]" in data["translated_text"]
    assert len(data["paragraphs"]) >= 1


def test_transcribe_segments_response_structure(client, monkeypatch):
    """Verify that STT transcription endpoints return structured timestamp segments."""
    async def fake_transcribe_url(self, url: str, language: str = "auto"):
        return {
            "text": (
                "Merhaba, Cicik ses stüdyosuna hoş geldiniz. "
                "Bu videoda dakika ve saniye damgalarını inceliyoruz."
            ),
            "language": "tr",
            "duration": 9.2,
            "source_type": "youtube_transcript",
            "segments": [
                {
                    "start": 0.0,
                    "end": 4.5,
                    "text": "Merhaba, Cicik ses stüdyosuna hoş geldiniz.",
                },
                {
                    "start": 4.5,
                    "end": 9.2,
                    "text": "Bu videoda dakika ve saniye damgalarını inceliyoruz.",
                },
            ],
        }

    monkeypatch.setattr("app.services.stt.STTService.transcribe_url", fake_transcribe_url)

    resp = client.post(
        "/api/transcribe/url",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "language": "tr"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "segments" in data
    assert len(data["segments"]) == 2
    assert data["segments"][0]["start"] == 0.0
    assert data["segments"][0]["end"] == 4.5
    assert "Cicik" in data["segments"][0]["text"]
    assert data["segments"][1]["start"] == 4.5
    assert data["segments"][1]["end"] == 9.2
    assert "dakika" in data["segments"][1]["text"]


def test_diarize_transcript(client):
    payload = {
        "text": "Merhaba hocam nasılsınız? İyiyim teşekkürler siz nasılsınız? Ben de iyiyim bugünkü konumuz ne olacak? Bugün yapay zeka modellerini konuşacağız.",
        "segments": [
            {"start": 0.0, "end": 2.5, "text": "Merhaba hocam nasılsınız?"},
            {"start": 2.6, "end": 5.0, "text": "İyiyim teşekkürler siz nasılsınız?"},
            {"start": 5.2, "end": 8.0, "text": "Ben de iyiyim bugünkü konumuz ne olacak?"},
            {"start": 8.2, "end": 12.0, "text": "Bugün yapay zeka modellerini konuşacağız."},
        ],
        "speaker_count": 2,
    }
    resp = client.post("/api/transcribe/diarize", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["speaker_count"] == 2
    assert len(data["turns"]) >= 2
    assert "method" in data
    # Verify speakers are distinguished
    speakers = {t["speaker_index"] for t in data["turns"]}
    assert len(speakers) >= 2




