from __future__ import annotations

import librosa
import numpy as np
from scipy import signal


def remove_dc_and_rumble(y: np.ndarray, sr: int = 24000, cutoff_hz: float = 75.0) -> np.ndarray:
    """Removes DC offset and sub-vocal rumble/bass music below 75 Hz.

    Preserves full human chest resonance (male fundamentals down to 85 Hz, female 140+ Hz).
    """
    if len(y) == 0:
        return y
    y = y - np.mean(y)
    sos = signal.butter(4, cutoff_hz, btype="highpass", fs=sr, output="sos")
    y_filtered = signal.sosfilt(sos, y)
    return y_filtered.astype(np.float32)


def remove_high_hiss(y: np.ndarray, sr: int = 24000, cutoff_hz: float = 11000.0) -> np.ndarray:
    """Removes ultrasonic noise and high-frequency hiss near Nyquist while preserving sibilance."""
    if len(y) == 0:
        return y
    sos = signal.butter(2, min(cutoff_hz, (sr / 2.0) - 200.0), btype="lowpass", fs=sr, output="sos")
    y_filtered = signal.sosfilt(sos, y)
    return y_filtered.astype(np.float32)


def spectral_denoise(y: np.ndarray, sr: int = 24000) -> np.ndarray:
    """Suppresses background music and room noise from reference voice samples.

    Identifies non-vocal frames using the 220-3400 Hz speech formant band so background
    piano/strings during speech pauses are accurately profiled and subtracted without
    distorting vocal harmonics.
    """
    if len(y) < sr * 0.5:
        return y

    # 1. Clean DC, sub-bass soundtrack rumble, and extreme high hiss
    y = remove_dc_and_rumble(y, sr=sr, cutoff_hz=75.0)
    y = remove_high_hiss(y, sr=sr, cutoff_hz=11000.0)

    # 2. STFT analysis
    n_fft = 1024
    hop_length = 256
    stft = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    magnitude, phase = np.abs(stft), np.angle(stft)

    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    vocal_bins = (freqs >= 220.0) & (freqs <= 3400.0)

    # 3. Find non-vocal frames (pauses where only background music/noise is present)
    vocal_band_energy = np.mean(magnitude[vocal_bins, :] ** 2, axis=0)
    energy_threshold = np.percentile(vocal_band_energy, 25)
    noise_mask = vocal_band_energy <= energy_threshold

    if np.any(noise_mask):
        noise_profile = np.percentile(magnitude[:, noise_mask], 75, axis=1, keepdims=True)
    else:
        noise_profile = np.percentile(magnitude, 15, axis=1, keepdims=True)

    # 4. Frequency-aware spectral gain mask (preserve formants, attenuate music frequencies)
    alpha = np.where(vocal_bins[:, None], 0.95, 1.35)
    beta = np.where(vocal_bins[:, None], 0.16, 0.06)

    gain = np.clip(1.0 - (alpha * noise_profile) / (magnitude + 1e-8), beta, 1.0)
    # Smooth gain across time frames to prevent musical-noise artifacts
    if gain.shape[1] >= 3:
        gain = (
            0.25 * np.roll(gain, 1, axis=1)
            + 0.50 * gain
            + 0.25 * np.roll(gain, -1, axis=1)
        )

    cleaned_magnitude = magnitude * gain

    # 5. Reconstruct time-domain vocal signal
    clean_stft = cleaned_magnitude * np.exp(1j * phase)
    y_clean = librosa.istft(clean_stft, hop_length=hop_length, length=len(y))

    return y_clean.astype(np.float32)


def apply_smooth_onset_fade(y: np.ndarray, sr: int = 24000, fade_ms: float = 5.0) -> np.ndarray:
    """Eliminates start-of-speech electrical DC pops using a 5ms micro-Hann fade.

    Preserves 100% of initial consonants (m, n, p, t, k, s).
    """
    if len(y) == 0:
        return y

    fade_samples = min(int(sr * (fade_ms / 1000.0)), len(y) // 2)
    if fade_samples > 0:
        window = 0.5 * (1.0 - np.cos(np.linspace(0, np.pi, fade_samples)))
        y[:fade_samples] = y[:fade_samples] * window

    return y


def apply_smooth_offset_fade(y: np.ndarray, sr: int = 24000, fade_ms: float = 14.0) -> np.ndarray:
    """Eliminates end-of-speech clicks and softens final syllable release with a 14ms fade-out."""
    if len(y) == 0:
        return y

    fade_samples = min(int(sr * (fade_ms / 1000.0)), len(y) // 2)
    if fade_samples > 0:
        window = 0.5 * (1.0 + np.cos(np.linspace(0, np.pi, fade_samples)))
        y[-fade_samples:] = y[-fade_samples:] * window

    return y


def clean_synthesized_segment(wav_piece: np.ndarray, sr: int = 24000) -> np.ndarray:
    """Cleans a single TTS synthesized sentence segment:

    1. Removes DC offset and sub-75Hz rumble.
    2. Uses asymmetric trimming:
       - Gentle onset threshold (top_db=46 + 35ms pre-margin) so initial consonants are kept.
       - Stricter offset threshold (top_db=30 + 18ms post-margin) to strip trailing breath ('-e').
    3. Applies micro-fades to guarantee click-free boundaries.
    """
    if len(wav_piece) == 0:
        return wav_piece

    wav_clean = remove_dc_and_rumble(wav_piece.copy(), sr=sr, cutoff_hz=70.0)

    # Onset detection: sensitive (top_db=46) to preserve soft initial consonants
    onset_intervals = librosa.effects.split(
        wav_clean, top_db=46, frame_length=1024, hop_length=256
    )
    # Offset detection: stricter (top_db=30) to strip trailing XTTS breath/murmur hallucinations
    offset_intervals = librosa.effects.split(
        wav_clean, top_db=30, frame_length=1024, hop_length=256
    )

    if len(onset_intervals) > 0 and len(offset_intervals) > 0:
        start_sample = max(0, int(onset_intervals[0][0]) - int(sr * 0.035))
        end_sample = min(len(wav_clean), int(offset_intervals[-1][1]) + int(sr * 0.018))
        if end_sample > start_sample:
            wav_clean = wav_clean[start_sample:end_sample]

    wav_clean = apply_smooth_onset_fade(wav_clean, sr=sr, fade_ms=5.0)
    wav_clean = apply_smooth_offset_fade(wav_clean, sr=sr, fade_ms=14.0)

    return wav_clean.astype(np.float32)
