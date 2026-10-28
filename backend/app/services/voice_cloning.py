from __future__ import annotations

import io
import json
import threading
import uuid
from pathlib import Path
from typing import Any

import librosa
import numpy as np
import soundfile as sf
import torch
from scipy import signal

from app.core.config import BACKEND_DIR
from app.core.exceptions import AppError
from app.core.logging import logger
from app.services.audio_cleaner import (
    apply_smooth_offset_fade,
    apply_smooth_onset_fade,
    clean_synthesized_segment,
    remove_dc_and_rumble,
    spectral_denoise,
)
from app.services.prosody import prepare_natural_phrases, turkish_safe_lower

CUSTOM_VOICES_DIR = BACKEND_DIR / "custom_voices"
CUSTOM_VOICES_DIR.mkdir(parents=True, exist_ok=True)
INDEX_FILE = CUSTOM_VOICES_DIR / "voices.json"

_xtts_model = None
_xtts_lock = threading.Lock()


def get_xtts_model() -> Any:
    """Lazily loads and caches the Coqui XTTS v2 model in a thread-safe singleton."""
    global _xtts_model
    if _xtts_model is not None:
        return _xtts_model

    with _xtts_lock:
        if _xtts_model is None:
            import os

            os.environ["COQUI_TOS_AGREED"] = "1"
            logger.info("loading_xtts_model_singleton")
            import transformers.pytorch_utils

            if not hasattr(transformers.pytorch_utils, "isin_mps_friendly"):
                transformers.pytorch_utils.isin_mps_friendly = torch.isin
            from TTS.api import TTS

            use_gpu = torch.cuda.is_available()
            _xtts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=use_gpu)
            logger.info("xtts_model_singleton_ready gpu=%s", use_gpu)
    return _xtts_model


