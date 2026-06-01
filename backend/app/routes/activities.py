"""
Activity tracking routes.
"""

from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, date
from bson import ObjectId

from app.database import get_db
from app.schemas import ActivityCreate, ActivityResponse, ActivityType
from app.utils.auth import get_current_user

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.post("/", response_model=ActivityResponse, status_code=201)
async def log_activity(data: ActivityCreate, user: dict = Depends(get_current_user)):
    """Log a new activity (sleep, exercise, work, social, productivity)."""
    db = get_db()
    user_id = str(user["_id"])

    now = datetime.now(timezone.utc)
    activity_date = data.date or date.today().isoformat()

    doc = {
        "user_id": user_id,
        "type": data.type.value,
        "value": data.value,
        "date": activity_date,
        "notes": data.notes,
        "created_at": now,
    }

    result = await db.activities.insert_one(doc)

    return ActivityResponse(
        id=str(result.inserted_id),
        user_id=user_id,
        type=data.type,
        value=data.value,
        date=activity_date,
        notes=data.notes,
        created_at=now,
    )


@router.get("/")
async def get_activities(
    days: int = Query(7, ge=1, le=365),
    type: ActivityType | None = None,
    user: dict = Depends(get_current_user),
):
    """Get activity history, optionally filtered by type."""
    db = get_db()
    user_id = str(user["_id"])

    from datetime import timedelta
    since_date = (date.today() - timedelta(days=days)).isoformat()

    query = {"user_id": user_id, "date": {"$gte": since_date}}
    if type:
        query["type"] = type.value

    cursor = db.activities.find(query).sort("date", -1)

    activities = []
    async for act in cursor:
        activities.append({
            "id": str(act["_id"]),
            "type": act["type"],
            "value": act["value"],
            "date": act["date"],
            "notes": act.get("notes"),
            "created_at": act["created_at"].isoformat(),
        })

    return {"activities": activities, "count": len(activities)}


@router.get("/today")
async def get_today_activities(user: dict = Depends(get_current_user)):
    """Get all activities logged today."""
    db = get_db()
    user_id = str(user["_id"])
    today = date.today().isoformat()

    cursor = db.activities.find({"user_id": user_id, "date": today})

    activities = []
    async for act in cursor:
        activities.append({
            "id": str(act["_id"]),
            "type": act["type"],
            "value": act["value"],
            "notes": act.get("notes"),
        })

    # Calculate summary
    summary = {}
    for act in activities:
        act_type = act["type"]
        if act_type not in summary:
            summary[act_type] = 0
        summary[act_type] += act["value"]

    return {"activities": activities, "summary": summary, "date": today}
