"""Quick accuracy test for emotion engine."""
from app.services.emotion_engine import analyze_text_emotion

tests = [
    ("I am so happy and grateful today!", "happy"),
    ("Feeling very stressed and overwhelmed with work", "stressed"),
    ("I feel calm and peaceful right now", "calm"),
    ("So tired, no energy at all", "fatigued"),
    ("I'm really anxious about tomorrow's exam", "anxious"),
    ("Feeling motivated and ready to take on the world!", "motivated"),
    ("I feel so sad and lonely, missing everyone", "sad"),
    ("Completely burned out, can't do anything anymore", "burned_out"),
]

passed = 0
for text, expected in tests:
    result = analyze_text_emotion(text)
    got = result["dominant_emotion"]
    vader = result["vader"]["compound"]
    ok = "PASS" if got == expected else "MISS"
    if got == expected:
        passed += 1
    print(f"  {ok} | Expected: {expected:10} Got: {got:10} VADER: {vader:+.3f}")

print(f"\nAccuracy: {passed}/{len(tests)} ({passed/len(tests)*100:.0f}%)")
