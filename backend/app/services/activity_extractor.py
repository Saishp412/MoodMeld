"""
Activity Extractor — Automatically detects and extracts activity mentions
from natural conversation text.

Supports: sleep, exercise, work, social activities.
Uses regex pattern matching for fast, zero-latency extraction.
"""

import re
from typing import List, Dict, Optional


# ── Pattern Definitions ──

# Each pattern group: (compiled_regex, activity_type, value_extractor, unit)
# value_extractor is a function that takes the regex match and returns (value, unit_label)

def _build_patterns():
    """Build compiled regex patterns for activity detection."""
    patterns = []

    # ─── SLEEP PATTERNS ───
    sleep_patterns = [
        # "slept for X hours", "slept X hours", "slept for about X hours"
        (r"(?:i\s+)?slept\s+(?:for\s+)?(?:about\s+|around\s+|roughly\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?|h)\b", "hours"),
        # "slept for X and a half hours"
        (r"(?:i\s+)?slept\s+(?:for\s+)?(\d+)\s+and\s+(?:a\s+)?half\s+(?:hours?|hrs?)", "hours_half"),
        # "got X hours of sleep", "had X hours sleep"
        (r"(?:got|had|managed)\s+(?:about\s+|around\s+|only\s+|roughly\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?)\s*(?:of\s+)?sleep", "hours"),
        # "X hours of sleep"
        (r"(\d+\.?\d*)\s*(?:hours?|hrs?)\s+(?:of\s+)?sleep", "hours"),
        # "slept X minutes", "napped for X minutes"
        (r"(?:slept|napped)\s+(?:for\s+)?(?:about\s+|around\s+)?(\d+)\s*(?:minutes?|mins?|m)\b", "minutes"),
        # "took a X minute nap", "took a nap for X minutes"
        (r"(?:took|had)\s+(?:a\s+)?(?:(\d+)\s*(?:minute?|min)\s+)?nap(?:\s+for\s+(\d+)\s*(?:minutes?|mins?|hours?|hrs?))?", "nap"),
        # "woke up after X hours"
        (r"woke\s+up\s+after\s+(\d+\.?\d*)\s*(?:hours?|hrs?)", "hours"),
        # "in bed for X hours"
        (r"(?:in\s+bed|lying\s+down)\s+(?:for\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?)", "hours"),
    ]
    for pattern, unit in sleep_patterns:
        patterns.append((re.compile(pattern, re.IGNORECASE), "sleep", unit))

    # ─── EXERCISE PATTERNS ───
    exercise_patterns = [
        # "ran for X minutes/hours", "jogged for X minutes"
        (r"(?:ran|jogged|jogging|running)\s+(?:for\s+)?(?:about\s+)?(\d+\.?\d*)\s*(?:minutes?|mins?|m|hours?|hrs?|h)\b", "auto"),
        # "worked out for X minutes/hours", "exercised for X"
        (r"(?:worked\s+out|exercised|training|trained)\s+(?:for\s+)?(?:about\s+)?(\d+\.?\d*)\s*(?:minutes?|mins?|m|hours?|hrs?|h)\b", "auto"),
        # "went to (?:the )?gym for X"
        (r"(?:went\s+to\s+(?:the\s+)?gym|hit\s+the\s+gym)\s+(?:for\s+)?(?:about\s+)?(\d+\.?\d*)\s*(?:minutes?|mins?|m|hours?|hrs?|h)\b", "auto"),
        # "did yoga/pilates/stretching for X"
        (r"(?:did|do|doing)\s+(?:yoga|pilates|stretching|cardio|pushups|situps|weights)\s+(?:for\s+)?(?:about\s+)?(\d+\.?\d*)\s*(?:minutes?|mins?|m|hours?|hrs?|h)\b", "auto"),
        # "walked for X minutes/hours", "hiking for X"
        (r"(?:walked|walking|hiked|hiking|cycling|cycled|biked|biking|swimming|swam)\s+(?:for\s+)?(?:about\s+)?(\d+\.?\d*)\s*(?:minutes?|mins?|m|hours?|hrs?|h)\b", "auto"),
        # "X minute/hour workout", "X min run"
        (r"(\d+\.?\d*)\s*(?:minute?|min|hour)\s+(?:workout|run|jog|walk|swim|bike|ride|session)", "auto"),
        # "went to gym" (without duration, default 60 min)
        (r"(?:went\s+to\s+(?:the\s+)?gym|hit\s+the\s+gym|worked\s+out|exercised)\b(?!\s+(?:for|about|\d))", "default"),
    ]
    for pattern, unit in exercise_patterns:
        patterns.append((re.compile(pattern, re.IGNORECASE), "exercise", unit))

    # ─── WORK PATTERNS ───
    work_patterns = [
        # "worked for X hours", "was working for X hours"
        (r"(?:i\s+)?(?:worked|working|been\s+working)\s+(?:for\s+)?(?:about\s+|around\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?|h)\b", "hours"),
        # "X hours of work"
        (r"(\d+\.?\d*)\s*(?:hours?|hrs?)\s+(?:of\s+)?(?:work|working|office)", "hours"),
        # "at work for X hours", "in office for X hours"
        (r"(?:at\s+work|in\s+(?:the\s+)?office|at\s+(?:the\s+)?office)\s+(?:for\s+)?(?:about\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?|h)\b", "hours"),
        # "spent X hours on work/project/code/study"
        (r"spent\s+(?:about\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?)\s+(?:on\s+)?(?:work|project|coding|studying|homework|assignment)", "hours"),
        # "studied for X hours"
        (r"(?:studied|studying)\s+(?:for\s+)?(?:about\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?|h)\b", "hours"),
    ]
    for pattern, unit in work_patterns:
        patterns.append((re.compile(pattern, re.IGNORECASE), "work", unit))

    # ─── SOCIAL PATTERNS ───
    social_patterns = [
        # "hung out with friends for X hours"
        (r"(?:hung\s+out|hanging\s+out|chilled|chilling)\s+(?:with\s+\w+\s+)?(?:for\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?|h)\b", "hours"),
        # "spent X hours with friends/family"
        (r"spent\s+(?:about\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?)\s+(?:with\s+)?(?:friends?|family|people|colleagues|buddies|mates)", "hours"),
        # "met friends for X hours", "dinner with X for Y hours"
        (r"(?:met|meeting|saw|visited|dinner|lunch|coffee|brunch)\s+(?:with\s+)?(?:\w+\s+)?(?:for\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?|h)\b", "hours"),
        # "talked to X for X hours/minutes"
        (r"(?:talked|chatted|spoke|called|video\s*called)\s+(?:to|with)\s+\w+\s+(?:for\s+)?(\d+\.?\d*)\s*(?:hours?|hrs?|minutes?|mins?)", "auto"),
        # "went out with friends" (default 2 hours)
        (r"(?:went\s+out|going\s+out|hung\s+out|hangout|party|partied)\s+(?:with\s+)?(?:friends?|family|people)\b(?!\s+(?:for|about|\d))", "default"),
    ]
    for pattern, unit in social_patterns:
        patterns.append((re.compile(pattern, re.IGNORECASE), "social", unit))

    return patterns


