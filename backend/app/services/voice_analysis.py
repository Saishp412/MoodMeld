"""
Voice Emotion Analysis Service — Phase 5 (v3)

Extracts acoustic features from browser-recorded audio (WebM/OGG/WAV)
using librosa and maps them to emotional states.

Features extracted:
  - MFCC (Mel-frequency cepstral coefficients) — 13 coefficients
  - Pitch (F0 via pyin algorithm)
  - Energy / RMS
  - Spectral centroid, bandwidth, rolloff
  - Zero-crossing rate
  - Tempo / speech rate estimation

Emotion classification uses a two-stage approach:
  Stage 1: Russell's circumplex quadrant (arousal × valence) from acoustics
  Stage 2: Fine-grained scoring within quadrant using spectral features
"""

import io
import subprocess
import tempfile
import os
import numpy as np
from typing import Optional

try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False


# ── Emotion Classification via Russell's Circumplex ──
#
# High Arousal, Positive Valence: happy, motivated
# High Arousal, Negative Valence: stressed, anxious
# Low Arousal, Positive Valence:  calm
# Low Arousal, Negative Valence:  sad, fatigued, burned_out
#
# Key acoustic correlates (from Schuller et al., Banse & Scherer):
#   Arousal ↑ → higher pitch, energy, speaking rate, spectral centroid
#   Valence ↑ → wider pitch range, more harmonic, higher MFCC1 variance

# Thresholds for the two-axis classification (calibrated for real speech)
# These are relative thresholds — we compute percentile-based features

EMOTION_MAP = {
    # (high_arousal, positive_valence) → emotions
    (True,  True):  ["happy", "motivated"],
    (True,  False): ["stressed", "anxious"],
    (False, True):  ["calm"],
    (False, False): ["sad", "fatigued", "burned_out"],
}

# Reference values for real speech from microphone
# (used for arousal/valence axis determination)
AROUSAL_THRESHOLDS = {
    "pitch_mean": 140.0,      # Hz — lowered to accommodate male voices
    "energy_mean": 0.015,     # RMS — lowered significantly for standard laptop mics
    "tempo": 95.0,            # BPM — lowered threshold
    "spectral_centroid": 1800.0,  # Hz — lowered threshold
    "zcr": 0.045,             # lowered threshold
}

VALENCE_INDICATORS = {
    "pitch_range_threshold": 60.0,  # Hz — lowered threshold
    "energy_dyn_range_threshold": 2.0,  # lowered threshold
    "spectral_contrast_threshold": 16.0,  # lowered threshold
}


