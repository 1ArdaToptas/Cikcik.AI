"""Single source of truth for voices and languages.

Now supports ultra-fluent neural voices (Turkish and English) powered by Edge Neural TTS,
plus the offline local Piper model.
"""

from typing import TypedDict


class VoiceRecord(TypedDict):
    id: str
    name: str
    style: str
    tag: str
    gender: str
    engine: str  # "edge" or "piper"
    languages: list[str]


class LanguageRecord(TypedDict):
    id: str
    label: str
    native: str


LANGUAGES: tuple[LanguageRecord, ...] = (
    {"id": "tr-tr", "label": "Turkish", "native": "Türkçe"},
    {"id": "en-us", "label": "English (US)", "native": "English (US)"},
    {"id": "en-gb", "label": "English (UK)", "native": "English (UK)"},
)

VOICES: tuple[VoiceRecord, ...] = (
    # --- Türkçe Akıcı Yapay Zekâ Sesleri (Ücretsiz AI Ses API'leri) ---
    {
        "id": "tr-ahmet",
        "name": "Ahmet (Akıcı & Doğal)",
        "style": "Haber, Anlatım & Profesyonel",
        "tag": "AI Stüdyo",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["tr-tr"],
    },
    {
        "id": "tr-emel",
        "name": "Emel (Sıcak & Net)",
        "style": "Samimi, Sesli Kitap & Sunum",
        "tag": "AI Stüdyo",
        "gender": "Kadın",
        "engine": "edge",
        "languages": ["tr-tr"],
    },
    {
        "id": "tr-defne",
        "name": "Defne (Canlı & Duygusal)",
        "style": "Pocket AI — Akıcı Kadın Anlatıcı",
        "tag": "Pocket AI",
        "gender": "Kadın",
        "engine": "edge",
        "languages": ["tr-tr"],
    },
    {
        "id": "tr-selin",
        "name": "Selin (Sakin & Belgesel)",
        "style": "Pocket AI — Yumuşak & Dingin Ton",
        "tag": "Pocket AI",
        "gender": "Kadın",
        "engine": "edge",
        "languages": ["tr-tr"],
    },
    {
        "id": "tr-kaan",
        "name": "Kaan (Dinamik & Modern)",
        "style": "Pocket AI — Podcast & YouTube",
        "tag": "Pocket AI",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["tr-tr"],
    },
    {
        "id": "tr-mert",
        "name": "Mert (Tok & Otoriter)",
        "style": "Pocket AI — Ciddi & Kurumsal Sunum",
        "tag": "Pocket AI",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["tr-tr"],
    },
    {
        "id": "tr-cinar",
        "name": "Çınar (Meta MMS Neural)",
        "style": "Meta AI — Doğal Türkçe VITS Sentezi",
        "tag": "Meta AI",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["tr-tr"],
    },
    {
        "id": "piper-tr",
        "name": "Piper Türkçe (Çevrimdışı)",
        "style": "Cihaz içi yerel nöral ses",
        "tag": "İnternetsiz",
        "gender": "Erkek",
        "engine": "piper",
        "languages": ["tr-tr"],
    },
    # --- İngilizce Akıcı Yapay Zekâ Sesleri (Kokoro AI, TikTok AI & Edge Neural) ---
    {
        "id": "en-jenny",
        "name": "Jenny / Heart (Conversational)",
        "style": "Kokoro & Neural — Expressive & Friendly",
        "tag": "US Studio",
        "gender": "Kadın",
        "engine": "edge",
        "languages": ["en-us"],
    },
    {
        "id": "en-guy",
        "name": "Guy / Michael (Professional)",
        "style": "Kokoro & Neural — Authoritative Narrator",
        "tag": "US Studio",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["en-us"],
    },
    {
        "id": "en-aria",
        "name": "Aria / Bella (Dynamic Studio)",
        "style": "Kokoro AI — Storytelling, Podcast & Demo",
        "tag": "Kokoro AI",
        "gender": "Kadın",
        "engine": "edge",
        "languages": ["en-us"],
    },
    {
        "id": "en-fenrir",
        "name": "Fenrir (Deep Cinematic)",
        "style": "Kokoro AI — Deep & Resonant Male Voice",
        "tag": "Kokoro AI",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["en-us"],
    },
    {
        "id": "en-jessie",
        "name": "Jessie (TikTok Viral Female)",
        "style": "TikTok AI — Upbeat Social Media & Reels",
        "tag": "TikTok AI",
        "gender": "Kadın",
        "engine": "edge",
        "languages": ["en-us"],
    },
    {
        "id": "en-joey",
        "name": "Joey (TikTok Storyteller)",
        "style": "TikTok AI — Energetic Creator & Narrator",
        "tag": "TikTok AI",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["en-us"],
    },
    {
        "id": "en-brian",
        "name": "Brian / George (British Narrator)",
        "style": "Kokoro & TikTok UK — Crisp Documentary",
        "tag": "UK Studio",
        "gender": "Erkek",
        "engine": "edge",
        "languages": ["en-gb"],
    },
    {
        "id": "en-sonia",
        "name": "Sonia / Isabella (British Studio)",
        "style": "Kokoro AI — Calm & Sophisticated British",
        "tag": "UK Studio",
        "gender": "Kadın",
        "engine": "edge",
        "languages": ["en-gb"],
    },
)

# Harici Edge-TTS kısa ad eşleştirmesi
EDGE_VOICE_MAP: dict[str, str] = {
    "tr-ahmet": "tr-TR-AhmetNeural",
    "tr-emel": "tr-TR-EmelNeural",
    "tr-defne": "tr-TR-EmelNeural",
    "tr-selin": "tr-TR-EmelNeural",
    "tr-kaan": "tr-TR-AhmetNeural",
    "tr-mert": "tr-TR-AhmetNeural",
    "tr-cinar": "tr-TR-AhmetNeural",
    "en-jenny": "en-US-JennyNeural",
    "en-guy": "en-US-GuyNeural",
    "en-aria": "en-US-AriaNeural",
    "en-fenrir": "en-US-ChristopherNeural",
    "en-jessie": "en-US-AvaMultilingualNeural",
    "en-joey": "en-US-AndrewMultilingualNeural",
    "en-brian": "en-GB-BrianNeural",
    "en-sonia": "en-GB-SoniaNeural",
}

SUPPORTED_LANGUAGE_IDS = frozenset(item["id"] for item in LANGUAGES)
SUPPORTED_VOICE_IDS = frozenset(item["id"] for item in VOICES)
VOICE_INDEX = {item["id"]: item for item in VOICES}

