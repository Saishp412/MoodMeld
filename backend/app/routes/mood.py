"""
Mood analysis and emotion processing routes — Phase 5 upgrade.
Uses VADER + keyword fusion engine and prediction service.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from app.database import get_db
from app.schemas import MoodAnalyzeRequest, MoodEntryResponse
from app.utils.auth import get_current_user
from app.services.emotion_engine import analyze_text_emotion, fuse_emotions
from app.services.prediction import predict_mood
from app.services.report_generator import generate_wellness_report

router = APIRouter(prefix="/mood", tags=["Mood Analysis"])


@router.post("/analyze", response_model=MoodEntryResponse)
async def analyze_mood(data: MoodAnalyzeRequest, user: dict = Depends(get_current_user)):
    """
    Analyze mood from text and behavioral data.
    Returns fused emotional classification using VADER + keyword engine.
    """
    db = get_db()
    user_id = str(user["_id"])

    # Analyze text emotion (upgraded VADER + keyword fusion)
    text_score = None
    if data.text:
        text_score = analyze_text_emotion(data.text)

    # Voice score comes from /conversations/voice endpoint
    voice_score = None

    # Behavioral score from activity data
    behavioral_score = data.behavioral_scores

    # Fuse emotion scores
    final_emotion, confidence, weights = fuse_emotions(
        text_score=text_score,
        voice_score=voice_score,
        behavioral_score=behavioral_score,
    )

    # Save mood entry
    now = datetime.now(timezone.utc)
    entry_doc = {
        "user_id": user_id,
        "text_input": data.text,
        "text_score": text_score,
        "voice_score": voice_score,
        "behavioral_score": behavioral_score,
        "final_emotion": final_emotion,
        "emotion_confidence": confidence,
        "fusion_weights": weights,
        "created_at": now,
    }

    result = await db.mood_entries.insert_one(entry_doc)

    return MoodEntryResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        text_score=text_score,
        voice_score=voice_score,
        behavioral_score=behavioral_score,
        final_emotion=final_emotion,
        emotion_confidence=confidence,
        fusion_weights=weights,
        created_at=now,
    )


@router.get("/history")
async def get_mood_history(
    days: int = Query(7, ge=1, le=365),
    user: dict = Depends(get_current_user),
):
    """Get mood history for the specified number of days."""
    db = get_db()
    user_id = str(user["_id"])
    since = datetime.now(timezone.utc) - timedelta(days=days)

    cursor = db.mood_entries.find(
        {"user_id": user_id, "created_at": {"$gte": since}},
    ).sort("created_at", -1)

    entries = []
    async for entry in cursor:
        entries.append({
            "id": str(entry["_id"]),
            "emotion": entry["final_emotion"],
            "confidence": entry["emotion_confidence"],
            "text_score": entry.get("text_score"),
            "vader": entry.get("text_score", {}).get("vader") if entry.get("text_score") else None,
            "source": entry.get("source", "direct"),
            "created_at": entry["created_at"].isoformat(),
        })

    return {"entries": entries, "count": len(entries), "days": days}


@router.get("/predictions")
async def get_predictions(user: dict = Depends(get_current_user)):
    """
    Get mood predictions using the statistical prediction service.
    """
    db = get_db()
    user_id = str(user["_id"])
    week_ago = datetime.now(timezone.utc) - timedelta(days=14)

    # Get recent mood entries
    entries = []
    cursor = db.mood_entries.find(
        {"user_id": user_id, "created_at": {"$gte": week_ago}},
    ).sort("created_at", -1).limit(50)
    async for entry in cursor:
        entries.append(entry)

    # Get profile
    profile = await db.profiles.find_one({"user_id": user_id})

    # Get recent activities
    activities = []
    act_cursor = db.activities.find(
        {"user_id": user_id},
    ).sort("date", -1).limit(30)
    async for act in act_cursor:
        activities.append(act)

    # Run prediction model
    predictions = predict_mood(entries, profile, activities)

    return predictions


@router.get("/analytics")
async def get_analytics(
    days: int = Query(30, ge=7, le=365),
    user: dict = Depends(get_current_user),
):
    """
    Get comprehensive mood analytics dashboard data.
    """
    db = get_db()
    user_id = str(user["_id"])
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Mood history
    entries = []
    cursor = db.mood_entries.find(
        {"user_id": user_id, "created_at": {"$gte": since}},
    ).sort("created_at", 1)  # ascending for timeline
    async for entry in cursor:
        entries.append(entry)

    # Emotion frequency
    emotion_freq = {}
    daily_scores = {}
    for entry in entries:
        emotion = entry.get("final_emotion", "calm")
        emotion_freq[emotion] = emotion_freq.get(emotion, 0) + 1

        date_key = entry["created_at"].strftime("%Y-%m-%d")
        if date_key not in daily_scores:
            daily_scores[date_key] = []
        daily_scores[date_key].append({
            "emotion": emotion,
            "confidence": entry.get("emotion_confidence", 0.5),
        })

    # Daily dominant emotion
    daily_moods = []
    for date, scores in sorted(daily_scores.items()):
        # Most frequent emotion of the day
        freq = {}
        total_conf = 0
        for s in scores:
            freq[s["emotion"]] = freq.get(s["emotion"], 0) + 1
            total_conf += s["confidence"]
        dominant = max(freq, key=freq.get) if freq else "calm"
        daily_moods.append({
            "date": date,
            "emotion": dominant,
            "entry_count": len(scores),
            "avg_confidence": round(total_conf / len(scores), 3) if scores else 0,
        })

    # Activity correlations
    activities = []
    act_cursor = db.activities.find(
        {"user_id": user_id, "created_at": {"$gte": since}},
    )
    async for act in act_cursor:
        activities.append(act)

    # Feedback stats
    feedback_cursor = db.feedback.find({"user_id": user_id})
    feedback_count = 0
    emotion_correct = 0
    async for fb in feedback_cursor:
        feedback_count += 1
        if fb.get("emotion_correct"):
            emotion_correct += 1

    return {
        "period_days": days,
        "total_entries": len(entries),
        "emotion_frequency": emotion_freq,
        "daily_moods": daily_moods,
        "dominant_emotion": max(emotion_freq, key=emotion_freq.get) if emotion_freq else "calm",
        "feedback_accuracy": round(emotion_correct / feedback_count * 100, 1) if feedback_count > 0 else None,
        "activity_count": len(activities),
    }


@router.get("/report")
async def download_report(
    days: int = Query(30, ge=7, le=365),
    user: dict = Depends(get_current_user),
):
    """Generate and download a PDF wellness report."""
    db = get_db()
    user_id = str(user["_id"])
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Gather mood entries
    mood_entries = []
    cursor = db.mood_entries.find(
        {"user_id": user_id, "created_at": {"$gte": since}}
    ).sort("created_at", -1)
    async for entry in cursor:
        mood_entries.append(entry)

    # Gather activities
    from datetime import date as date_type
    since_date = (date_type.today() - timedelta(days=days)).isoformat()
    activities = []
    act_cursor = db.activities.find(
        {"user_id": user_id, "date": {"$gte": since_date}}
    )
    async for act in act_cursor:
        activities.append(act)

    # Get profile + predictions
    profile = await db.profiles.find_one({"user_id": user_id})
    predictions = predict_mood(mood_entries, profile)

    # Build analytics summary
    emotion_freq = {}
    for entry in mood_entries:
        em = entry.get("final_emotion", "calm")
        emotion_freq[em] = emotion_freq.get(em, 0) + 1

    analytics = {
        "total_entries": len(mood_entries),
        "emotion_frequency": emotion_freq,
    }

    user_name = user.get("name", "User")
    pdf_bytes = generate_wellness_report(
        user_name=user_name,
        mood_entries=mood_entries,
        activities=activities,
        predictions=predictions,
        analytics=analytics,
    )

    filename = f"MoodMeld_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
