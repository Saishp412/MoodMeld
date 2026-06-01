"""
Upgraded Emotion Analysis Engine — Phase 5

Combines:
1. VADER sentiment analysis (valence-aware)
2. Enhanced keyword-based emotion classification
3. Intensity and context modifiers
4. Distress detection

In Phase 6, OpenAI API provides an additional classification layer.
"""

import re
from typing import Optional, Tuple, Dict
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize VADER
_vader = SentimentIntensityAnalyzer()

# ── Emotion Keyword Dictionaries (expanded) ──

EMOTION_KEYWORDS: Dict[str, list] = {
    "happy": [
        "happy", "joy", "excited", "great", "wonderful", "amazing", "love",
        "fantastic", "awesome", "delighted", "cheerful", "thrilled", "blessed",
        "grateful", "thankful", "positive", "smile", "laugh", "celebrate",
        "proud", "accomplished", "satisfied", "pleased", "elated", "ecstatic",
        "glad", "content", "euphoric", "overjoyed", "beaming",
    ],
    "calm": [
        "calm", "peaceful", "relaxed", "serene", "tranquil", "content",
        "balanced", "centered", "mindful", "steady", "composed", "quiet",
        "gentle", "soothing", "comfortable", "easy", "rest", "chill",
        "at ease", "grounded", "still", "harmonious",
    ],
    "sad": [
        "sad", "unhappy", "depressed", "down", "miserable", "gloomy",
        "heartbroken", "lonely", "hopeless", "despair", "grief", "loss",
        "crying", "tears", "blue", "melancholy", "empty", "numb",
        "disappointed", "regret", "miss", "alone", "devastated", "sorrow",
        "hurting", "broken", "crushed", "dejected",
    ],
    "anxious": [
        "anxious", "worried", "nervous", "panic", "fear", "dread",
        "uneasy", "restless", "tense", "overthinking", "ruminating",
        "scared", "terrified", "apprehensive", "insecure", "doubt",
        "uncertain", "overwhelmed", "spiraling", "paranoid", "on edge",
        "jittery", "freaking out",
    ],
    "stressed": [
        "stressed", "pressure", "overworked", "deadline", "hectic",
        "chaos", "frantic", "rushed", "burden", "demanding", "intense",
        "struggle", "difficult", "hard", "tough", "swamped", "drowning",
        "exhausting", "no time", "too much", "slammed", "under pressure",
        "stretched thin", "can't keep up",
    ],
    "burned_out": [
        "burnout", "burned out", "exhausted", "drained", "depleted",
        "can't anymore", "giving up", "no energy", "done", "fed up",
        "disconnected", "apathetic", "detached", "no motivation",
        "going through the motions", "zombie", "running on empty",
        "completely spent", "nothing left",
    ],
    "fatigued": [
        "tired", "fatigue", "sleepy", "drowsy", "lethargic", "sluggish",
        "weary", "worn out", "no energy", "can't focus", "brain fog",
        "heavy", "slow", "yawning", "need sleep", "wiped out",
    ],
    "motivated": [
        "motivated", "inspired", "determined", "focused", "energized",
        "driven", "ambitious", "productive", "unstoppable", "fired up",
        "passionate", "goal", "achieve", "progress", "growth",
        "pumped", "ready", "let's go", "crushing it", "on fire",
    ],
}

# Distress detection keywords
DISTRESS_KEYWORDS = [
    "kill myself", "suicide", "end it all", "don't want to live",
    "self harm", "hurt myself", "no reason to live", "better off dead",
    "can't go on", "want to die", "ending my life",
]

# Intensity modifiers
INTENSIFIERS = {
    "very": 1.4, "extremely": 1.6, "so": 1.3, "really": 1.3,
    "incredibly": 1.5, "absolutely": 1.5, "totally": 1.3,
    "deeply": 1.4, "immensely": 1.5, "terribly": 1.4,
    "awfully": 1.3, "super": 1.3,
}
DIMINISHERS = {
    "slightly": 0.5, "a bit": 0.6, "somewhat": 0.7,
    "kind of": 0.6, "a little": 0.6, "barely": 0.4,
    "sort of": 0.6, "mildly": 0.5,
}

