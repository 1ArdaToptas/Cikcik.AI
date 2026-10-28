"""
Google Colab GPU Voice Studio - XTTS v2 with GPU Acceleration
Runs on free Tesla T4 GPU with ~2-3 seconds synthesis time.
"""
from __future__ import annotations

import io
import os
import re
import time
import librosa
import numpy as np
import soundfile as sf
import torch
import gradio as gr
from scipy import signal

# Check GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[*] Running on device: {device.upper()}")
if device == "cuda":
    print(f"[*] GPU Name: {torch.cuda.get_device_name(0)}")
    print(f"[*] VRAM Available: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

# Monkey-patch transformers 4.49+ compatibility for Tortoise/XTTS
try:
    import transformers.pytorch_utils
    if not hasattr(transformers.pytorch_utils, "isin_mps_friendly"):
        transformers.pytorch_utils.isin_mps_friendly = torch.isin
except Exception:
    pass

# Load XTTS Model on GPU
print("[*] Loading XTTS v2 model into GPU...")
try:
    from TTS.api import TTS
except (ImportError, Exception):
    print("⏳ TTS kütüphanesi kuruluyor/onarılıyor (yaklaşık 1 dakika sürer)...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "coqui-tts", "gradio", "librosa", "soundfile", "scipy"])
    from importlib import invalidate_caches
    invalidate_caches()
    try:
        import transformers.pytorch_utils
        transformers.pytorch_utils.isin_mps_friendly = torch.isin
    except Exception:
        pass
    from TTS.api import TTS

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=(device == "cuda"))
tts_model = tts.synthesizer.tts_model
print("[+] Model loaded successfully!")

def turkish_safe_lower(text: str) -> str:
    return (
        text.replace("İ", "i")
        .replace("I", "ı")
        .replace("Ğ", "ğ")
        .replace("Ü", "ü")
        .replace("Ş", "ş")
        .replace("Ö", "ö")
        .replace("Ç", "ç")
        .lower()
        .replace("\u0307", "")
    )


def normalize_text_for_speech(text: str) -> str:
    text = text.strip().replace("\u0307", "")
    if not text:
        return ""
    # Clean internal stray hyphens (e.g. "tekleme-yen" -> "teklemeyen")
    text = re.sub(r"(?<=[a-zA-ZçğıöşüÇĞİÖŞÜ])-(?=[a-zA-ZçğıöşüÇĞİÖŞÜ])", "", text)
    # Smooth short 1-2 word exclamations at the start of sentences ("Merhaba! Bu..." -> "Merhaba, bu...")
    text = re.sub(
        r"^([A-Za-zçğıöşüÇĞİÖŞÜ]+(?:\s+[A-Za-zçğıöşüÇĞİÖŞÜ]+)?)!\s+([A-Za-zçğıöşüÇĞİÖŞÜ])",
        lambda m: f"{m.group(1)}, {m.group(2)}",
        text,
    )
    return text


def prepare_natural_phrases(text: str) -> list[tuple[str, str]]:
    clean = normalize_text_for_speech(text)
    if not clean:
        return []
    sentence_chunks = re.split(r"([.!?;\n]+)", clean)
    raw_sentences: list[tuple[str, str]] = []
    i = 0
    while i < len(sentence_chunks):
        sentence = sentence_chunks[i].strip()
        punct = sentence_chunks[i + 1].strip() if i + 1 < len(sentence_chunks) else "."
        i += 2
        if not sentence:
            continue
        primary_punct = punct[0] if punct else "."
        if primary_punct not in {".", "!", "?", ";"}:
            primary_punct = "."
        if len(sentence.split()) <= 1 and i < len(sentence_chunks) and sentence_chunks[i].strip():
            sentence_chunks[i] = f"{sentence}, {sentence_chunks[i].strip()}"
            continue
        if len(sentence) > 95 and "," in sentence:
            sub_clauses = sentence.split(",")
            accum: list[str] = []
            for clause in sub_clauses:
                c = clause.strip()
                if not c:
                    continue
                accum.append(c)
                if sum(len(x) for x in accum) >= 45:
                    raw_sentences.append((", ".join(accum).strip() + ".", ","))
                    accum = []
            if accum:
                if raw_sentences and len(", ".join(accum)) < 25:
                    prev_text, _ = raw_sentences.pop()
                    merged_text = prev_text.rstrip(".") + ", " + ", ".join(accum).strip() + primary_punct
                    raw_sentences.append((merged_text, primary_punct))
                else:
                    raw_sentences.append((", ".join(accum).strip() + primary_punct, primary_punct))
        else:
            raw_sentences.append((sentence + primary_punct, primary_punct))
    return raw_sentences


def apply_smooth_onset_fade(y: np.ndarray, sr: int = 24000, fade_ms: float = 5.0) -> np.ndarray:
    if len(y) == 0:
        return y
    fade_samples = min(int(sr * (fade_ms / 1000.0)), len(y) // 2)
    if fade_samples > 0:
        window = 0.5 * (1.0 - np.cos(np.linspace(0, np.pi, fade_samples)))
        y[:fade_samples] = y[:fade_samples] * window
    return y


def apply_smooth_offset_fade(y: np.ndarray, sr: int = 24000, fade_ms: float = 14.0) -> np.ndarray:
    if len(y) == 0:
        return y
    fade_samples = min(int(sr * (fade_ms / 1000.0)), len(y) // 2)
    if fade_samples > 0:
        window = 0.5 * (1.0 + np.cos(np.linspace(0, np.pi, fade_samples)))
        y[-fade_samples:] = y[-fade_samples:] * window
    return y


def clean_synthesized_segment(wav_piece: np.ndarray, sr: int = 24000) -> np.ndarray:
    if len(wav_piece) == 0:
        return wav_piece
    wav_clean = wav_piece.copy() - np.mean(wav_piece)
    sos = signal.butter(4, 70.0, btype="highpass", fs=sr, output="sos")
    wav_clean = signal.sosfilt(sos, wav_clean).astype(np.float32)

    onset_intervals = librosa.effects.split(wav_clean, top_db=46, frame_length=1024, hop_length=256)
    offset_intervals = librosa.effects.split(wav_clean, top_db=30, frame_length=1024, hop_length=256)
    if len(onset_intervals) > 0 and len(offset_intervals) > 0:
        start_sample = max(0, int(onset_intervals[0][0]) - int(sr * 0.035))
        end_sample = min(len(wav_clean), int(offset_intervals[-1][1]) + int(sr * 0.018))
        if end_sample > start_sample:
            wav_clean = wav_clean[start_sample:end_sample]

    wav_clean = apply_smooth_onset_fade(wav_clean, sr=sr, fade_ms=5.0)
    wav_clean = apply_smooth_offset_fade(wav_clean, sr=sr, fade_ms=14.0)
    return wav_clean.astype(np.float32)


def extract_golden_sample(y: np.ndarray, sr: int = 24000) -> np.ndarray:
    """Isolates pure human speech from background music/noise and splices a clean 8-9.5s reference."""
    if len(y) == 0:
        return y
    y = y - np.mean(y)
    sos_hp = signal.butter(4, 75.0, btype="highpass", fs=sr, output="sos")
    y = signal.sosfilt(sos_hp, y).astype(np.float32)

    # Vocal-band spectral music/noise suppression
    if len(y) >= sr * 0.5:
        n_fft, hop_length = 1024, 256
        stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
        mag, phase = np.abs(stft), np.angle(stft)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
        vocal_bins = (freqs >= 220.0) & (freqs <= 3400.0)
        vb_energy = np.mean(mag[vocal_bins, :] ** 2, axis=0)
        noise_mask = vb_energy <= np.percentile(vb_energy, 25)
        noise_profile = (
            np.percentile(mag[:, noise_mask], 75, axis=1, keepdims=True)
            if np.any(noise_mask)
            else np.percentile(mag, 15, axis=1, keepdims=True)
        )
        alpha = np.where(vocal_bins[:, None], 0.95, 1.35)
        beta = np.where(vocal_bins[:, None], 0.16, 0.06)
        gain = np.clip(1.0 - (alpha * noise_profile) / (mag + 1e-8), beta, 1.0)
        if gain.shape[1] >= 3:
            gain = 0.25 * np.roll(gain, 1, axis=1) + 0.50 * gain + 0.25 * np.roll(gain, -1, axis=1)
        y_denoised = librosa.istft(mag * gain * np.exp(1j * phase), hop_length=hop_length, length=len(y)).astype(
            np.float32
        )
    else:
        y_denoised = y

    # Active vocal phrase segmentation (excises musical pauses and pitch outliers)
    sos_bp = signal.butter(4, [250.0, 3200.0], btype="bandpass", fs=sr, output="sos")
    y_vb = signal.sosfilt(sos_bp, y_denoised)
    raw_intervals = librosa.effects.split(y_vb, top_db=19, frame_length=1024, hop_length=256)

    pad = int(sr * 0.11)
    merged: list[list[int]] = []
    for s, e in raw_intervals:
        s_pad = max(0, int(s) - pad)
        e_pad = min(len(y_denoised), int(e) + pad)
        if merged and (s_pad - merged[-1][1]) < int(sr * 0.12):
            merged[-1][1] = max(merged[-1][1], e_pad)
        else:
            merged.append([s_pad, e_pad])

    if (
        len(y_denoised) > sr * 8
        and merged
        and merged[0][0] < int(sr * 0.05)
        and (merged[0][1] - merged[0][0]) > int(sr * 1.8)
    ):
        merged[0][0] = int(sr * 0.85)

    candidates: list[tuple[np.ndarray, float]] = []
    for s, e in merged:
        if (e - s) < int(sr * 0.45):
            continue
        seg = y_denoised[s:e]
        try:
            seg_f0 = float(np.nanmedian(librosa.yin(seg, fmin=85, fmax=380, sr=sr)))
        except Exception:
            seg_f0 = 175.0
        candidates.append((seg, seg_f0))

    if candidates:
        modal_f0 = float(np.median([f0 for _, f0 in candidates]))
        consistent = [
            seg
            for seg, f0 in candidates
            if abs(12.0 * np.log2(max(f0, 80.0) / max(modal_f0, 80.0))) <= 4.2
        ] or [seg for seg, _ in candidates]

        spliced: list[np.ndarray] = []
        spacer = np.zeros(int(sr * 0.08), dtype=np.float32)
        total = 0
        min_clean = int(sr * 5.0)
        target_max = int(sr * 7.5)
        for seg in consistent:
            if total >= min_clean and (total + len(seg) > target_max or len(seg) > int(sr * 3.5)):
                break
            sc = apply_smooth_onset_fade(seg.copy(), sr=sr, fade_ms=12.0)
            sc = apply_smooth_offset_fade(sc, sr=sr, fade_ms=15.0)
            if spliced:
                spliced.append(spacer)
                total += len(spacer)
            spliced.append(sc)
            total += len(sc)
        y_final = np.concatenate(spliced)[:target_max]
    else:
        y_final = y_denoised[: int(sr * 7.5)]

    max_val = np.max(np.abs(y_final))
    if max_val > 1e-6:
        y_final = (y_final / max_val) * 0.95
    return y_final.astype(np.float32)


def synthesize_voice(ref_audio_path: Any, text: str, language: str = "tr", speed: float = 1.04):
    try:
        if isinstance(ref_audio_path, dict):
            ref_audio_path = ref_audio_path.get("path") or ref_audio_path.get("name")
        elif isinstance(ref_audio_path, (list, tuple)):
            ref_audio_path = ref_audio_path[0] if len(ref_audio_path) > 0 else None

        if not ref_audio_path or not os.path.exists(str(ref_audio_path)):
            return None, "⚠️ Lütfen bir referans ses dosyası yükleyin veya mikrofonla kaydedin."
        if not text.strip():
            return None, "⚠️ Lütfen seslendirilecek metni girin."

        t0 = time.time()
        sr = 24000
        y, _ = librosa.load(str(ref_audio_path), sr=sr, mono=True)
        clean_ref = extract_golden_sample(y, sr=sr)

        temp_ref_path = "/tmp/clean_ref.wav"
        sf.write(temp_ref_path, clean_ref, sr, format="WAV")

        with torch.inference_mode():
            gpt_cond_latent, speaker_embedding = tts_model.get_conditioning_latents(
                audio_path=temp_ref_path,
                gpt_cond_len=12,
                gpt_cond_chunk_len=4,
                librosa_trim_db=30,
                sound_norm_refs=True,
            )

        phrases = prepare_natural_phrases(text)
        if not phrases:
            phrases = [(text.strip(), ".")]

        pause_periods = {
            "?": np.zeros(int(sr * 0.18), dtype=np.float32),
            "!": np.zeros(int(sr * 0.16), dtype=np.float32),
            ".": np.zeros(int(sr * 0.14), dtype=np.float32),
            ";": np.zeros(int(sr * 0.12), dtype=np.float32),
            ",": np.zeros(int(sr * 0.07), dtype=np.float32),
        }

        audio_segments: list[np.ndarray] = []
        with torch.inference_mode():
            for idx, (phrase_text, punct) in enumerate(phrases):
                if not phrase_text.strip():
                    continue
                clean_phrase = (
                    turkish_safe_lower(phrase_text) if language == "tr" else phrase_text.strip()
                )
                out = tts_model.inference(
                    text=clean_phrase,
                    language=language,
                    gpt_cond_latent=gpt_cond_latent,
                    speaker_embedding=speaker_embedding,
                    temperature=0.65,
                    length_penalty=1.0,
                    repetition_penalty=10.0,
                    top_k=50,
                    top_p=0.80,
                    speed=speed,
                    enable_text_splitting=False,
                )
                wav_piece = np.array(out["wav"], dtype=np.float32)
                if len(wav_piece) > 0:
                    clean_piece = clean_synthesized_segment(wav_piece, sr=sr)
                    audio_segments.append(clean_piece)
                    if idx < len(phrases) - 1:
                        audio_segments.append(pause_periods.get(punct, pause_periods["."]))

        wav = np.concatenate(audio_segments) if audio_segments else np.zeros(sr, dtype=np.float32)

        max_amp = np.max(np.abs(wav))
        if max_amp > 1e-6:
            wav = (wav / max_amp) * 0.95

        out_wav_path = "/tmp/synthesized_voice.wav"
        sf.write(out_wav_path, wav, sr, format="WAV")

        t1 = time.time()
        elapsed = t1 - t0
        audio_dur = len(wav) / sr
        info = f"⚡ **Üretim Süresi:** {elapsed:.2f} sn | ⏱️ **Ses Uzunluğu:** {audio_dur:.2f} sn (RTF: {elapsed/audio_dur:.2f}x)"
        return out_wav_path, info
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return None, f"❌ **Hata Detayı:** {str(exc)}"

# Build Gradio UI
with gr.Blocks(title="TTS & STT Studio - GPU Voice Cloning", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🎙️ TTS & STT Studio — Yüksek Hızlı GPU Ses Klonlama")
    gr.Markdown("**NVIDIA T4 GPU** üzerinde çalışan XTTS v2 motoru ile sesleri **2-3 saniyede** klonlayın.")

    with gr.Row():
        with gr.Column():
            audio_input = gr.Audio(type="filepath", label="📁 Klonlanacak Referans Ses (Mikrofonla konuşun veya dosya yükleyin)")
            text_input = gr.Textbox(
                label="✍️ Seslendirilecek Metin",
                value="Merhaba! Bu stüdyoda artık son derece akıcı, teklemeyen Türkçe ve İngilizce yapay zeka sesleriyle metinlerinizi seslendirebilirsiniz.",
                lines=4
            )
            with gr.Row():
                lang_choice = gr.Dropdown(choices=["tr", "en"], value="tr", label="Dil (Language)")
                speed_slider = gr.Slider(minimum=0.8, maximum=1.4, value=1.04, step=0.02, label="Konuşma Hızı")
            synth_btn = gr.Button("🚀 Sentezle (GPU Hızında)", variant="primary", size="lg")

        with gr.Column():
            audio_output = gr.Audio(label="🔊 Üretilen Ses", interactive=False)
            info_output = gr.Markdown("Sonuç bekleniyor...")

    synth_btn.click(
        fn=synthesize_voice,
        inputs=[audio_input, text_input, lang_choice, speed_slider],
        outputs=[audio_output, info_output]
    )

if __name__ == "__main__":
    demo.queue().launch(share=True, debug=True)
