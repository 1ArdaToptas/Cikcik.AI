from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request

from app.core.logging import logger
from app.services.transcript_refiner import format_readable_transcript

SUPPORTED_TRANSLATION_LANGUAGES: dict[str, str] = {
    "tr": "Türkçe",
    "en": "English",
    "de": "Deutsch",
    "fr": "Français",
    "es": "Español",
    "ar": "العربية",
    "ru": "Русский",
    "ja": "日本語",
}

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _detect_source_language(text: str, hint: str | None = None) -> str:
    if hint and hint.strip().lower() not in ("", "auto", "none"):
        return hint.strip().lower()
    # Simple heuristic for Turkish vs English when source is "auto"
    if re.search(r"[çğıöşüÇĞİÖŞÜ]", text):
        return "tr"
    tr_words = {"ve", "bir", "bu", "için", "ile", "olarak", "ama", "çok", "daha", "en", "var"}
    tokens = {w.lower().strip(".,!?;:") for w in text.split()[:40]}
    if len(tokens & tr_words) >= 2:
        return "tr"
    return "en"


def _chunk_text_by_paragraphs(text: str, max_chars: int = 450) -> list[str]:
    """Splits long transcripts into safe chunks (~450 chars) at sentence/paragraph boundaries."""
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        return []

    chunks: list[str] = []
    for para in paragraphs:
        if len(para) <= max_chars:
            chunks.append(para)
        else:
            sentences = re.split(r"(?<=[.!?])\s+", para)
            current = ""
            for s in sentences:
                if len(current) + len(s) + 1 <= max_chars:
                    current = f"{current} {s}".strip() if current else s
                else:
                    if current:
                        chunks.append(current)
                    current = s
            if current:
                chunks.append(current)
    return chunks


def _translate_via_clients5(chunk: str, target_lang: str, source_lang: str) -> tuple[str, str]:
    """Provider 1: Google Chrome dictionary extension endpoint (high rate limit)."""
    params = urllib.parse.urlencode(
        {
            "client": "dict-chrome-ex",
            "sl": source_lang,
            "tl": target_lang,
            "q": chunk,
        }
    )
    url = f"https://clients5.google.com/translate_a/t?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    with urllib.request.urlopen(req, timeout=6.0) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    # Format can be [["translated", "src"]] or ["translated"]
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, list) and first and isinstance(first[0], str):
            detected = first[1] if len(first) > 1 and isinstance(first[1], str) else source_lang
            return first[0].strip(), detected
        if isinstance(first, str):
            return first.strip(), source_lang
    raise ValueError("Unexpected clients5 response format")


def _translate_via_mymemory(chunk: str, target_lang: str, source_lang: str) -> tuple[str, str]:
    """Provider 2: MyMemory free translation API (no key required, 450-char chunks)."""
    sl = source_lang if source_lang != "auto" else _detect_source_language(chunk)
    if sl == target_lang:
        return chunk, sl
    params = urllib.parse.urlencode(
        {
            "q": chunk,
            "langpair": f"{sl}|{target_lang}",
        }
    )
    url = f"https://api.mymemory.translated.net/get?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    with urllib.request.urlopen(req, timeout=6.0) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    if isinstance(data, dict):
        resp_data = data.get("responseData")
        if isinstance(resp_data, dict):
            translated = resp_data.get("translatedText")
            if isinstance(translated, str) and translated.strip():
                return translated.strip(), sl
    raise ValueError("Unexpected MyMemory response")


def _translate_via_gtx(chunk: str, target_lang: str, source_lang: str) -> tuple[str, str]:
    """Provider 3: Google GTX endpoint."""
    params = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": source_lang,
            "tl": target_lang,
            "dt": "t",
            "q": chunk,
        }
    )
    url = f"https://translate.googleapis.com/translate_a/single?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    with urllib.request.urlopen(req, timeout=6.0) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    segments: list[str] = []
    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
        for seg in data[0]:
            if isinstance(seg, list) and len(seg) > 0 and isinstance(seg[0], str):
                segments.append(seg[0])

    detected = source_lang
    if isinstance(data, list) and len(data) > 2 and isinstance(data[2], str):
        detected = data[2]

    translated = "".join(segments).strip()
    if not translated:
        raise ValueError("Empty GTX translation")
    return translated, detected


def _translate_chunk_gtx(
    chunk: str,
    target_lang: str,
    source_lang: str = "auto",
) -> tuple[str, str]:
    """
    Multi-provider translation with automatic fallback:
    1) clients5.google.com -> 2) api.mymemory.translated.net -> 3) translate.googleapis.com
    """
    sl = _detect_source_language(chunk, source_lang)
    if sl == target_lang:
        return chunk, sl

    providers = (
        _translate_via_clients5,
        _translate_via_mymemory,
        _translate_via_gtx,
    )
    last_err: Exception | None = None
    for provider in providers:
        try:
            return provider(chunk, target_lang, sl)
        except Exception as exc:
            last_err = exc
            continue

    raise RuntimeError(f"All translation providers failed: {last_err}")


def translate_transcript_sync(
    text: str,
    target_language: str,
    source_language: str | None = "auto",
) -> dict:
    """
    Translates an entire transcript into `target_language` while preserving
    paragraph structure and readability.
    """
    clean_input = (text or "").strip()
    if not clean_input:
        return {
            "translated_text": "",
            "source_language": source_language or "auto",
            "target_language": target_language,
            "paragraphs": [],
        }

    target = (target_language or "en").strip().lower()
    if target not in SUPPORTED_TRANSLATION_LANGUAGES:
        target = "en"

    source = _detect_source_language(clean_input, source_language)
    readable_source, _, _ = format_readable_transcript(clean_input)
    chunks = _chunk_text_by_paragraphs(readable_source or clean_input, max_chars=450)

    translated_chunks: list[str] = []
    detected_source = source

    for chunk in chunks:
        try:
            tr_chunk, det = _translate_chunk_gtx(chunk, target_lang=target, source_lang=source)
            translated_chunks.append(tr_chunk)
            if det and det != "auto":
                detected_source = det
        except Exception as exc:
            logger.warning("translation_chunk_failed target=%s err=%s", target, exc)
            translated_chunks.append(chunk)

    combined = "\n\n".join(translated_chunks).strip()
    readable_translated, paragraphs, _ = format_readable_transcript(combined)

    return {
        "translated_text": readable_translated or combined,
        "source_language": detected_source,
        "target_language": target,
        "paragraphs": paragraphs or ([combined] if combined else []),
    }
