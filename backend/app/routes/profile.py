"""
Profile & onboarding routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId

from app.database import get_db
from app.schemas import OnboardingData, ProfileResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/onboarding", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def complete_onboarding(data: OnboardingData, user: dict = Depends(get_current_user)):
    """Save onboarding data and create user profile."""
    db = get_db()
    user_id = str(user["_id"])

    # Check if profile already exists
    existing = await db.profiles.find_one({"user_id": user_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Onboarding already completed",
        )

    now = datetime.now(timezone.utc)
    profile_doc = {
        "user_id": user_id,
        "sleep_hours": data.sleep_hours,
        "stress_level": data.stress_level,
        "work_duration": data.work_duration,
        "exercise_frequency": data.exercise_frequency,
        "social_frequency": data.social_frequency,
        "expressiveness": data.expressiveness,
        "goals": data.goals,
        "anxiety_level": data.anxiety_level,
        "burnout_level": data.burnout_level,
        "motivation_level": data.motivation_level,
        "sleep_quality_level": data.sleep_quality_level,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.profiles.insert_one(profile_doc)
    profile_doc["_id"] = result.inserted_id

    # Mark user as onboarded
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"has_completed_onboarding": True, "updated_at": now}},
    )

    return ProfileResponse(
        id=str(result.inserted_id),
        **{k: v for k, v in profile_doc.items() if k not in ("_id",)},
    )


@router.get("/", response_model=ProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    db = get_db()
    user_id = str(user["_id"])

    profile = await db.profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Complete onboarding first.",
        )

    return ProfileResponse(
        id=str(profile["_id"]),
        **{k: v for k, v in profile.items() if k not in ("_id",)},
    )


@router.put("/", response_model=ProfileResponse)
async def update_profile(data: OnboardingData, user: dict = Depends(get_current_user)):
    """Update the current user's profile."""
    db = get_db()
    user_id = str(user["_id"])

    now = datetime.now(timezone.utc)
    update_data = {
        "sleep_hours": data.sleep_hours,
        "stress_level": data.stress_level,
        "work_duration": data.work_duration,
        "exercise_frequency": data.exercise_frequency,
        "social_frequency": data.social_frequency,
        "expressiveness": data.expressiveness,
        "goals": data.goals,
        "anxiety_level": data.anxiety_level,
        "burnout_level": data.burnout_level,
        "motivation_level": data.motivation_level,
        "sleep_quality_level": data.sleep_quality_level,
        "updated_at": now,
    }

    result = await db.profiles.find_one_and_update(
        {"user_id": user_id},
        {"$set": update_data},
        return_document=True,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return ProfileResponse(
        id=str(result["_id"]),
        **{k: v for k, v in result.items() if k not in ("_id",)},
    )
