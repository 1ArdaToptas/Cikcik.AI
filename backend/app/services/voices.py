from app.core.config import Settings
from app.data.catalog import LANGUAGES, VOICE_INDEX, VOICES, VoiceRecord
from app.schemas.voice import Language, TTSLimits, Voice, VoiceListResponse
from app.services.voice_cloning import VoiceCloningService


def list_voices(settings: Settings) -> VoiceListResponse:
    custom_records = VoiceCloningService.list_custom_voices()
    all_voices = list(custom_records) + list(VOICES)
    return VoiceListResponse(
        voices=[Voice.model_validate(item) for item in all_voices],
        languages=[Language.model_validate(item) for item in LANGUAGES],
        limits=TTSLimits(
            max_text_length=settings.tts_max_text_length,
            min_speed=settings.tts_min_speed,
            max_speed=settings.tts_max_speed,
        ),
    )


def get_voice(voice_id: str) -> VoiceRecord | dict | None:
    # Check custom cloned voices first
    custom = VoiceCloningService.get_custom_voice(voice_id)
    if custom:
        return custom
    return VOICE_INDEX.get(voice_id)