# Negation words that flip emotion context
NEGATION_WORDS = [
    "not", "no", "never", "don't", "doesn't", "didn't",
    "won't", "can't", "couldn't", "shouldn't", "isn't",
    "aren't", "wasn't", "weren't", "nor", "neither",
]


def _get_vader_scores(text: str) -> dict:
    """Get VADER sentiment scores for text."""
    scores = _vader.polarity_scores(text)
    return {
        "compound": scores["compound"],  # -1 to 1
        "positive": scores["pos"],
        "negative": scores["neg"],
        "neutral": scores["neu"],
    }


def _map_vader_to_emotions(vader_scores: dict) -> dict:
    """Map VADER sentiment to emotion probability weights."""
    compound = vader_scores["compound"]
    pos = vader_scores["positive"]
    neg = vader_scores["negative"]

    # Initialize all emotions
    emotion_weights = {k: 0.0 for k in EMOTION_KEYWORDS}

    if compound >= 0.5:
        # Strong positive
        emotion_weights["happy"] = 0.45
        emotion_weights["motivated"] = 0.25
        emotion_weights["calm"] = 0.20
    elif compound >= 0.15:
        # Mild positive
        emotion_weights["calm"] = 0.35
        emotion_weights["happy"] = 0.30
        emotion_weights["motivated"] = 0.15
    elif compound <= -0.5:
        # Strong negative
        emotion_weights["sad"] = 0.30
        emotion_weights["stressed"] = 0.25
        emotion_weights["anxious"] = 0.20
        emotion_weights["burned_out"] = 0.10
    elif compound <= -0.15:
        # Mild negative
        emotion_weights["stressed"] = 0.25
        emotion_weights["fatigued"] = 0.20
        emotion_weights["anxious"] = 0.20
        emotion_weights["sad"] = 0.15
    else:
        # Neutral
        emotion_weights["calm"] = 0.40
        emotion_weights["fatigued"] = 0.15

    # Distribute remaining weight
    total = sum(emotion_weights.values())
    if total < 1.0:
        remaining = 1.0 - total
        for k in emotion_weights:
            if emotion_weights[k] == 0:
                emotion_weights[k] = remaining / max(
                    sum(1 for v in emotion_weights.values() if v == 0), 1
                )

    return emotion_weights


def _keyword_analysis(text: str) -> dict:
    """Enhanced keyword-based emotion scoring with context awareness."""
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)

    # Check for negation context
    has_negation = any(neg in text_lower for neg in NEGATION_WORDS)

    scores = {}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = 0.0
        for keyword in keywords:
            if keyword in text_lower:
                # Find keyword position for context analysis
                idx = text_lower.find(keyword)
                context_before = text_lower[max(0, idx - 25):idx]

                # Check for intensity modifiers
                multiplier = 1.0
                for mod, weight in INTENSIFIERS.items():
                    if mod in context_before:
                        multiplier = max(multiplier, weight)
                        break
                for mod, weight in DIMINISHERS.items():
                    if mod in context_before:
                        multiplier = min(multiplier, weight)
                        break

                # Check for local negation
                local_negated = any(
                    neg in context_before for neg in NEGATION_WORDS
                )
                if local_negated:
                    # Flip: if negating positive, boost negative and vice versa
                    multiplier *= 0.2

                score += multiplier

        # Normalize
        max_possible = len(keywords) * 0.4
        scores[emotion] = min(score / max(max_possible, 1), 1.0)

    # Normalize to sum to 1
    total = sum(scores.values())
    if total > 0:
        scores = {k: round(v / total, 4) for k, v in scores.items()}
    else:
        scores = {k: round(1.0 / len(EMOTION_KEYWORDS), 4) for k in EMOTION_KEYWORDS}

    return scores


