"""
Voice analysis pipeline test.
Generates a synthetic audio signal (mimicking different emotional tones)
and verifies the full analyze_voice_emotion pipeline works end-to-end.
"""
import io
import struct
import math
import wave
import sys

# Must run from backend/ dir
sys.path.insert(0, ".")

def make_wav_bytes(freq_hz: float, duration_s: float = 2.0, sample_rate: int = 16000, amplitude: float = 0.6) -> bytes:
    """Generate a pure sine wave WAV file in memory."""
    n_samples = int(sample_rate * duration_s)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        for i in range(n_samples):
            val = int(32767 * amplitude * math.sin(2 * math.pi * freq_hz * i / sample_rate))
            wf.writeframes(struct.pack("<h", val))
    return buf.getvalue()


def run_tests():
    from app.services.voice_analysis import extract_features, classify_voice_emotion, analyze_voice_emotion

    print("=" * 55)
    print("  Voice Emotion Analysis — Pipeline Test")
    print("=" * 55)

    # Test cases: (label, freq_hz, amplitude, duration)
    # High freq + high energy → happy/motivated
    # Low freq + low energy → calm/fatigued/sad
    test_cases = [
        ("High-energy, high-pitch (happy/motivated)",  350.0, 0.85, 2.5),
        ("Low-pitch, very quiet (sad/burned_out)",      95.0, 0.08, 2.0),
        ("Mid-pitch, moderate energy (calm)",          140.0, 0.25, 2.0),
        ("High-pitch, high energy (stressed/anxious)", 280.0, 0.75, 2.0),
        ("Very low, almost silent (fatigued)",          85.0, 0.05, 2.5),
    ]

    all_pass = True
    for label, freq, amp, dur in test_cases:
        wav_bytes = make_wav_bytes(freq, dur, amplitude=amp)
        result = analyze_voice_emotion(wav_bytes)

        if result is None:
            print(f"\n  FAIL | {label}")
            print(f"       -> Pipeline returned None (decode/feature error)")
            all_pass = False
            continue

        emotion  = result["dominant_emotion"]
        conf     = result["intensity"]
        features = result.get("features_summary", {})

        print(f"\n  OK   | {label}")
        print(f"         Detected : {emotion}  ({conf:.1%} confidence)")
        print(f"         Pitch    : {features.get('pitch_hz', '?')} Hz")
        print(f"         Energy   : {features.get('energy_rms', '?')}")
        print(f"         Tempo    : {features.get('tempo_bpm', '?')} BPM")
        print(f"         Duration : {features.get('duration_s', '?')}s")
        top3 = sorted(result["scores"].items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"         Top-3    : {', '.join(f'{e}={v:.2f}' for e,v in top3)}")

    print("\n" + "=" * 55)
    if all_pass:
        print("  ALL TESTS PASSED — voice pipeline is operational")
    else:
        print("  SOME TESTS FAILED — check output above")
    print("=" * 55)


if __name__ == "__main__":
    run_tests()
