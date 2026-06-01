"""
AI Companion Service — Phase 6

Integrates with OpenAI/Groq API for intelligent, empathetic conversational responses.
Falls back to template-based responses if API key is not configured.
"""

from typing import Optional, List, Dict
from app.config import settings

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Initialize client
_client: Optional[object] = None


def _get_client():
    """Lazy-initialize the OpenAI client."""
    global _client
    if _client is None and OPENAI_AVAILABLE and settings.OPENAI_API_KEY:
        _client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL if settings.OPENAI_BASE_URL else None,
        )
    return _client


# System prompt for empathetic AI companion
SYSTEM_PROMPT = """You are MoodMeld AI — an empathetic, emotionally intelligent wellness companion.

Your core principles:
1. EMPATHY FIRST: Always acknowledge feelings before offering advice. Never dismiss or minimize emotions.
2. ACTIVE LISTENING: Reference what the user said. Show you truly understood their emotional state.
3. INSIGHT-DRIVEN: When you have data about their emotional patterns, reference it naturally (e.g., "I've noticed your mood has been trending upward this week").
4. GENTLE GUIDANCE: Suggest evidence-based coping strategies when appropriate — breathing exercises, journaling, grounding techniques — but never force them.
5. SAFETY-AWARE: If someone expresses suicidal ideation or self-harm intent, immediately provide crisis resources (988 Suicide & Crisis Lifeline, Crisis Text Line: text HOME to 741741).
6. PROFESSIONAL BOUNDARIES: You are not a therapist. Recommend professional help when the situation calls for it.
7. WARM TONE: Be warm, genuine, and human-like. Use a calm, comforting conversational style.

Response guidelines:
- Keep responses concise (2-4 sentences typically)
- Ask one thoughtful follow-up question when appropriate
- Use gentle language, avoid clinical or robotic phrasing
- Reference behavioral data and patterns when available
- End with encouragement or a gentle question to keep the conversation flowing"""

# Distress response (always same regardless of LLM)
DISTRESS_RESPONSE = (
    "I'm deeply concerned about what you've shared, and I want you to know that your life has value. "
    "Please reach out to someone who can help right now:\n\n"
    "- **988 Suicide & Crisis Lifeline**: Call or text 988\n"
    "- **Crisis Text Line**: Text HOME to 741741\n"
    "- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/\n\n"
    "You don't have to face this alone. A trained counselor is available 24/7 and can provide "
    "the support you deserve. I'm here to listen, but please also reach out to a professional."
)

# Fallback templates (used when no API key is configured)
FALLBACK_RESPONSES = {
    "happy": [
        "It's wonderful to hear you're feeling positive! Your energy is contagious. What's been contributing to this great mood?",
        "I can sense your happiness! Savoring these moments helps build emotional resilience. What are you most grateful for today?",
        "Your positive energy is shining through! Studies show that acknowledging good emotions helps sustain them longer.",
    ],
    "calm": [
        "I'm glad you're feeling centered. This sense of calm is a real strength. Would you like to explore what's helping you maintain this peace?",
        "That tranquility you're experiencing is valuable. Your emotional stability score has been improving this week.",
        "A calm mind is a powerful one. This is a great time to set intentions or reflect on your progress.",
    ],
    "sad": [
        "I hear you, and I want you to know that your sadness is valid. You don't have to push through it alone. What's weighing on your heart?",
        "Thank you for trusting me with how you feel. Would it help to talk through what's been on your mind?",
        "I can sense the heaviness in your words. Remember, it's okay to not be okay. Would a gentle breathing exercise help right now?",
    ],
    "anxious": [
        "I understand that anxious feeling. Let's try this together: breathe in for 4 counts, hold for 4, exhale for 6. What specific worries are on your mind?",
        "Anxiety often comes from uncertainty about the future. You're safe right now, in this moment. What would feel most grounding?",
        "Your feelings of anxiety are completely valid. I've noticed your stress indicators have been elevated today. Let's work through this together.",
    ],
    "stressed": [
        "You're carrying a lot right now. What feels like the biggest pressure point for you today?",
        "I notice you've been under significant pressure. Consider a 10-minute break to reset. Sometimes stepping away creates clarity.",
        "Feeling stressed is your mind asking for support. Let's break down what's overwhelming you into smaller, manageable pieces.",
    ],
    "burned_out": [
        "What you're describing sounds like burnout. Your emotional reserves need replenishing. What's one thing you can release today?",
        "Burnout isn't weakness — it's a signal that you've been strong for too long. You deserve rest. What would genuine recovery look like for you?",
        "I hear the exhaustion in your words. Let's find one small way to recharge, even if it's just 15 minutes of doing nothing.",
    ],
    "fatigued": [
        "Your energy seems low, and that's understandable. How's your sleep been lately? That might be a good starting point.",
        "Fatigue affects everything — mood, focus, resilience. Would you like some suggestions for gentle energy-boosting activities?",
        "I can sense the tiredness. Sometimes fatigue is physical, sometimes emotional. Which feels more present for you right now?",
    ],
    "motivated": [
        "Your motivation is inspiring! Channel this energy wisely — what's the most important thing you want to accomplish right now?",
        "I love seeing this drive! Set a clear intention to make the most of this momentum. What's your top priority?",
        "That motivated energy is powerful. Remember to pace yourself — sustainable progress beats burnout every time.",
    ],
}