def _decode_audio(audio_bytes: bytes) -> Optional[tuple]:
    """
    Decode audio bytes to float32 numpy array.

    Supports: WAV, OGG, FLAC natively via soundfile.
    For WebM/MP4: tries ffmpeg subprocess conversion to WAV first.
    Returns (y, sr) or None on failure.
    """
    TARGET_SR = 16000  # 16kHz is enough for speech

    # 1. Try soundfile directly (works for WAV, OGG, FLAC)
    try:
        buf = io.BytesIO(audio_bytes)
        y, sr = sf.read(buf, dtype="float32", always_2d=False)
        if y.ndim > 1:
            y = y.mean(axis=1)  # mix to mono
        if sr != TARGET_SR:
            y = librosa.resample(y, orig_sr=sr, target_sr=TARGET_SR)
        return y, TARGET_SR
    except Exception:
        pass

    # 2. Try librosa directly (handles more formats if audioread is available)
    try:
        buf = io.BytesIO(audio_bytes)
        y, sr = librosa.load(buf, sr=TARGET_SR, mono=True)
        return y, TARGET_SR
    except Exception:
        pass

    # 3. Try ffmpeg conversion for WebM/Opus (browser default)
    tmp_in_path = None
    tmp_out_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_in:
            tmp_in.write(audio_bytes)
            tmp_in_path = tmp_in.name

        tmp_out_path = tmp_in_path.replace(".webm", ".wav")
        
        # Try multiple ffmpeg locations
        ffmpeg_paths = ["ffmpeg"]
        # Common Windows install locations
        for drive in ["C", "D"]:
            ffmpeg_paths.extend([
                f"{drive}:\\ffmpeg\\bin\\ffmpeg.exe",
                f"{drive}:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
                os.path.expanduser(f"~\\scoop\\apps\\ffmpeg\\current\\bin\\ffmpeg.exe"),
            ])
        # Also check PATH-accessible locations and WinGet Links
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            ffmpeg_paths.append(os.path.join(local_app_data, "Microsoft", "WinGet", "Links", "ffmpeg.exe"))
            
            # Dynamically search the WinGet Packages folder for ffmpeg.exe
            winget_packages = os.path.join(local_app_data, "Microsoft", "WinGet", "Packages")
            if os.path.exists(winget_packages):
                for root, dirs, files in os.walk(winget_packages):
                    if "ffmpeg.exe" in files:
                        ffmpeg_paths.append(os.path.join(root, "ffmpeg.exe"))
                        break

        converted = False
        for ffmpeg_cmd in ffmpeg_paths:
            try:
                result = subprocess.run(
                    [ffmpeg_cmd, "-y", "-i", tmp_in_path,
                     "-ac", "1", "-ar", str(TARGET_SR),
                     "-acodec", "pcm_s16le", tmp_out_path],
                    capture_output=True, timeout=15,
                )
                if result.returncode == 0 and os.path.exists(tmp_out_path):
                    converted = True
                    break
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue

        if converted:
            y, sr = sf.read(tmp_out_path, dtype="float32", always_2d=False)
            if sr != TARGET_SR:
                y = librosa.resample(y, orig_sr=sr, target_sr=TARGET_SR)
            return y, TARGET_SR
        else:
            print("[WARN] Voice: ffmpeg not found or conversion failed. Install ffmpeg for WebM support.")
            
    except Exception as e:
        print(f"[WARN] Voice: ffmpeg conversion error: {e}")
    finally:
        for path in [tmp_in_path, tmp_out_path]:
            if path:
                try:
                    os.unlink(path)
                except Exception:
                    pass

    return None


