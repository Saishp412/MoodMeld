"""Quick end-to-end API test."""
import httpx

base = "http://localhost:8000/api"

# 1. Register
print("=== Register ===")
r = httpx.post(f"{base}/auth/register", json={"name": "Test User", "email": "test@moodmeld.com", "password": "TestPass123!"})
if r.status_code == 201:
    data = r.json()
    token = data["access_token"]
    user = data["user"]
    print(f"User: {user['name']} ({user['email']})")
elif r.status_code == 409:
    print("User exists, logging in...")
    r = httpx.post(f"{base}/auth/login", json={"email": "test@moodmeld.com", "password": "TestPass123!"})
    data = r.json()
    token = data["access_token"]
    print(f"Logged in: {data['user']['name']}")
else:
    print(f"Error: {r.status_code} {r.text}")
    exit()

headers = {"Authorization": f"Bearer {token}"}

# 2. Mood analysis - happy
print("\n=== Mood Analysis (Happy) ===")
r = httpx.post(f"{base}/mood/analyze", json={"text": "I had a wonderful day! Feeling grateful and happy."}, headers=headers)
mood = r.json()
print(f"Emotion: {mood['final_emotion']}")
print(f"Confidence: {mood['emotion_confidence']}")
print(f"VADER: {mood['text_score']['vader']['compound']}")

# 3. Mood analysis - stressed
print("\n=== Mood Analysis (Stressed) ===")
r = httpx.post(f"{base}/mood/analyze", json={"text": "So stressed about deadlines. Overwhelmed and anxious."}, headers=headers)
mood2 = r.json()
print(f"Emotion: {mood2['final_emotion']}")
print(f"Confidence: {mood2['emotion_confidence']}")

# 4. AI Companion chat
print("\n=== AI Companion ===")
r = httpx.post(f"{base}/conversations/message", json={"content": "I feel really tired and unmotivated today."}, headers=headers)
chat = r.json()
print(f"Detected: {chat['detected_emotion']}")
print(f"AI says: {chat['message'][:120]}...")

# 5. Recommendations
print("\n=== Recommendations ===")
r = httpx.get(f"{base}/recommendations/", headers=headers)
recs = r.json()
print(f"Mood context: {recs['mood_context']}")
print(f"Sources: {recs['sources']}")
for rec in recs["recommendations"][:3]:
    print(f"  [{rec['type']}] {rec['title']}")

# 6. Predictions
print("\n=== Predictions ===")
r = httpx.get(f"{base}/mood/predictions", headers=headers)
pred = r.json()
print(f"Predicted: {pred['predicted_mood']} (conf: {pred['confidence']})")
print(f"Burnout risk: {pred['burnout_risk']}")
print(f"Stress trend: {pred['stress_trend']}")
print(f"Wellness: {pred['wellness_score']}")
print(f"Model: {pred['model']}")

print("\n=== ALL TESTS PASSED ===")