ACTIVITY_PATTERNS = _build_patterns()


def _detect_unit(text: str, match: re.Match) -> str:
    """Detect whether a matched value is in hours or minutes from the surrounding text."""
    matched_text = match.group(0).lower()
    if any(u in matched_text for u in ["hour", "hrs", "hr", " h "]) or matched_text.endswith("h"):
        return "hours"
    if any(u in matched_text for u in ["minute", "mins", "min", " m "]) or matched_text.endswith("m"):
        return "minutes"
    return "hours"  # default to hours


def _extract_value(match: re.Match, unit_type: str, activity_type: str) -> Optional[float]:
    """Extract the numeric value from a regex match and normalize to the right unit."""

    if unit_type == "default":
        # No number in text — return sensible defaults
        defaults = {"exercise": 60, "social": 2}  # exercise in minutes, social in hours
        return defaults.get(activity_type, 1)

    if unit_type == "hours_half":
        val = float(match.group(1)) + 0.5
        return val

    if unit_type == "nap":
        # "took a X minute nap" or "took a nap for X minutes"
        g1, g2 = match.group(1), match.group(2)
        if g1:
            return float(g1) / 60  # convert nap minutes to hours
        if g2:
            return float(g2) / 60
        return 0.5  # default 30 min nap

    # Standard extraction
    try:
        val = float(match.group(1))
    except (ValueError, IndexError):
        return None

    if unit_type == "auto":
        detected = _detect_unit(match.group(0), match)
        if activity_type == "exercise":
            # Exercise: normalize to minutes
            return val * 60 if detected == "hours" else val
        elif activity_type in ("sleep", "work", "social"):
            # These: normalize to hours
            return val / 60 if detected == "minutes" else val
        return val

    if unit_type == "minutes":
        if activity_type == "sleep":
            return val / 60  # convert to hours for sleep
        return val  # keep minutes for exercise

    # "hours" type
    if activity_type == "exercise":
        return val * 60  # convert hours to minutes for exercise
    return val


def extract_activities(text: str) -> List[Dict]:
    """
    Extract activity mentions from natural text.

    Returns a list of dicts:
        {
            "type": "sleep" | "exercise" | "work" | "social",
            "value": float,
            "unit": str (descriptive),
            "snippet": str (matched text),
            "source": "auto_detected"
        }
    """
    if not text or len(text) < 5:
        return []

    found = []
    seen_types = set()  # Only extract one activity per type per message

    for regex, activity_type, unit_type in ACTIVITY_PATTERNS:
        if activity_type in seen_types:
            continue

        match = regex.search(text)
        if not match:
            continue

        value = _extract_value(match, unit_type, activity_type)
        if value is None or value <= 0:
            continue

        # Sanity bounds
        bounds = {
            "sleep": (0.1, 24),
            "exercise": (1, 480),  # 1 min to 8 hours
            "work": (0.1, 20),
            "social": (0.1, 16),
        }
        lo, hi = bounds.get(activity_type, (0, 100))
        if not (lo <= value <= hi):
            continue

        # Build unit label
        if activity_type == "exercise":
            unit_label = "minutes"
        elif activity_type in ("sleep", "work", "social"):
            unit_label = "hours"
        else:
            unit_label = "units"

        found.append({
            "type": activity_type,
            "value": round(value, 1),
            "unit": unit_label,
            "snippet": match.group(0).strip(),
            "source": "auto_detected",
        })
        seen_types.add(activity_type)

    return found