def extract_features(audio_bytes: bytes) -> Optional[dict]:
    """
    Extract acoustic features from raw audio bytes.
    Supports WAV, OGG, WebM (with ffmpeg), FLAC.
    Returns a feature dict or None if processing fails.
    """
    if not LIBROSA_AVAILABLE:
        return None

    result = _decode_audio(audio_bytes)
    if result is None:
        print("[WARN] Voice: could not decode audio")
        return None

    y, sr = result

    if len(y) < sr * 0.5:  # Require at least 0.5s
        print(f"[WARN] Voice: audio too short ({len(y)/sr:.2f}s)")
        return None

    # Trim silence from start/end
    y_trimmed, _ = librosa.effects.trim(y, top_db=20)
    # Use trimmed if it's still long enough; otherwise use original
    if len(y_trimmed) >= sr * 0.5:
        y = y_trimmed

    try:
        # 1. MFCC (13 coefficients — key for voice timbre)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfccs, axis=1).tolist()
        mfcc_std = np.std(mfccs, axis=1).tolist()
        mfcc_delta = np.mean(librosa.feature.delta(mfccs), axis=1).tolist()

        # 2. Pitch via pyin (probabilistic YIN — more accurate than autocorrelation)
        f0, voiced_flag, _ = librosa.pyin(
            y,
            fmin=librosa.note_to_hz("C2"),   # ~65 Hz
            fmax=librosa.note_to_hz("C7"),   # ~2093 Hz
            sr=sr,
        )
        voiced = f0[voiced_flag] if voiced_flag is not None else np.array([])
        pitch_mean  = float(np.mean(voiced))  if len(voiced) > 0 else 0.0
        pitch_std   = float(np.std(voiced))   if len(voiced) > 0 else 0.0
        pitch_range = float(np.ptp(voiced))   if len(voiced) > 0 else 0.0
        pitch_min   = float(np.min(voiced))   if len(voiced) > 0 else 0.0
        pitch_max   = float(np.max(voiced))   if len(voiced) > 0 else 0.0
        voiced_ratio = float(voiced_flag.mean()) if voiced_flag is not None else 0.0

        # 3. Energy (RMS)
        rms = librosa.feature.rms(y=y)[0]
        energy_mean = float(np.mean(rms))
        energy_std  = float(np.std(rms))
        energy_max  = float(np.max(rms))
        # Dynamic range — high = expressive, low = monotone/fatigued
        energy_dyn_range = energy_max / max(energy_mean, 1e-6)

        # 4. Spectral features
        sc  = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        sbw = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        sro = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        s_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        sf_contrast_mean = float(np.mean(s_contrast))

        # 5. Zero-crossing rate (high = consonant-heavy / anxious speech)
        zcr = float(np.mean(librosa.feature.zero_crossing_rate(y)[0]))

        # 6. Speech rate via tempo estimation
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo_val = float(tempo.item() if hasattr(tempo, "item") else tempo)

        # 7. Duration
        duration = float(len(y) / sr)

        # 8. Harmonics-to-noise ratio proxy (spectral flatness)
        flatness = float(np.mean(librosa.feature.spectral_flatness(y=y)))

        return {
            "pitch_mean":       round(pitch_mean, 2),
            "pitch_std":        round(pitch_std, 2),
            "pitch_range":      round(pitch_range, 2),
            "pitch_min":        round(pitch_min, 2),
            "pitch_max":        round(pitch_max, 2),
            "voiced_ratio":     round(voiced_ratio, 3),
            "energy_mean":      round(energy_mean, 6),
            "energy_std":       round(energy_std, 6),
            "energy_max":       round(energy_max, 6),
            "energy_dyn_range": round(energy_dyn_range, 3),
            "spectral_centroid": round(float(np.mean(sc)), 1),
            "spectral_bandwidth":round(float(np.mean(sbw)), 1),
            "spectral_rolloff":  round(float(np.mean(sro)), 1),
            "spectral_contrast": round(sf_contrast_mean, 3),
            "spectral_flatness": round(flatness, 6),
            "zcr":              round(zcr, 6),
            "tempo":            round(tempo_val, 1),
            "mfcc_mean":        mfcc_mean,
            "mfcc_std":         mfcc_std,
            "mfcc_delta":       mfcc_delta,
            "duration":         round(duration, 2),
        }

    except Exception as e:
        print(f"[WARN] Voice feature extraction error: {e}")
        return None


