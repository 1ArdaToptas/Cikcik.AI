from __future__ import annotations

import asyncio
import base64
import io
import json
import re
from typing import Any

import edge_tts
import gtts
import httpx

from app.core.exceptions import AppError
from app.core.logging import logger
from app.data.catalog import EDGE_VOICE_MAP

CHUNK_MAX_CHARS = 1200
PARALLEL_CONCURRENCY = 4

# Free AI Voice API mappings
POCKET_TURKISH_VOICE_MAP: dict[str, tuple[str, str]] = {
    "tr-emel": ("female_1", "neutral"),
    "tr-defne": ("female_2", "mutlu"),
    "tr-selin": ("female_3", "sakin"),
    "tr-ahmet": ("male_1", "neutral"),
    "tr-kaan": ("male_2", "neutral"),
    "tr-mert": ("male_3", "sakin"),
}

KOKORO_VOICE_MAP: dict[str, str] = {
    "en-jenny": "af_heart",
    "en-aria": "af_bella",
    "en-jessie": "af_nicole",
    "en-guy": "am_michael",
    "en-fenrir": "am_fenrir",
    "en-joey": "am_puck",
    "en-brian": "bm_george",
    "en-sonia": "bf_isabella",
}

TIKTOK_VOICE_MAP: dict[str, str] = {
    "en-jenny": "en_us_001",
    "en-aria": "en_us_001",
    "en-jessie": "en_us_001",
    "en-guy": "en_us_007",
    "en-fenrir": "en_us_010",
    "en-joey": "en_us_006",
    "en-brian": "en_uk_001",
    "en-sonia": "en_au_001",
}


class EdgeTTSError(AppError):
    def __init__(self, message: str = "Akıcı ses motoru geçici bir hata verdi."):
        super().__init__(
            code="edge_tts_failed",
            message=message,
            status_code=502,
        )


def _format_rate(speed: float) -> str:
    percent = int(round((speed - 1.0) * 100))
    if percent >= 0:
        return f"+{percent}%"
    return f"{percent}%"


def _split_text_into_chunks(text: str, max_chars: int = CHUNK_MAX_CHARS) -> list[str]:
    """Splits long text intelligently by paragraph and sentence boundaries

    so chunks can be synthesized in parallel.
    """
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    if not paragraphs:
        return [text.strip()]

    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for p in paragraphs:
        if len(p) > max_chars:
            sentences = re.split(r"(?<=[.!?…])\s+", p)
            for s in sentences:
                s = s.strip()
                if not s:
                    continue
                if current_len + len(s) + 1 > max_chars:
                    if current:
                        chunks.append(" ".join(current))
                        current = []
                        current_len = 0
                current.append(s)
                current_len += len(s) + 1
        else:
            if current_len + len(p) + 1 > max_chars:
                if current:
                    chunks.append(" ".join(current))
                current = [p]
                current_len = len(p)
            else:
                current.append(p)
                current_len += len(p) + 1

    if current:
        chunks.append(" ".join(current))

    return chunks if chunks else [text.strip()]


async def _call_gradio_space_audio(
    base_url: str,
    endpoint: str,
    data: list[Any],
    timeout_s: float = 16.0,
) -> bytes:
    """Calls a free HuggingFace Gradio v4/v5 Space API and downloads the synthesized audio."""
    async with httpx.AsyncClient(timeout=timeout_s, follow_redirects=True) as client:
        post_url = f"{base_url}/gradio_api/call/{endpoint}"
        resp = await client.post(post_url, json={"data": data})
        if resp.status_code != 200:
            raise RuntimeError(f"Gradio POST {resp.status_code}")
        event_id = resp.json().get("event_id")
        if not event_id:
            raise RuntimeError("Missing Gradio event_id")

        stream_url = f"{base_url}/gradio_api/call/{endpoint}/{event_id}"
        audio_file_url: str | None = None
        async with client.stream("GET", stream_url) as stream:
            event_type = ""
            async for line in stream.aiter_lines():
                if line.startswith("event: "):
                    event_type = line[7:].strip()
                    if event_type == "error":
                        raise RuntimeError("Gradio stream returned error")
                elif line.startswith("data: ") and event_type == "complete":
                    payload = json.loads(line[6:])
                    if isinstance(payload, list) and payload:
                        first = payload[0]
                        if isinstance(first, dict):
                            audio_file_url = first.get("url")
                            if not audio_file_url and first.get("path"):
                                audio_file_url = (
                                    f"{base_url}/gradio_api/file={first['path']}"
                                )
                    break

        if not audio_file_url:
            raise RuntimeError("No audio URL returned from Gradio Space")

        audio_resp = await client.get(audio_file_url)
        if audio_resp.status_code == 200 and len(audio_resp.content) > 256:
            return audio_resp.content
        raise RuntimeError(f"Audio download failed: {audio_resp.status_code}")


