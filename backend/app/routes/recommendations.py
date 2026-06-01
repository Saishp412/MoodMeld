"""
Recommendation routes — Phase 6 upgrade.
Uses Spotify + TMDB APIs with curated fallbacks.
"""

from fastapi import APIRouter, Depends

from app.database import get_db
from app.utils.auth import get_current_user
from app.services.integrations import get_all_recommendations

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/")
async def get_recommendations(user: dict = Depends(get_current_user)):
    """
    Get personalized recommendations from all sources (Spotify, TMDB, wellness).
    Automatically falls back to curated content if API keys aren't configured.
    """
    db = get_db()
    user_id = str(user["_id"])

    # Get the most recent mood entry
    latest_entry = await db.mood_entries.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )

    # Determine current mood
    if latest_entry:
        current_mood = latest_entry.get("final_emotion", "calm")
    else:
        profile = await db.profiles.find_one({"user_id": user_id})
        if profile and profile.get("stress_level", 5) > 6:
            current_mood = "stressed"
        else:
            current_mood = "calm"

    # Get recommendations from all sources
    result = await get_all_recommendations(current_mood)

    return result