def classify_voice_emotion(features: dict) -> dict:
    """
    Classify emotion from acoustic features using a two-stage approach:

    Stage 1: Determine arousal (high/low) and valence (positive/negative)
             using acoustic thresholds from speech emotion research.
    Stage 2: Fine-tune within the quadrant using secondary features.

    This approach is more robust than flat profile matching because
    arousal and valence map cleanly to acoustic correlates.
    """
    if not features:
        return {"scores": {}, "dominant_emotion": "calm", "intensity": 0.5, "model": "none"}

    pitch   = features.get("pitch_mean", 150.0)
    energy  = features.get("energy_mean", 0.025)
    tempo   = features.get("tempo", 100.0)
    centroid= features.get("spectral_centroid", 2200.0)
    zcr     = features.get("zcr", 0.04)
    pitch_range = features.get("pitch_range", 50.0)
    dyn_range = features.get("energy_dyn_range", 2.0)
    contrast = features.get("spectral_contrast", 18.0)
    pitch_std = features.get("pitch_std", 20.0)
    flatness = features.get("spectral_flatness", 0.01)
    voiced_ratio = features.get("voiced_ratio", 0.5)

    # ── Stage 1: Arousal axis ──
    # Compute arousal score as weighted average of normalized features
    arousal_scores = []
    arousal_scores.append(1.0 if pitch > AROUSAL_THRESHOLDS["pitch_mean"] else
                          pitch / AROUSAL_THRESHOLDS["pitch_mean"])
    arousal_scores.append(1.0 if energy > AROUSAL_THRESHOLDS["energy_mean"] else
                          energy / AROUSAL_THRESHOLDS["energy_mean"])
    arousal_scores.append(min(1.0, tempo / AROUSAL_THRESHOLDS["tempo"]))
    arousal_scores.append(min(1.0, centroid / AROUSAL_THRESHOLDS["spectral_centroid"]))
    arousal_scores.append(min(1.0, zcr / AROUSAL_THRESHOLDS["zcr"]))

    arousal = np.mean(arousal_scores)
    high_arousal = arousal > 0.55  # slightly above midpoint

    # ── Stage 2: Valence axis ──
    # Positive valence correlates with: wider pitch range, more dynamic energy,
    # higher spectral contrast (clearer harmonics), less spectral flatness (noise)
    valence_scores = []
    valence_scores.append(min(1.0, pitch_range / VALENCE_INDICATORS["pitch_range_threshold"]))
    valence_scores.append(min(1.0, dyn_range / VALENCE_INDICATORS["energy_dyn_range_threshold"]))
    valence_scores.append(min(1.0, contrast / VALENCE_INDICATORS["spectral_contrast_threshold"]))
    # Low spectral flatness = tonal/harmonic = positive
    valence_scores.append(max(0.0, 1.0 - flatness * 20))
    # High voiced ratio = more speech = engaged/positive
    valence_scores.append(min(1.0, voiced_ratio / 0.6))

    valence = np.mean(valence_scores)
    positive_valence = valence > 0.5

    # ── Stage 3: Get candidate emotions from quadrant ──
    candidates = EMOTION_MAP[(high_arousal, positive_valence)]

    # ── Stage 4: Score all 8 emotions with quadrant bias ──
    all_emotions = ["happy", "motivated", "calm", "sad", "fatigued", "burned_out", "stressed", "anxious"]

    scores = {}
    for emotion in all_emotions:
        # Base score: distance from the emotion's expected acoustic profile
        score = _emotion_score(emotion, pitch, energy, tempo, centroid, zcr,
                               pitch_range, dyn_range, contrast, pitch_std,
                               voiced_ratio, flatness)

        # Quadrant bonus: +40% if this emotion matches the detected quadrant
        if emotion in candidates:
            score *= 1.4

        scores[emotion] = max(0.0, score)

    # Normalize to probability distribution
    total = sum(scores.values())
    if total > 0:
        scores = {k: round(v / total, 4) for k, v in scores.items()}
    else:
        scores = {k: round(1.0 / len(all_emotions), 4) for k in all_emotions}

    dominant = max(scores, key=scores.get)
    intensity = scores[dominant]

    return {
        "scores": scores,
        "dominant_emotion": dominant,
        "intensity": round(intensity, 4),
        "arousal": round(float(arousal), 3),
        "valence": round(float(valence), 3),
        "quadrant": f"{'high' if high_arousal else 'low'}_arousal_{'positive' if positive_valence else 'negative'}_valence",
        "features_summary": {
            "pitch_hz":      round(pitch, 1),
            "energy_rms":    round(energy, 5),
            "tempo_bpm":     round(tempo, 1),
            "duration_s":    round(features.get("duration", 0), 1),
        },
        "model": "circumplex_v3",
    }


