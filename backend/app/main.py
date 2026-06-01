"""
MoodMeld 2.0 — FastAPI Backend Application

AI-Powered Conversational Emotional Wellness and Mood Prediction Platform.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_db, close_db
from app.routes import auth, profile, mood, activities, conversations, feedback, recommendations


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    await connect_db()
    print(f"[START] {settings.APP_NAME} API starting...")
    yield
    # Shutdown
    await close_db()
    print(f"[STOP] {settings.APP_NAME} API shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered emotional wellness platform with conversational AI, "
        "emotion analysis, mood prediction, and personalized recommendations."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register Routes ──

app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(mood.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(conversations.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")


# ── Health Check ──

@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "2.0.0",
        "status": "healthy",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from app.database import get_db
    try:
        db = get_db()
        # Ping MongoDB to verify connection
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status,
        "version": "2.0.0",
    }