async def _synthesize_tiktok_api(text: str, tiktok_voice: str) -> bytes:
    """Synthesizes English neural voice via free TikTok TTS API."""
    parts = _split_text_into_chunks(text, max_chars=260)
    collected: list[bytes] = []
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for part in parts:
            resp = await client.post(
                "https://tiktok-tts.weilnet.workers.dev/api/generation",
                json={"text": part, "voice": tiktok_voice},
            )
            if resp.status_code != 200:
                raise RuntimeError(f"TikTok TTS HTTP {resp.status_code}")
            b64_data = resp.json().get("data")
            if not b64_data:
                raise RuntimeError("Empty TikTok TTS audio data")
            collected.append(base64.b64decode(b64_data))
    return b"".join(collected)


async def _synthesize_free_ai_cloud_chunk(
    text: str,
    voice_id: str,
    speed: float,
) -> bytes:
    """Routes synthesis across free AI TTS APIs based on voice_id and language."""
    is_turkish = voice_id.startswith("tr-")

    if is_turkish:
        # 1. If specifically Meta MMS-TTS (tr-cinar) or general Turkish fallback
        if voice_id == "tr-cinar":
            try:
                audio = await _call_gradio_space_audio(
                    "https://suayptalha-mms-tts.hf.space",
                    "process_text",
                    [text],
                )
                if audio:
                    return audio
            except Exception as exc:
                logger.warning("free_ai_mms_tts_failed voice=%s err=%s", voice_id, exc)

        # 2. If Pocket AI Turkish multi-speaker (Emel, Defne, Selin, Kaan, Mert) or Ahmet fallback
        if voice_id in POCKET_TURKISH_VOICE_MAP and voice_id != "tr-ahmet":
            speaker_id, emotion = POCKET_TURKISH_VOICE_MAP[voice_id]
            try:
                audio = await _call_gradio_space_audio(
                    "https://wite-tech-pocket-tts-turkish.hf.space",
                    "synthesize",
                    [text, speaker_id, emotion],
                )
                if audio:
                    return audio
            except Exception as exc:
                logger.warning("free_ai_pocket_tts_failed voice=%s err=%s", voice_id, exc)

        # 3. Fast Turkish Neural TTS API (99eren99/turkish-tts returns MP3 in ~1.8s)
        length_scale = round(max(0.65, min(1.45, 1.0 / max(speed, 0.5))), 2)
        try:
            audio = await _call_gradio_space_audio(
                "https://99eren99-turkish-tts.hf.space",
                "tts",
                [text, 1.0, length_scale, 0.4, 0.3, True],
            )
            if audio:
                return audio
        except Exception as exc:
            logger.warning("free_ai_turkish_tts_failed voice=%s err=%s", voice_id, exc)

        # 4. Secondary Turkish AI fallback: Pocket AI or Meta MMS-TTS
        if voice_id == "tr-ahmet":
            try:
                audio = await _call_gradio_space_audio(
                    "https://wite-tech-pocket-tts-turkish.hf.space",
                    "synthesize",
                    [text, "male_1", "neutral"],
                )
                if audio:
                    return audio
            except Exception as exc:
                logger.warning("free_ai_pocket_male_fallback_failed err=%s", exc)

        try:
            audio = await _call_gradio_space_audio(
                "https://suayptalha-mms-tts.hf.space",
                "process_text",
                [text],
            )
            if audio:
                return audio
        except Exception as exc:
            logger.warning("free_ai_mms_fallback_failed err=%s", exc)

    else:
        # English AI Voices: 1. TikTok Neural Voices if explicitly Jessie/Joey
        if voice_id in ("en-jessie", "en-joey"):
            try:
                tiktok_voice = TIKTOK_VOICE_MAP.get(voice_id, "en_us_001")
                audio = await _synthesize_tiktok_api(text, tiktok_voice)
                if audio:
                    return audio
            except Exception as exc:
                logger.warning("free_ai_tiktok_primary_failed voice=%s err=%s", voice_id, exc)

        # 2. Kokoro-82M Neural AI API (US & UK expressive studio voices)
        kokoro_voice = KOKORO_VOICE_MAP.get(voice_id, "af_heart")
        try:
            audio = await _call_gradio_space_audio(
                "https://remsky-kokoro-tts-zero.hf.space",
                "generate_speech_from_ui",
                [text, [kokoro_voice], speed],
            )
            if audio:
                return audio
        except Exception as exc:
            logger.warning("free_ai_kokoro_failed voice=%s err=%s", voice_id, exc)

        # 3. TikTok Neural TTS API fallback for any English voice
        try:
            tiktok_voice = TIKTOK_VOICE_MAP.get(voice_id, "en_us_001")
            audio = await _synthesize_tiktok_api(text, tiktok_voice)
            if audio:
                return audio
        except Exception as exc:
            logger.warning("free_ai_tiktok_fallback_failed voice=%s err=%s", voice_id, exc)

    return b""