async def generate_ai_response(
    user_message: str,
    detected_emotion: str,
    emotion_confidence: float,
    is_distress: bool,
    conversation_history: Optional[List[Dict]] = None,
    user_context: Optional[Dict] = None,
) -> dict:
    """
    Generate an empathetic AI response.

    Uses OpenAI/Groq API if configured, otherwise falls back to templates.

    Args:
        user_message: The user's message text
        detected_emotion: Detected emotion from analysis
        emotion_confidence: Confidence of detection
        is_distress: Whether distress was detected
        conversation_history: Previous messages for context
        user_context: User profile/behavioral data for personalization

    Returns:
        dict with message, model used, and metadata
    """
    # Always handle distress first
    if is_distress:
        return {
            "message": DISTRESS_RESPONSE,
            "model": "safety_override",
            "is_distress_detected": True,
        }

    client = _get_client()

    if client:
        return await _generate_llm_response(
            client, user_message, detected_emotion,
            emotion_confidence, conversation_history, user_context
        )
    else:
        return _generate_template_response(detected_emotion, emotion_confidence)


async def _generate_llm_response(
    client,
    user_message: str,
    detected_emotion: str,
    emotion_confidence: float,
    conversation_history: Optional[List[Dict]] = None,
    user_context: Optional[Dict] = None,
) -> dict:
    """Generate response using OpenAI/Groq LLM."""
    try:
        # Build context-aware system message
        context_info = ""
        if user_context:
            context_info += f"\n\nUser context: "
            if user_context.get("wellness_score"):
                context_info += f"Wellness score: {user_context['wellness_score']}/100. "
            if user_context.get("stress_trend"):
                context_info += f"Stress trend: {user_context['stress_trend']}. "
            if user_context.get("sleep_hours"):
                context_info += f"Average sleep: {user_context['sleep_hours']}hrs. "

        emotion_info = (
            f"\n\nDetected emotion in this message: {detected_emotion} "
            f"(confidence: {emotion_confidence:.0%}). "
            f"Respond with empathy appropriate to this emotional state."
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + context_info + emotion_info}
        ]

        # Add conversation history (last 10 messages for context)
        if conversation_history:
            for msg in conversation_history[-10:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", ""),
                })

        # Add current message
        messages.append({"role": "user", "content": user_message})

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=300,
            temperature=0.8,
            presence_penalty=0.3,
            frequency_penalty=0.3,
        )

        ai_message = response.choices[0].message.content

        return {
            "message": ai_message,
            "model": settings.OPENAI_MODEL,
            "is_distress_detected": False,
            "tokens_used": response.usage.total_tokens if response.usage else 0,
        }

    except Exception as e:
        print(f"[WARN] LLM API call failed: {e}")
        # Fallback to templates on API error
        return _generate_template_response(detected_emotion, emotion_confidence)


def _generate_template_response(detected_emotion: str, emotion_confidence: float) -> dict:
    """Fallback template-based response when no API key is configured."""
    import random
    templates = FALLBACK_RESPONSES.get(detected_emotion, FALLBACK_RESPONSES["calm"])
    message = random.choice(templates)

    return {
        "message": message,
        "model": "template_fallback",
        "is_distress_detected": False,
    }
