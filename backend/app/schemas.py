"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Emotion Enums ──

class EmotionCategory(str, Enum):
    HAPPY = "happy"
    CALM = "calm"
    SAD = "sad"
    ANXIOUS = "anxious"
    BURNED_OUT = "burned_out"
    STRESSED = "stressed"
    FATIGUED = "fatigued"
    MOTIVATED = "motivated"


class ActivityType(str, Enum):
    SLEEP = "sleep"
    EXERCISE = "exercise"
    WORK = "work"
    SOCIAL = "social"
    PRODUCTIVITY = "productivity"


class RecommendationType(str, Enum):
    MUSIC = "music"
    MOVIE = "movie"
    PODCAST = "podcast"
    MEDITATION = "meditation"
    ACTIVITY = "activity"
    READING = "reading"


# ── Auth Schemas ──

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    has_completed_onboarding: bool = False


# ── Profile / Onboarding Schemas ──

class OnboardingData(BaseModel):
    sleep_hours: float = Field(7.0, ge=0, le=24)
    stress_level: int = Field(5, ge=1, le=10)
    work_duration: float = Field(8.0, ge=0, le=24)
    exercise_frequency: int = Field(3, ge=0, le=7)
    social_frequency: int = Field(5, ge=1, le=10)
    expressiveness: int = Field(5, ge=1, le=10)
    goals: List[str] = []
    # Optional emotional assessment
    anxiety_level: Optional[int] = Field(None, ge=1, le=5)
    burnout_level: Optional[int] = Field(None, ge=1, le=5)
    motivation_level: Optional[int] = Field(None, ge=1, le=5)
    sleep_quality_level: Optional[int] = Field(None, ge=1, le=5)


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    sleep_hours: float
    stress_level: int
    work_duration: float
    exercise_frequency: int
    social_frequency: int
    expressiveness: int
    goals: List[str]
    anxiety_level: Optional[int] = None
    burnout_level: Optional[int] = None
    motivation_level: Optional[int] = None
    sleep_quality_level: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# ── Mood Entry Schemas ──

class MoodAnalyzeRequest(BaseModel):
    text: Optional[str] = None
    # voice_data would come separately via file upload
    behavioral_scores: Optional[dict] = None


class MoodEntryResponse(BaseModel):
    id: str
    user_id: str
    text_score: Optional[dict] = None
    voice_score: Optional[dict] = None
    behavioral_score: Optional[dict] = None
    final_emotion: EmotionCategory
    emotion_confidence: float
    fusion_weights: dict
    created_at: datetime


# ── Activity Schemas ──

class ActivityCreate(BaseModel):
    type: ActivityType
    value: float
    date: Optional[str] = None  # ISO date string, defaults to today
    notes: Optional[str] = None


class ActivityResponse(BaseModel):
    id: str
    user_id: str
    type: ActivityType
    value: float
    date: str
    notes: Optional[str] = None
    created_at: datetime


# ── Conversation Schemas ──

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class ConversationMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    emotion_detected: Optional[EmotionCategory] = None


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    messages: List[ConversationMessage]
    created_at: datetime
    updated_at: datetime


class AIResponse(BaseModel):
    message: str
    detected_emotion: EmotionCategory
    emotion_confidence: float
    is_distress_detected: bool = False
    recommendations: Optional[List[dict]] = None
    auto_logged_activities: Optional[List[dict]] = None


# ── Feedback Schemas ──

class FeedbackCreate(BaseModel):
    entry_id: Optional[str] = None
    conversation_id: Optional[str] = None
    emotion_correct: Optional[bool] = None
    recommendation_useful: Optional[bool] = None
    response_helpful: Optional[bool] = None
    comments: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    entry_id: Optional[str] = None
    conversation_id: Optional[str] = None
    emotion_correct: Optional[bool] = None
    recommendation_useful: Optional[bool] = None
    response_helpful: Optional[bool] = None
    comments: Optional[str] = None
    created_at: datetime


# ── Recommendation Schemas ──

class RecommendationResponse(BaseModel):
    id: str
    type: RecommendationType
    title: str
    subtitle: str
    source: Optional[str] = None
    url: Optional[str] = None
    mood_context: EmotionCategory
    created_at: datetime


# ── Analytics Schemas ──

class MoodHistoryPoint(BaseModel):
    date: str
    emotion: EmotionCategory
    score: float
    confidence: float


class PredictionResponse(BaseModel):
    predicted_mood: EmotionCategory
    confidence: float
    burnout_risk: float
    stress_trend: str  # "rising", "stable", "declining"
    emotional_stability: float
    wellness_score: float


class AnalyticsResponse(BaseModel):
    mood_history: List[MoodHistoryPoint]
    predictions: PredictionResponse
    activity_correlations: dict
    recommendation_effectiveness: float


# Fix forward reference
TokenResponse.model_rebuild()
