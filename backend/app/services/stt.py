from __future__ import annotations

import asyncio
import os
import re
import shutil
import tempfile
from functools import lru_cache
from pathlib import Path

import imageio_ffmpeg
import whisper
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)

from app.core.exceptions import AppError
from app.core.logging import logger
from app.services.transcript_refiner import format_readable_transcript

# Ensure ffmpeg binary from imageio_ffmpeg is in PATH
_ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
if _ffmpeg_exe and os.path.exists(_ffmpeg_exe):
    _ffmpeg_dir = str(Path(_ffmpeg_exe).parent)
    _standard_ffmpeg = Path(_ffmpeg_dir) / "ffmpeg.exe"
    if not _standard_ffmpeg.exists():
        try:
            shutil.copyfile(_ffmpeg_exe, _standard_ffmpeg)
        except Exception:
            pass
    if _ffmpeg_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")


class STTError(AppError):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(
            code="stt_failed",
            message=message,
            status_code=status_code,
        )


@lru_cache(maxsize=1)
def get_whisper_model():
    logger.info("loading_whisper_model name=tiny")
    return whisper.load_model("tiny")


def _extract_segments_from_whisper(whisper_result: dict) -> list[dict]:
    raw_segments = whisper_result.get("segments", [])
    segments: list[dict] = []
    for s in raw_segments:
        txt = s.get("text", "").strip()
        if txt:
            segments.append(
                {
                    "start": round(float(s.get("start", 0.0)), 2),
                    "end": round(float(s.get("end", 0.0)), 2),
                    "text": txt,
                    "speaker": s.get("speaker"),
                }
            )
    return segments


def _transcribe_file_sync(file_path: str, language: str | None = None) -> dict:
    model = get_whisper_model()
    kwargs = {"fp16": False}
    if language and language.strip() and language != "auto":
        kwargs["language"] = language.strip()
    result = model.transcribe(file_path, **kwargs)
    return result


def _extract_youtube_id(url: str) -> str | None:
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"youtu\.be\/([0-9A-Za-z_-]{11})",
        r"youtube\.com\/embed\/([0-9A-Za-z_-]{11})",
        r"youtube\.com\/shorts\/([0-9A-Za-z_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _get_youtube_transcript_sync(video_id: str, language: str | None = None) -> dict | None:
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)

        target_langs = []
        if language and language.strip() and language != "auto":
            target_langs.append(language.strip().lower())
        target_langs.extend(["tr", "en", "en-US", "en-GB"])

        transcript = None
        try:
            transcript = transcript_list.find_transcript(target_langs)
        except Exception:
            # Fallback to any auto-generated or manually created transcript
            for t in transcript_list:
                transcript = t
                break

        if transcript:
            fetched = transcript.fetch()
            # fetched is a FetchedTranscript object with snippets
            lines = []
            segments: list[dict] = []
            for item in fetched:
                # Handle snippet object or dict
                txt = (
                    item.text
                    if hasattr(item, "text")
                    else (item.get("text", "") if isinstance(item, dict) else "")
                )
                start = (
                    item.start
                    if hasattr(item, "start")
                    else (item.get("start", 0.0) if isinstance(item, dict) else 0.0)
                )
                duration = (
                    item.duration
                    if hasattr(item, "duration")
                    else (item.get("duration", 0.0) if isinstance(item, dict) else 0.0)
                )
                clean_t = str(txt).strip()
                if clean_t:
                    lines.append(clean_t)
                    speaker_marker = None
                    if clean_t.startswith(">>"):
                        speaker_marker = "turn_change"
                    segments.append(
                        {
                            "start": round(float(start), 2),
                            "end": round(float(start) + float(duration), 2),
                            "text": clean_t,
                            "speaker": speaker_marker,
                        }
                    )
            text = " ".join(lines).strip()
            detected_lang = getattr(transcript, "language_code", language)
            total_duration = segments[-1]["end"] if segments else None
            if text:
                readable, _, _ = format_readable_transcript(text)
                return {
                    "text": readable or text,
                    "language": detected_lang,
                    "duration": total_duration,
                    "source_type": "url_transcript",
                    "segments": segments,
                }
    except (NoTranscriptFound, TranscriptsDisabled, VideoUnavailable):
        return None
    except Exception as exc:
        logger.warning("youtube_transcript_direct_fetch_failed id=%s err=%s", video_id, exc)
        return None
    return None


def _download_video_audio(url: str, output_path: str) -> None:
    # Optimized for speed: lowest audio bitrate (64k) since Whisper only needs speech acoustics
    ydl_opts = {
        "format": "ba[abr<=96]/ba/b",
        "outtmpl": output_path,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "64",
            }
        ],
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])


class STTService:
    async def transcribe_audio_file(
        self,
        file_bytes: bytes,
        filename: str,
        language: str | None = None,
    ) -> dict:
        suffix = Path(filename).suffix or ".mp3"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        try:
            result = await asyncio.to_thread(_transcribe_file_sync, temp_path, language)
            raw_text = result.get("text", "").strip()
            readable, _, _ = format_readable_transcript(raw_text)
            segments = _extract_segments_from_whisper(result)
            total_dur = segments[-1]["end"] if segments else None
            return {
                "text": readable or raw_text,
                "language": result.get("language"),
                "duration": total_dur,
                "source_type": "file",
                "segments": segments,
            }
        except Exception as exc:
            logger.exception("transcription_failed file=%s", filename)
            raise STTError(f"Ses metne çevrilirken hata oluştu: {str(exc)}") from exc
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    async def transcribe_url(
        self,
        url: str,
        language: str | None = None,
    ) -> dict:
        # Fast path 1: If YouTube URL, instantly fetch official/auto transcript
        # without downloading the full video.
        video_id = _extract_youtube_id(url)
        if video_id:
            logger.info("trying_instant_youtube_transcript video_id=%s", video_id)
            transcript_result = await asyncio.to_thread(
                _get_youtube_transcript_sync, video_id, language
            )
            if transcript_result and transcript_result.get("text"):
                logger.info("instant_youtube_transcript_success video_id=%s", video_id)
                return transcript_result

        # Fast path 2: Fast lightweight audio extraction + Whisper tiny
        with tempfile.TemporaryDirectory() as temp_dir:
            out_base = os.path.join(temp_dir, "audio")
            try:
                await asyncio.to_thread(_download_video_audio, url, out_base)
            except Exception as exc:
                logger.exception("video_download_failed url=%s", url)
                raise STTError(
                    "Video bağlantısından ses indirilemedi. Lütfen bağlantıyı kontrol edin: "
                    f"{str(exc)}"
                ) from exc

            downloaded = list(Path(temp_dir).glob("audio.*"))
            if not downloaded:
                raise STTError("İndirilen ses dosyası bulunamadı.")

            audio_file = str(downloaded[0])
            try:
                result = await asyncio.to_thread(_transcribe_file_sync, audio_file, language)
                raw_text = result.get("text", "").strip()
                readable, _, _ = format_readable_transcript(raw_text)
                segments = _extract_segments_from_whisper(result)
                total_dur = segments[-1]["end"] if segments else None
                return {
                    "text": readable or raw_text,
                    "language": result.get("language"),
                    "duration": total_dur,
                    "source_type": "url",
                    "segments": segments,
                }
            except Exception as exc:
                logger.exception("transcribe_url_failed url=%s", url)
                raise STTError(f"Ses metne dönüştürülürken hata oluştu: {str(exc)}") from exc