def _emotion_score(emotion, pitch, energy, tempo, centroid, zcr,
                   pitch_range, dyn_range, contrast, pitch_std,
                   voiced_ratio, flatness):
    """
    Compute a raw score for how well the acoustic features match
    the expected profile of a given emotion.

    Uses gaussian similarity with emotion-specific centers and sigmas.
    """
    # Emotion acoustic centers: (pitch_center, energy_center, tempo_center, centroid_center)
    CENTERS = {
        "happy":      (280.0, 0.10,  135.0, 3100.0),
        "motivated":  (220.0, 0.12,  130.0, 2900.0),
        "calm":       (145.0, 0.025,  80.0, 1800.0),
        "fatigued":   (120.0, 0.015,  70.0, 1500.0),
        "sad":        (130.0, 0.018,  75.0, 1400.0),
        "burned_out": (110.0, 0.010,  62.0, 1300.0),
        "stressed":   (230.0, 0.09,  140.0, 2900.0),
        "anxious":    (250.0, 0.07,  150.0, 2700.0),
    }

    # Sigma (spread) per dimension — wider = more tolerant
    SIGMAS = {
        "happy":      (80.0, 0.06,  40.0, 600.0),
        "motivated":  (70.0, 0.06,  35.0, 500.0),
        "calm":       (50.0, 0.015, 25.0, 400.0),
        "fatigued":   (40.0, 0.010, 20.0, 350.0),
        "sad":        (45.0, 0.012, 22.0, 350.0),
        "burned_out": (35.0, 0.008, 18.0, 300.0),
        "stressed":   (70.0, 0.05,  35.0, 500.0),
        "anxious":    (75.0, 0.04,  40.0, 500.0),
    }

    pc, ec, tc, cc = CENTERS[emotion]
    ps, es, ts, cs = SIGMAS[emotion]

    def gauss(val, center, sigma):
        return float(np.exp(-0.5 * ((val - center) / max(sigma, 1e-6)) ** 2))

    # Core dimensions (weighted)
    s = 0.0
    s += 0.25 * gauss(pitch, pc, ps)
    s += 0.25 * gauss(energy, ec, es)
    s += 0.20 * gauss(tempo, tc, ts)
    s += 0.15 * gauss(centroid, cc, cs)

    # Secondary features (15% total)
    if emotion in ("happy", "motivated"):
        # Positive emotions: wide pitch range, high dynamic range, high voiced ratio
        s += 0.05 * min(1.0, pitch_range / 120.0)
        s += 0.05 * min(1.0, dyn_range / 3.5)
        s += 0.05 * min(1.0, voiced_ratio / 0.6)
    elif emotion in ("stressed", "anxious"):
        # Negative high-arousal: high ZCR, high pitch std, moderate flatness
        s += 0.05 * min(1.0, zcr / 0.08)
        s += 0.05 * min(1.0, pitch_std / 50.0)
        s += 0.05 * (1.0 - min(1.0, dyn_range / 4.0))  # less dynamic = more tense
    elif emotion in ("calm",):
        # Calm: low ZCR, moderate voiced ratio, low flatness (tonal)
        s += 0.05 * max(0.0, 1.0 - zcr / 0.08)
        s += 0.05 * min(1.0, voiced_ratio / 0.5)
        s += 0.05 * max(0.0, 1.0 - flatness * 15)
    elif emotion in ("sad", "fatigued", "burned_out"):
        # Low-arousal negative: low pitch range, low dynamic range, low voiced ratio
        s += 0.05 * max(0.0, 1.0 - pitch_range / 100.0)
        s += 0.05 * max(0.0, 1.0 - dyn_range / 3.0)
        s += 0.05 * max(0.0, 1.0 - energy / 0.05)

    return s


def analyze_voice_emotion(audio_bytes: bytes) -> Optional[dict]:
    """
    Full voice emotion analysis pipeline:
    1. Decode audio (WAV / OGG / WebM via ffmpeg)
    2. Extract acoustic features
    3. Classify emotion via circumplex model

    Returns classification dict, or None if audio cannot be processed.
    """
    features = extract_features(audio_bytes)
    if not features:
        return None
    return classify_voice_emotion(features)