def analyze_text_emotion(text: str) -> dict:
    """
    Analyze emotional content of text using VADER + keyword analysis fusion.

    Returns comprehensive emotion analysis dict.
    """
    text_lower = text.lower()
    words = re.findall(r'\b\w+\b', text_lower)

    # 1. VADER sentiment analysis
    vader_scores = _get_vader_scores(text)
    vader_emotions = _map_vader_to_emotions(vader_scores)

    # 2. Keyword-based analysis
    keyword_scores = _keyword_analysis(text)

    # 3. Fuse VADER and keyword scores (60% keyword, 40% VADER for emotion specificity)
    fused_scores = {}
    for emotion in EMOTION_KEYWORDS:
        kw = keyword_scores.get(emotion, 0)
        va = vader_emotions.get(emotion, 0)

        # If keywords found strong signal, weight them more
        if kw > 0.15:
            fused_scores[emotion] = 0.7 * kw + 0.3 * va
        else:
            fused_scores[emotion] = 0.4 * kw + 0.6 * va

    # Normalize
    total = sum(fused_scores.values())
    if total > 0:
        fused_scores = {k: round(v / total, 4) for k, v in fused_scores.items()}

    # Determine dominant emotion
    dominant = max(fused_scores, key=fused_scores.get)
    intensity = fused_scores[dominant]

    # Check for distress
    is_distress = any(kw in text_lower for kw in DISTRESS_KEYWORDS)

    return {
        "scores": fused_scores,
        "dominant_emotion": dominant,
        "intensity": round(intensity, 4),
        "is_distress_detected": is_distress,
        "vader": vader_scores,
        "word_count": len(words),
        "model": "vader_keyword_fusion_v2",
    }


def fuse_emotions(
    text_score: Optional[dict] = None,
    voice_score: Optional[dict] = None,
    behavioral_score: Optional[dict] = None,
) -> Tuple[str, float, dict]:
    """
    Fuse emotion scores from multiple modalities using adaptive weighted combination.
    E = alpha*T + beta*V + gamma*B

    Returns: (dominant_emotion, confidence, weights_used)
    """
    alpha = 0.0  # text weight
    beta = 0.0   # voice weight
    gamma = 0.0  # behavioral weight

    available = []
    if text_score and "scores" in text_score:
        available.append("text")
    if voice_score and "scores" in voice_score:
        available.append("voice")
    if behavioral_score and "scores" in behavioral_score:
        available.append("behavioral")

    if not available:
        return "calm", 0.5, {"alpha": 0, "beta": 0, "gamma": 0}

    # Adaptive weights based on available modalities and confidence
    if len(available) == 3:
        alpha, beta, gamma = 0.45, 0.30, 0.25
    elif len(available) == 2:
        if "text" in available and "voice" in available:
            alpha, beta = 0.55, 0.45
        elif "text" in available and "behavioral" in available:
            alpha, gamma = 0.60, 0.40
        else:
            beta, gamma = 0.55, 0.45
    else:
        if "text" in available:
            alpha = 1.0
        elif "voice" in available:
            beta = 1.0
        else:
            gamma = 1.0

    # Boost text weight if distress detected
    if text_score and text_score.get("is_distress_detected"):
        alpha = max(alpha, 0.8)
        beta *= 0.5
        gamma *= 0.5
        # Re-normalize
        total_w = alpha + beta + gamma
        alpha, beta, gamma = alpha / total_w, beta / total_w, gamma / total_w

    # Combine scores
    all_emotions = set()
    if text_score and "scores" in text_score:
        all_emotions.update(text_score["scores"].keys())
    if voice_score and "scores" in voice_score:
        all_emotions.update(voice_score["scores"].keys())
    if behavioral_score and "scores" in behavioral_score:
        all_emotions.update(behavioral_score["scores"].keys())

    fused = {}
    for emotion in all_emotions:
        t = text_score["scores"].get(emotion, 0) if text_score and "scores" in text_score else 0
        v = voice_score["scores"].get(emotion, 0) if voice_score and "scores" in voice_score else 0
        b = behavioral_score["scores"].get(emotion, 0) if behavioral_score and "scores" in behavioral_score else 0
        fused[emotion] = alpha * t + beta * v + gamma * b

    if not fused:
        return "calm", 0.5, {"alpha": alpha, "beta": beta, "gamma": gamma}

    dominant = max(fused, key=fused.get)
    confidence = fused[dominant]

    weights = {"alpha": round(alpha, 3), "beta": round(beta, 3), "gamma": round(gamma, 3)}
    return dominant, round(confidence, 4), weights