def _synthesize_gtts(text: str, voice_id: str) -> tuple[bytes, float]:
    lang = "tr" if "tr" in voice_id else "en"
    tld = "co.uk" if "gb" in voice_id or "brian" in voice_id or "sonia" in voice_id else "com"
    tts = gtts.gTTS(text=text, lang=lang, tld=tld)
    fp = io.BytesIO()
    tts.write_to_fp(fp)
    data = fp.getvalue()
    duration = max(0.5, round(len(data) / 4000.0, 2))
    return data, duration


async def _synthesize_single_chunk(
    text: str,
    voice_id: str,
    edge_voice: str,
    rate_str: str,
    speed: float,
    semaphore: asyncio.Semaphore,
) -> bytes:
    async with semaphore:
        # 1. Try Free AI Cloud Neural APIs first (Pocket AI, Kokoro AI, TikTok AI, Turkish Neural)
        cloud_audio = await _synthesize_free_ai_cloud_chunk(text, voice_id, speed)
        if cloud_audio:
            return cloud_audio

        # 2. Try Microsoft Edge Neural TTS
        try:
            communicate = edge_tts.Communicate(
                text=text,
                voice=edge_voice,
                rate=rate_str,
            )
            chunks: list[bytes] = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunks.append(chunk["data"])
            audio_data = b"".join(chunks)
            if audio_data:
                return audio_data
        except Exception as exc:
            logger.warning("edge_tts_chunk_failed voice=%s err=%s", voice_id, exc)

        return b""


def _estimate_duration(audio_data: bytes) -> float:
    if audio_data[:4] == b"RIFF" and len(audio_data) > 44:
        # Parse WAV header byte rate (bytes 28..32)
        byte_rate = int.from_bytes(audio_data[28:32], "little")
        if byte_rate > 0:
            return max(0.5, round((len(audio_data) - 44) / float(byte_rate), 2))
    return max(0.5, round(len(audio_data) / 6000.0, 2))


class EdgeTTSClient:
    async def synthesize(
        self,
        *,
        voice_id: str,
        text: str,
        speed: float = 1.0,
    ) -> tuple[bytes, float]:
        edge_voice = EDGE_VOICE_MAP.get(voice_id, voice_id)
        if not edge_voice:
            raise EdgeTTSError(f"Bilinmeyen ses seçimi: {voice_id}")

        rate_str = _format_rate(speed)

        # 1. Text is short -> Single fast request across free AI voice APIs
        if len(text) <= CHUNK_MAX_CHARS:
            semaphore = asyncio.Semaphore(1)
            audio_data = await _synthesize_single_chunk(
                text, voice_id, edge_voice, rate_str, speed, semaphore
            )
            if audio_data:
                return audio_data, _estimate_duration(audio_data)

        # 2. Text is long -> Parallel intelligent chunking for ultra-fast generation
        else:
            chunks = _split_text_into_chunks(text)
            logger.info(
                "synthesizing_long_text_in_parallel chars=%s chunks=%s voice=%s",
                len(text),
                len(chunks),
                voice_id,
            )
            semaphore = asyncio.Semaphore(PARALLEL_CONCURRENCY)
            tasks = [
                _synthesize_single_chunk(c, voice_id, edge_voice, rate_str, speed, semaphore)
                for c in chunks
            ]
            results = await asyncio.gather(*tasks)
            merged_audio = b"".join(r for r in results if r)
            if merged_audio:
                return merged_audio, _estimate_duration(merged_audio)

        # 3. Fallback to gTTS if all cloud neural engines fail
        try:
            logger.info("neural_tts_fallback_to_gtts voice=%s", voice_id)
            return await asyncio.to_thread(_synthesize_gtts, text, voice_id)
        except Exception as exc:
            logger.exception("all_neural_tts_engines_failed voice=%s", voice_id)
            raise EdgeTTSError(f"Ses oluşturulurken hata oluştu: {str(exc)}") from exc

