"""
Feedback routes for the learning system.
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timezone

from app.database import get_db
from app.schemas import FeedbackCreate, FeedbackResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/", response_model=FeedbackResponse, status_code=201)
async def submit_feedback(data: FeedbackCreate, user: dict = Depends(get_current_user)):
    """
    Submit feedback on emotion detection accuracy, recommendation usefulness,
    or AI response quality.
    """
    db = get_db()
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)

    doc = {
        "user_id": user_id,
        "entry_id": data.entry_id,
        "conversation_id": data.conversation_id,
        "emotion_correct": data.emotion_correct,
        "recommendation_useful": data.recommendation_useful,
        "response_helpful": data.response_helpful,
        "comments": data.comments,
        "created_at": now,
    }

    result = await db.feedback.insert_one(doc)

    return FeedbackResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        entry_id=data.entry_id,
        conversation_id=data.conversation_id,
        emotion_correct=data.emotion_correct,
        recommendation_useful=data.recommendation_useful,
        response_helpful=data.response_helpful,
        comments=data.comments,
        created_at=now,
    )


@router.get("/stats")
async def get_feedback_stats(user: dict = Depends(get_current_user)):
    """Get feedback statistics for the current user."""
    db = get_db()
    user_id = str(user["_id"])

    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": None,
                "total": {"$sum": 1},
                "emotion_correct_count": {
                    "$sum": {"$cond": [{"$eq": ["$emotion_correct", True]}, 1, 0]}
                },
                "emotion_incorrect_count": {
                    "$sum": {"$cond": [{"$eq": ["$emotion_correct", False]}, 1, 0]}
                },
                "recommendation_useful_count": {
                    "$sum": {"$cond": [{"$eq": ["$recommendation_useful", True]}, 1, 0]}
                },
                "response_helpful_count": {
                    "$sum": {"$cond": [{"$eq": ["$response_helpful", True]}, 1, 0]}
                },
            }
        },
    ]

    result = await db.feedback.aggregate(pipeline).to_list(1)

    if not result:
        return {
            "total_feedback": 0,
            "emotion_accuracy": 0,
            "recommendation_effectiveness": 0,
            "response_helpfulness": 0,
        }

    stats = result[0]
    total = stats["total"]
    emotion_responses = stats["emotion_correct_count"] + stats["emotion_incorrect_count"]

    return {
        "total_feedback": total,
        "emotion_accuracy": round(
            stats["emotion_correct_count"] / emotion_responses * 100, 1
        ) if emotion_responses > 0 else 0,
        "recommendation_effectiveness": round(
            stats["recommendation_useful_count"] / total * 100, 1
        ) if total > 0 else 0,
        "response_helpfulness": round(
            stats["response_helpful_count"] / total * 100, 1
        ) if total > 0 else 0,
    }
