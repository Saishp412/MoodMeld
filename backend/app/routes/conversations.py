"""
Conversational AI routes — handles chat interactions with the AI companion.
Uses Phase 5 emotion engine and Phase 6 LLM integration.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional

from app.database import get_db
from app.schemas import MessageCreate, AIResponse, EmotionCategory
from app.utils.auth import get_current_user
from app.services.emotion_engine import analyze_text_emotion
from app.services.ai_companion import generate_ai_response
from app.services.voice_analysis import analyze_voice_emotion
from app.services.activity_extractor import extract_activities

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.post("/message", response_model=AIResponse)
async def send_message(data: MessageCreate, user: dict = Depends(get_current_user)):
    """
    Send a text message to the AI companion.
    Performs emotion analysis and returns an empathetic response.
    """
    db = get_db()
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)

    # Analyze user's emotion via upgraded engine (VADER + keywords)
    emotion_analysis = analyze_text_emotion(data.content)

    # Get conversation history for context
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    conversation = await db.conversations.find_one({
        "user_id": user_id,
        "created_at": {"$gte": today_start},
    })

    history = []
    if conversation and conversation.get("messages"):
        history = [
            {"role": m["role"], "content": m["content"]}
            for m in conversation["messages"][-10:]
        ]

    # Get user context for personalization
    user_context = {}
    profile = await db.profiles.find_one({"user_id": user_id})
    if profile:
        user_context["sleep_hours"] = profile.get("sleep_hours")
        user_context["stress_level"] = profile.get("stress_level")

    # Get latest prediction data
    from app.services.prediction import predict_mood
    recent_entries = []
    cursor = db.mood_entries.find({"user_id": user_id}).sort("created_at", -1).limit(14)
    async for entry in cursor:
        recent_entries.append(entry)
    if recent_entries:
        pred = predict_mood(recent_entries, profile)
        user_context["wellness_score"] = pred.get("wellness_score")
        user_context["stress_trend"] = pred.get("stress_trend")

    # Generate AI response
    ai_result = await generate_ai_response(
        user_message=data.content,
        detected_emotion=emotion_analysis["dominant_emotion"],
        emotion_confidence=emotion_analysis["intensity"],
        is_distress=emotion_analysis.get("is_distress_detected", False),
        conversation_history=history,
        user_context=user_context,
    )

    # Persist messages
    user_msg = {
        "role": "user",
        "content": data.content,
        "timestamp": now,
        "emotion_detected": emotion_analysis["dominant_emotion"],
        "emotion_confidence": emotion_analysis["intensity"],
    }
    assistant_msg = {
        "role": "assistant",
        "content": ai_result["message"],
        "timestamp": now,
        "emotion_detected": None,
        "model_used": ai_result.get("model", "unknown"),
    }

    if conversation:
        await db.conversations.update_one(
            {"_id": conversation["_id"]},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {"updated_at": now},
            },
        )
    else:
        await db.conversations.insert_one({
            "user_id": user_id,
            "messages": [user_msg, assistant_msg],
            "created_at": now,
            "updated_at": now,
        })

    # Save mood entry for tracking
    await db.mood_entries.insert_one({
        "user_id": user_id,
        "text_input": data.content,
        "text_score": emotion_analysis,
        "voice_score": None,
        "behavioral_score": None,
        "final_emotion": emotion_analysis["dominant_emotion"],
        "emotion_confidence": emotion_analysis["intensity"],
        "fusion_weights": {"alpha": 1.0, "beta": 0.0, "gamma": 0.0},
        "source": "conversation",
        "created_at": now,
    })

    # Auto-extract and log activities from the message
    auto_activities = []
    try:
        extracted = extract_activities(data.content)
        for act in extracted:
            activity_date = now.strftime("%Y-%m-%d")
            await db.activities.insert_one({
                "user_id": user_id,
                "type": act["type"],
                "value": act["value"],
                "date": activity_date,
                "notes": f"Auto-detected from chat: \"{act['snippet']}\"",
                "created_at": now,
            })
            auto_activities.append(act)
        if auto_activities:
            print(f"[INFO] Auto-logged {len(auto_activities)} activities for user {user_id}")
    except Exception as e:
        print(f"[WARN] Activity extraction failed: {e}")

    return AIResponse(
        message=ai_result["message"],
        detected_emotion=emotion_analysis["dominant_emotion"],
        emotion_confidence=emotion_analysis["intensity"],
        is_distress_detected=ai_result.get("is_distress_detected", False),
        auto_logged_activities=auto_activities if auto_activities else None,
    )


@router.post("/voice")
async def send_voice_message(
    audio: UploadFile = File(...),
    transcript: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    """
    Send a voice message to the AI companion.
    Extracts voice emotion features and generates a response.
    Note: Raw audio is processed in-memory and never saved to disk.
    """
    db = get_db()
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)

    # Read audio bytes (privacy: never save raw audio)
    audio_bytes = await audio.read()

    # Analyze voice emotion
    voice_result = analyze_voice_emotion(audio_bytes)

    if voice_result:
        detected_emotion = voice_result["dominant_emotion"]
        confidence = voice_result["intensity"]
    else:
        detected_emotion = "calm"
        confidence = 0.5
        voice_result = {"scores": {}, "model": "none"}

    # Generate AI response based on voice emotion
    actual_message = transcript if transcript else "[Voice message - emotion detected from audio analysis]"
    
    ai_result = await generate_ai_response(
        user_message=actual_message,
        detected_emotion=detected_emotion,
        emotion_confidence=confidence,
        is_distress=False,  # Distress detection is text-only for now
    )

    # Save mood entry
    await db.mood_entries.insert_one({
        "user_id": user_id,
        "text_input": None,
        "text_score": None,
        "voice_score": voice_result,
        "behavioral_score": None,
        "final_emotion": detected_emotion,
        "emotion_confidence": confidence,
        "fusion_weights": {"alpha": 0.0, "beta": 1.0, "gamma": 0.0},
        "source": "voice",
        "created_at": now,
    })

    return {
        "message": ai_result["message"],
        "detected_emotion": detected_emotion,
        "emotion_confidence": confidence,
        "voice_features": voice_result.get("features_summary"),
        "model": voice_result.get("model", "none"),
    }


@router.get("/")
async def get_conversations(
    limit: int = 10,
    user: dict = Depends(get_current_user),
):
    """Get recent conversations."""
    db = get_db()
    user_id = str(user["_id"])

    cursor = db.conversations.find(
        {"user_id": user_id}
    ).sort("created_at", -1).limit(limit)

    conversations = []
    async for conv in cursor:
        conversations.append({
            "id": str(conv["_id"]),
            "message_count": len(conv.get("messages", [])),
            "last_message": conv["messages"][-1]["content"][:100] if conv.get("messages") else "",
            "created_at": conv["created_at"].isoformat(),
            "updated_at": conv["updated_at"].isoformat(),
        })

    return {"conversations": conversations, "count": len(conversations)}


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    """Get a specific conversation with all messages."""
    db = get_db()
    user_id = str(user["_id"])

    conv = await db.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": user_id,
    })

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = []
    for msg in conv.get("messages", []):
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"].isoformat(),
            "emotion_detected": msg.get("emotion_detected"),
        })

    return {
        "id": str(conv["_id"]),
        "messages": messages,
        "created_at": conv["created_at"].isoformat(),
    }