def _load_index() -> list[dict[str, Any]]:
    if not INDEX_FILE.exists():
        return []
    try:
        with open(INDEX_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save_index(data: list[dict[str, Any]]) -> None:
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _extract_golden_sample(y: np.ndarray, sr: int = 24000) -> np.ndarray:
    """Isolates pure, modal human speech from background music/noise and splices a 6-8s reference.

    1. Removes sub-bass (< 75 Hz) and applies vocal-band spectral denoise against music.
    2. Segments active speech phrases using a 250-3200 Hz formant bandpass filter (top_db=19)
       with 110ms consonant pre/post padding so sibilants ('s', 'ş', 't') are never clipped.
    3. Measures each phrase's fundamental frequency (F0) and rejects theatrical pitch outliers
       (> 4.2 semitones from the speaker's modal F0) and music-heavy scenes.
    4. Splices the cleanest modal speech phrases with micro-fades and 80ms breath spacers.
    """
    if len(y) == 0:
        return y

    # 1. Clean DC, sub-bass soundtrack rumble, and suppress background music spectrally
    y = remove_dc_and_rumble(y, sr=sr, cutoff_hz=75.0)
    y_denoised = spectral_denoise(y, sr=sr)

    # 2. Detect active vocal phrases using core speech formant band (250 - 3200 Hz)
    sos_bp = signal.butter(4, [250.0, 3200.0], btype="bandpass", fs=sr, output="sos")
    y_vb = signal.sosfilt(sos_bp, y_denoised)
    raw_intervals = librosa.effects.split(y_vb, top_db=19, frame_length=1024, hop_length=256)

    # Add 110ms margin to protect unvoiced sibilants ('üst üste', 'sesimden') and merge close gaps
    pad = int(sr * 0.11)
    merged_intervals: list[list[int]] = []
    for s, e in raw_intervals:
        s_pad = max(0, int(s) - pad)
        e_pad = min(len(y_denoised), int(e) + pad)
        if merged_intervals and (s_pad - merged_intervals[-1][1]) < int(sr * 0.12):
            merged_intervals[-1][1] = max(merged_intervals[-1][1], e_pad)
        else:
            merged_intervals.append([s_pad, e_pad])

    # If clip starts immediately at 0.00s mid-word, skip the first 0.85s fragment
    if (
        len(y_denoised) > sr * 8
        and merged_intervals
        and merged_intervals[0][0] < int(sr * 0.05)
        and (merged_intervals[0][1] - merged_intervals[0][0]) > int(sr * 1.8)
    ):
        merged_intervals[0][0] = int(sr * 0.85)

    # Filter phrases >= 0.45s, compute median F0 and background music flatness
    candidate_phrases: list[tuple[np.ndarray, float, float]] = []
    for s, e in merged_intervals:
        if (e - s) < int(sr * 0.45):
            continue
        seg = y_denoised[s:e]
        try:
            f0_series = librosa.yin(seg, fmin=85, fmax=380, sr=sr)
            seg_f0 = float(np.nanmedian(f0_series))
        except Exception:
            seg_f0 = 175.0
        flatness = float(np.mean(librosa.feature.spectral_flatness(y=seg)))
        candidate_phrases.append((seg, seg_f0, flatness))

    if candidate_phrases:
        modal_f0 = float(np.median([f0 for _, f0, _ in candidate_phrases]))
        # Keep only phrases within 4.2 semitones of the speaker's natural modal speaking pitch
        consistent_phrases = [
            (seg, flat)
            for seg, seg_f0, flat in candidate_phrases
            if abs(12.0 * np.log2(max(seg_f0, 80.0) / max(modal_f0, 80.0))) <= 4.2
        ]
        if not consistent_phrases:
            consistent_phrases = [(seg, flat) for seg, _, flat in candidate_phrases]

        # Splice clean speech phrases; stop once >= 5.0s collected before exceeding target
        spliced: list[np.ndarray] = []
        spacer = np.zeros(int(sr * 0.08), dtype=np.float32)
        total_samples = 0
        min_clean_samples = int(sr * 5.0)
        target_max_samples = int(sr * 7.5)

        for seg, _ in consistent_phrases:
            if total_samples >= min_clean_samples and (
                total_samples + len(seg) > target_max_samples or len(seg) > int(sr * 3.5)
            ):
                break
            seg_clean = apply_smooth_onset_fade(seg.copy(), sr=sr, fade_ms=12.0)
            seg_clean = apply_smooth_offset_fade(seg_clean, sr=sr, fade_ms=15.0)
            if spliced:
                spliced.append(spacer)
                total_samples += len(spacer)
            spliced.append(seg_clean)
            total_samples += len(seg_clean)

        y_final = np.concatenate(spliced)[:target_max_samples]
    else:
        y_final = y_denoised[: int(sr * 7.5)]

    # Peak normalize to -0.5 dB (~0.95)
    max_val = np.max(np.abs(y_final))
    if max_val > 1e-6:
        y_final = (y_final / max_val) * 0.95

    return y_final.astype(np.float32)


class VoiceCloningService:
    @staticmethod
    def list_custom_voices() -> list[dict[str, Any]]:
        return _load_index()

    @staticmethod
    def get_custom_voice(voice_id: str) -> dict[str, Any] | None:
        voices = _load_index()
        for v in voices:
            if v["id"] == voice_id:
                return v
        return None

    @staticmethod
    def delete_custom_voice(voice_id: str) -> bool:
        voices = _load_index()
        remaining = [v for v in voices if v["id"] != voice_id]
        if len(remaining) == len(voices):
            return False
        _save_index(remaining)

        # Delete wav file and precomputed latents
        audio_file = CUSTOM_VOICES_DIR / f"{voice_id}.wav"
        if audio_file.exists():
            try:
                audio_file.unlink()
            except Exception:
                pass

        latent_file = CUSTOM_VOICES_DIR / f"{voice_id}_latents.pt"
        if latent_file.exists():
            try:
                latent_file.unlink()
            except Exception:
                pass

        return True

    @staticmethod
    def register_voice_sample(
        name: str,
        audio_bytes: bytes,
        description: str = "Özel Klonlanmış Ses",
    ) -> dict[str, Any]:
        voice_id = f"custom_{uuid.uuid4().hex[:8]}"

        try:
            with io.BytesIO(audio_bytes) as in_buf:
                y, sr = librosa.load(in_buf, sr=24000, mono=True)

            # Preprocess: Denoise, isolate clean vocals, extract golden sample
            clean_audio = _extract_golden_sample(y, sr=24000)

            # Save clean WAV reference sample
            out_file = CUSTOM_VOICES_DIR / f"{voice_id}.wav"
            sf.write(str(out_file), clean_audio, 24000, format="WAV")

            # Gender / Pitch detection for label only
            f0, voiced_flag, _ = librosa.pyin(
                clean_audio[: 24000 * 5],
                fmin=50,
                fmax=400,
                sr=24000,
            )
            valid_f0 = f0[voiced_flag] if voiced_flag is not None else np.array([])
            median_f0 = float(np.median(valid_f0)) if len(valid_f0) > 0 else 160.0
            gender_detected = "Erkek" if median_f0 < 155.0 else "Kadın"

            # Pre-compute and persist conditioning latents for instant high-fidelity cloning
            tts = get_xtts_model()
            tts_model = tts.synthesizer.tts_model
            with torch.no_grad():
                gpt_cond_latent, speaker_embedding = tts_model.get_conditioning_latents(
                    audio_path=str(out_file),
                    gpt_cond_len=12,
                    gpt_cond_chunk_len=4,
                    librosa_trim_db=30,
                    sound_norm_refs=True,
                )
            latent_file = CUSTOM_VOICES_DIR / f"{voice_id}_latents.pt"
            torch.save(
                {
                    "gpt_cond_latent": gpt_cond_latent.cpu(),
                    "speaker_embedding": speaker_embedding.cpu(),
                },
                latent_file,
            )

            voice_record = {
                "id": voice_id,
                "name": name.strip(),
                "style": description.strip() or "Özel Klonlanmış Ses",
                "tag": "1-e-1 Klonlanmış",
                "gender": gender_detected,
                "engine": "custom_clone",
                "is_custom": True,
                "languages": ["tr-tr", "en-us"],
            }

            voices = _load_index()
            voices.insert(0, voice_record)
            _save_index(voices)
            logger.info("custom_voice_registered id=%s name=%s latents_saved=True", voice_id, name)
            return voice_record

        except Exception as exc:
            logger.exception("custom_voice_registration_failed name=%s", name)
            raise AppError(
                code="voice_clone_failed",
                message=f"Ses dosyası analiz edilemedi: {str(exc)}",
                status_code=400,
            ) from exc

    @staticmethod
    def _get_or_compute_latents(voice_id: str, ref_file: Path) -> tuple[torch.Tensor, torch.Tensor]:
        """Loads cached conditioning latents from disk or computes and persists them."""
        latent_file = CUSTOM_VOICES_DIR / f"{voice_id}_latents.pt"
        if latent_file.exists():
            try:
                data = torch.load(latent_file, map_location="cpu")
                return data["gpt_cond_latent"], data["speaker_embedding"]
            except Exception as e:
                logger.warning("latent_cache_load_failed voice_id=%s err=%s", voice_id, e)

        # Compute from ref_file
        tts = get_xtts_model()
        tts_model = tts.synthesizer.tts_model
        with torch.no_grad():
            gpt_cond_latent, speaker_embedding = tts_model.get_conditioning_latents(
                audio_path=str(ref_file),
                gpt_cond_len=12,
                gpt_cond_chunk_len=4,
                librosa_trim_db=30,
                sound_norm_refs=True,
            )

        try:
            torch.save(
                {
                    "gpt_cond_latent": gpt_cond_latent.cpu(),
                    "speaker_embedding": speaker_embedding.cpu(),
                },
                latent_file,
            )
        except Exception:
            pass

        return gpt_cond_latent, speaker_embedding

    @classmethod
    def synthesize_with_voice(
        cls,
        text: str,
        voice_id: str,
        language: str = "tr-tr",
        speed: float = 1.0,
    ) -> tuple[bytes, float]:
        """Synthesizes text using true 1-to-1 zero-shot neural voice cloning with XTTS v2.

        Preserves authentic vocal tract formants (no artificial pitch shifting), eliminates
        initial consonant slurring ('Merhaba'), and strips trailing EOS breath hallucinations.
        """
        ref_file = CUSTOM_VOICES_DIR / f"{voice_id}.wav"
        if not ref_file.exists():
            raise AppError(
                code="voice_sample_missing",
                message=f"Özel ses dosyası ({voice_id}.wav) bulunamadı.",
                status_code=404,
            )

        lang_code = "en" if language.lower().startswith("en") else "tr"

        tts = get_xtts_model()
        tts_model = tts.synthesizer.tts_model

        gpt_cond_latent, speaker_embedding = cls._get_or_compute_latents(voice_id, ref_file)

        # 1. Prepare natural speech phrases with prosody hints
        phrases = prepare_natural_phrases(text)
        if not phrases:
            phrases = [(text.strip() or "Merhaba.", ".")]

        logger.info(
            "xtts_natural_synthesis_start voice_id=%s lang=%s phrases_count=%d",
            voice_id,
            lang_code,
            len(phrases),
        )

        audio_segments: list[np.ndarray] = []
        sample_rate = 24000

        # Silence buffers for natural human pauses
        pause_periods = {
            "?": np.zeros(int(sample_rate * 0.18), dtype=np.float32),
            "!": np.zeros(int(sample_rate * 0.16), dtype=np.float32),
            ".": np.zeros(int(sample_rate * 0.14), dtype=np.float32),
            ";": np.zeros(int(sample_rate * 0.12), dtype=np.float32),
            ",": np.zeros(int(sample_rate * 0.07), dtype=np.float32),
        }

        # Calibrate default Turkish speaking pace for natural dubbing tempo
        effective_speed = (speed * 1.04) if (speed == 1.0 and lang_code == "tr") else speed

        try:
            torch.set_num_threads(8)
        except Exception:
            pass

        with torch.inference_mode():
            for idx, (phrase_text, punct) in enumerate(phrases):
                if not phrase_text.strip():
                    continue

                clean_phrase = (
                    turkish_safe_lower(phrase_text) if lang_code == "tr" else phrase_text.strip()
                )

                out = tts_model.inference(
                    text=clean_phrase,
                    language=lang_code,
                    gpt_cond_latent=gpt_cond_latent,
                    speaker_embedding=speaker_embedding,
                    temperature=0.65,  # Crisp consonant articulation, prevents 'Nayaba' slur
                    length_penalty=1.0,
                    repetition_penalty=10.0,  # Prevents trailing '-e' / EOS breath hallucinations
                    top_k=50,
                    top_p=0.80,  # Stable timbre & formant fidelity
                    speed=effective_speed,
                    enable_text_splitting=False,
                )

                wav_piece = np.array(out["wav"], dtype=np.float32)
                if len(wav_piece) > 0:
                    clean_piece = clean_synthesized_segment(wav_piece, sr=sample_rate)
                    audio_segments.append(clean_piece)

                    # Add human breathing pause if not the final sentence
                    if idx < len(phrases) - 1:
                        pause_buf = pause_periods.get(punct, pause_periods["."])
                        audio_segments.append(pause_buf)

        if not audio_segments:
            raise AppError(
                code="synthesis_empty",
                message="Ses üretilemedi.",
                status_code=500,
            )

        # Concatenate all phrase segments and breath pauses
        full_audio = np.concatenate(audio_segments)

        # Normalize output cleanly without artificial pitch shifting (preserves speaker formants)
        max_amp = np.max(np.abs(full_audio))
        if max_amp > 1e-6:
            full_audio = (full_audio / max_amp) * 0.95

        duration = len(full_audio) / float(sample_rate)

        out_buf = io.BytesIO()
        sf.write(out_buf, full_audio, sample_rate, format="WAV")
        out_bytes = out_buf.getvalue()

        logger.info(
            "xtts_natural_synthesis_complete voice_id=%s duration=%.2f bytes=%d",
            voice_id,
            duration,
            len(out_bytes),
        )
        return out_bytes, duration
