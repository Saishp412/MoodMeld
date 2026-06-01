"""
Mood Prediction Service — Phase 5

Uses statistical analysis and pattern recognition to predict:
- Next-day mood
- Burnout risk probability
- Stress trend direction
- Emotional stability score
- Wellness score

When sufficient data accumulates, the simple model can be upgraded
to a time-series LSTM for sequence prediction.
"""

import numpy as np
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta


# Emotion valence mapping (negative to positive scale)
EMOTION_VALENCE = {
    "happy": 0.9,
    "calm": 0.7,
    "motivated": 0.8,
    "sad": 0.15,
    "anxious": 0.25,
    "stressed": 0.2,
    "burned_out": 0.1,
    "fatigued": 0.3,
}

# Emotion arousal mapping (low to high energy)
EMOTION_AROUSAL = {
    "happy": 0.75,
    "calm": 0.25,
    "motivated": 0.85,
    "sad": 0.2,
    "anxious": 0.8,
    "stressed": 0.7,
    "burned_out": 0.1,
    "fatigued": 0.15,
}


def _entries_to_valence_series(entries: List[dict]) -> np.ndarray:
    """Convert mood entries to a time series of valence scores."""
    if not entries:
        return np.array([0.5])

    scores = []
    for entry in entries:
        emotion = entry.get("final_emotion", "calm")
        confidence = entry.get("emotion_confidence", 0.5)
        valence = EMOTION_VALENCE.get(emotion, 0.5)
        # Weight by confidence
        scores.append(valence * confidence)

    return np.array(scores) if scores else np.array([0.5])


def _calculate_trend(series: np.ndarray, window: int = 5) -> str:
    """Calculate trend direction using linear regression slope."""
    if len(series) < 3:
        return "stable"

    # Use last N points
    recent = series[-min(window, len(series)):]
    x = np.arange(len(recent))

    # Simple linear regression
    slope = np.polyfit(x, recent, 1)[0]

    if slope > 0.02:
        return "rising"
    elif slope < -0.02:
        return "declining"
    else:
        return "stable"


def _weighted_moving_average(series: np.ndarray, weights: Optional[np.ndarray] = None) -> float:
    """Calculate weighted moving average (recent entries weighted more)."""
    if len(series) == 0:
        return 0.5

    if weights is None:
        # Exponentially decaying weights (most recent = highest)
        weights = np.exp(np.linspace(-1, 0, len(series)))

    weights = weights / weights.sum()
    return float(np.dot(series, weights))


def predict_mood(
    entries: List[dict],
    profile: Optional[dict] = None,
    activities: Optional[List[dict]] = None,
) -> dict:
    """
    Predict future mood state and risk factors.

    Args:
        entries: Recent mood entries (sorted by created_at DESC)
        profile: User's profile/onboarding data
        activities: Recent activity logs

    Returns:
        Comprehensive prediction dict
    """
    valence_series = _entries_to_valence_series(entries)

    # ── Predicted Mood ──
    if len(entries) >= 3:
        # Weighted average of recent emotions, biased toward latest
        recent_wma = _weighted_moving_average(valence_series)
        trend = _calculate_trend(valence_series)

        # Adjust prediction based on trend
        trend_adjustment = 0.05 if trend == "rising" else -0.05 if trend == "declining" else 0
        predicted_valence = np.clip(recent_wma + trend_adjustment, 0, 1)

        # Map valence to emotion
        closest_emotion = min(
            EMOTION_VALENCE.items(),
            key=lambda x: abs(x[1] - predicted_valence)
        )[0]

        # Confidence based on consistency
        valence_std = float(np.std(valence_series[-7:])) if len(valence_series) >= 7 else 0.15
        confidence = max(0.5, min(0.95, 1.0 - valence_std * 2))
    else:
        # Cold start — use profile baseline
        base_stress = (profile.get("stress_level", 5) / 10) if profile else 0.5
        predicted_valence = 0.7 - base_stress * 0.3
        closest_emotion = "calm"
        confidence = 0.50
        trend = "stable"

    # ── Burnout Risk ──
    negative_emotions = ["stressed", "burned_out", "fatigued", "anxious"]
    if entries:
        neg_count = sum(
            1 for e in entries[-14:]  # Last 2 weeks
            if e.get("final_emotion") in negative_emotions
        )
        total_recent = min(len(entries), 14)
        neg_ratio = neg_count / max(total_recent, 1)

        # Factor in activity data
        work_overload = 0
        sleep_deficit = 0
        if activities:
            work_entries = [a for a in activities if a.get("type") == "work"]
            sleep_entries = [a for a in activities if a.get("type") == "sleep"]

            if work_entries:
                avg_work = np.mean([a.get("value", 8) for a in work_entries[-7:]])
                work_overload = max(0, (avg_work - 8) / 4)  # Penalty for >8hrs

            if sleep_entries:
                avg_sleep = np.mean([a.get("value", 7) for a in sleep_entries[-7:]])
                sleep_deficit = max(0, (7 - avg_sleep) / 3)  # Penalty for <7hrs

        burnout_risk = np.clip(
            neg_ratio * 0.5 + work_overload * 0.25 + sleep_deficit * 0.25,
            0, 1
        )
    else:
        base_stress = (profile.get("stress_level", 5) / 10) if profile else 0.5
        burnout_risk = base_stress * 0.4

    # ── Emotional Stability ──
    if len(valence_series) >= 5:
        stability = max(0, 100 * (1 - float(np.std(valence_series[-14:])) * 3))
    else:
        stability = 70  # Default

    # ── Stress Trend ──
    stress_entries = [
        1 if e.get("final_emotion") in ["stressed", "anxious", "burned_out"] else 0
        for e in entries[-14:]
    ]
    stress_trend = _calculate_trend(np.array(stress_entries)) if len(stress_entries) >= 3 else "stable"

    # ── Wellness Score (0-100) ──
    wellness = np.clip(
        predicted_valence * 40 +
        (1 - burnout_risk) * 30 +
        stability * 0.3,
        0, 100
    )

    # ── Emotion Distribution (last 7 days) ──
    distribution = {}
    recent_entries = entries[:min(len(entries), 20)]
    for e in recent_entries:
        em = e.get("final_emotion", "calm")
        distribution[em] = distribution.get(em, 0) + 1
    total_dist = sum(distribution.values()) or 1
    distribution = {k: round(v / total_dist, 3) for k, v in distribution.items()}

    return {
        "predicted_mood": closest_emotion,
        "confidence": round(float(confidence), 3),
        "predicted_valence": round(float(predicted_valence), 3),
        "burnout_risk": round(float(burnout_risk), 3),
        "stress_trend": stress_trend,
        "emotional_stability": round(float(stability), 1),
        "wellness_score": round(float(wellness), 1),
        "emotion_distribution": distribution,
        "trend": trend,
        "data_points": len(entries),
        "model": "statistical_v1",
    }
