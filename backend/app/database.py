"""
MongoDB connection manager using Motor async driver.
"""

import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db():
    """Initialize MongoDB connection."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
        )
        _db = _client[settings.DATABASE_NAME]

        # Test connection with a ping
        await _client.admin.command("ping")
        print(f"[OK] Connected to MongoDB: {settings.DATABASE_NAME}")

        # Create indexes (non-blocking, best-effort)
        try:
            await _db.users.create_index("email", unique=True)
            await _db.mood_entries.create_index([("user_id", 1), ("created_at", -1)])
            await _db.activities.create_index([("user_id", 1), ("date", -1)])
            await _db.conversations.create_index([("user_id", 1), ("created_at", -1)])
            await _db.feedback.create_index("user_id")
            print("[OK] Database indexes created")
        except Exception as e:
            print(f"[WARN] Index creation skipped: {e}")

    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}")
        print("[WARN] Server starting without database - API calls will fail until DB is available")
        print("[INFO] Check: 1) Atlas IP whitelist  2) Cluster not paused  3) Credentials correct")
        # Don't crash the server - allow it to start so healthcheck/docs work
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
        )
        _db = _client[settings.DATABASE_NAME]


async def close_db():
    """Close MongoDB connection."""
    global _client
    if _client:
        _client.close()
        print("[OK] MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    """Get the database instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return _db
