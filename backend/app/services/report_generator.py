"""
PDF Report Generator — Generates professional mood & activity wellness reports.
Uses ReportLab for PDF generation with custom charts and styling.
"""

import io
import math
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.lib.units import mm, inch
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Table, TableStyle


# ── Color Theme ──
VIOLET = HexColor("#8b5cf6")
BLUE = HexColor("#3b82f6")
CYAN = HexColor("#06b6d4")
EMERALD = HexColor("#10b981")
ROSE = HexColor("#f43f5e")
AMBER = HexColor("#f59e0b")
DARK_BG = HexColor("#0f0f17")
CARD_BG = HexColor("#161621")
TEXT_PRIMARY = HexColor("#f0f0f5")
TEXT_SECONDARY = HexColor("#8888a0")
TEXT_DIM = HexColor("#555570")

EMOTION_COLORS = {
    "happy": AMBER, "calm": CYAN, "sad": HexColor("#6366f1"),
    "anxious": ROSE, "stressed": HexColor("#ef4444"),
    "burned_out": HexColor("#78716c"), "fatigued": HexColor("#94a3b8"),
    "motivated": EMERALD,
}


def _draw_rounded_rect(c, x, y, w, h, r, fill_color):
    """Draw a rounded rectangle."""
    c.setFillColor(fill_color)
    c.setStrokeColor(fill_color)
    c.roundRect(x, y, w, h, r, fill=1, stroke=0)


def _draw_gradient_header(c, width, height):
    """Draw a gradient-style header bar."""
    for i in range(80):
        frac = i / 80
        r = VIOLET.red * (1 - frac) + BLUE.red * frac
        g = VIOLET.green * (1 - frac) + BLUE.green * frac
        b = VIOLET.blue * (1 - frac) + BLUE.blue * frac
        c.setFillColor(Color(r, g, b, 0.9))
        c.rect(0, height - i - 1, width, 1, fill=1, stroke=0)


def _draw_donut_chart(c, cx, cy, radius, data, colors):
    """Draw a donut/pie chart."""
    total = sum(data.values()) if data else 1
    start_angle = 90

    for emotion, count in sorted(data.items(), key=lambda x: -x[1]):
        sweep = (count / total) * 360
        color = colors.get(emotion, VIOLET)
        c.setFillColor(color)
        c.setStrokeColor(DARK_BG)
        c.setLineWidth(2)
        c.wedge(cx - radius, cy - radius, cx + radius, cy + radius,
                start_angle, sweep, fill=1, stroke=1)
        start_angle += sweep

    # Inner circle for donut effect
    inner_r = radius * 0.55
    c.setFillColor(CARD_BG)
    c.circle(cx, cy, inner_r, fill=1, stroke=0)


def _draw_bar_chart(c, x, y, w, h, data, max_val, color):
    """Draw a horizontal bar chart."""
    if not data:
        return
    bar_h = min(18, (h - 10) / len(data))
    gap = 4

    for i, (label, val) in enumerate(data):
        bar_y = y + h - (i + 1) * (bar_h + gap)
        bar_w = (val / max_val) * (w - 80) if max_val > 0 else 0

        # Background bar
        c.setFillColor(HexColor("#1a1a2e"))
        _draw_rounded_rect(c, x + 75, bar_y, w - 80, bar_h, 4, HexColor("#1a1a2e"))

        # Value bar
        if bar_w > 0:
            _draw_rounded_rect(c, x + 75, bar_y, bar_w, bar_h, 4, color)

        # Label
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Helvetica", 8)
        c.drawRightString(x + 70, bar_y + 5, label[:10].capitalize())

        # Value
        c.setFillColor(TEXT_DIM)
        c.setFont("Helvetica", 7)
        c.drawString(x + 80 + bar_w, bar_y + 5, f"{val:.0f}")


def _draw_sparkline(c, x, y, w, h, values, color):
    """Draw a mini sparkline chart."""
    if len(values) < 2:
        return
    max_v = max(values) if max(values) > 0 else 1
    min_v = min(values)
    range_v = max_v - min_v if max_v != min_v else 1

    points = []
    for i, v in enumerate(values):
        px = x + (i / (len(values) - 1)) * w
        py = y + ((v - min_v) / range_v) * h
        points.append((px, py))

    # Draw line
    c.setStrokeColor(color)
    c.setLineWidth(1.5)
    p = c.beginPath()
    p.moveTo(points[0][0], points[0][1])
    for px, py in points[1:]:
        p.lineTo(px, py)
    c.drawPath(p, stroke=1, fill=0)

    # Draw dots at end
    if points:
        lx, ly = points[-1]
        c.setFillColor(color)
        c.circle(lx, ly, 3, fill=1, stroke=0)


def generate_wellness_report(
    user_name: str,
    mood_entries: list,
    activities: list,
    predictions: dict,
    analytics: dict,
) -> bytes:
    """Generate a professional PDF wellness report."""
    buf = io.BytesIO()
    width, height = A4
    c = canvas.Canvas(buf, pagesize=A4)

    # ── PAGE 1: Overview ──

    # Background
    c.setFillColor(DARK_BG)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Gradient header
    _draw_gradient_header(c, width, height)

    # Title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(30, height - 35, "MoodMeld")
    c.setFont("Helvetica", 10)
    c.setFillColor(Color(1, 1, 1, 0.6))
    c.drawString(30, height - 52, "AI-Powered Emotional Wellness Report")

    # Report meta
    c.setFont("Helvetica", 9)
    c.setFillColor(Color(1, 1, 1, 0.4))
    c.drawRightString(width - 30, height - 35, f"Generated: {datetime.now().strftime('%B %d, %Y')}")
    c.drawRightString(width - 30, height - 50, f"Prepared for: {user_name}")

    # ── Summary Cards Row ──
    card_y = height - 165
    card_w = (width - 80) / 4
    card_h = 80

    cards = [
        ("Predicted Mood", (predictions.get("predicted_mood", "calm")).replace("_", " ").title(), VIOLET),
        ("Wellness Score", f"{predictions.get('wellness_score', 0):.0f}/100", EMERALD),
        ("Burnout Risk", f"{predictions.get('burnout_risk', 0)*100:.0f}%", ROSE if predictions.get("burnout_risk", 0) > 0.5 else AMBER),
        ("Stress Trend", predictions.get("stress_trend", "stable").title(), CYAN),
    ]

    for i, (label, value, color) in enumerate(cards):
        cx = 30 + i * (card_w + 6)
        _draw_rounded_rect(c, cx, card_y, card_w, card_h, 8, CARD_BG)

        # Color accent bar
        c.setFillColor(color)
        c.rect(cx, card_y + card_h - 3, card_w, 3, fill=1, stroke=0)

        c.setFont("Helvetica", 8)
        c.setFillColor(TEXT_DIM)
        c.drawString(cx + 12, card_y + card_h - 20, label.upper())

        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(TEXT_PRIMARY)
        c.drawString(cx + 12, card_y + 15, value)

    # ── Emotion Distribution (Donut Chart) ──
    section_y = card_y - 30
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(TEXT_PRIMARY)
    c.drawString(30, section_y, "Emotion Distribution")

    emotion_freq = analytics.get("emotion_frequency", {})
    total_entries = analytics.get("total_entries", 0)

    if emotion_freq:
        donut_cy = section_y - 100
        _draw_rounded_rect(c, 30, donut_cy - 80, width / 2 - 40, 180, 10, CARD_BG)
        _draw_donut_chart(c, 130, donut_cy + 10, 65, emotion_freq, EMOTION_COLORS)

        # Legend
        legend_x = width / 2 + 10
        _draw_rounded_rect(c, legend_x - 10, donut_cy - 80, width / 2 - 20, 180, 10, CARD_BG)

        for i, (emotion, count) in enumerate(sorted(emotion_freq.items(), key=lambda x: -x[1])):
            ly = donut_cy + 60 - i * 22
            pct = (count / total_entries * 100) if total_entries > 0 else 0
            color = EMOTION_COLORS.get(emotion, VIOLET)

            c.setFillColor(color)
            c.circle(legend_x + 8, ly + 3, 4, fill=1, stroke=0)

            c.setFont("Helvetica", 9)
            c.setFillColor(TEXT_PRIMARY)
            c.drawString(legend_x + 20, ly, emotion.replace("_", " ").capitalize())

            c.setFillColor(TEXT_DIM)
            c.drawString(legend_x + 120, ly, f"{pct:.0f}% ({count})")

    # ── Activity Summary ──
    act_y = section_y - 240
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(TEXT_PRIMARY)
    c.drawString(30, act_y, "Activity Summary")

    act_summary = {}
    for act in activities:
        t = act.get("type", "other")
        v = act.get("value", 0)
        if t not in act_summary:
            act_summary[t] = 0
        act_summary[t] += v

    if act_summary:
        _draw_rounded_rect(c, 30, act_y - 120, width - 60, 110, 10, CARD_BG)
        bar_data = [(k, v) for k, v in act_summary.items()]
        max_v = max(v for _, v in bar_data) if bar_data else 1
        _draw_bar_chart(c, 40, act_y - 115, width - 80, 100, bar_data, max_v, VIOLET)

    # ── Mood Timeline (sparkline) ──
    timeline_y = act_y - 170
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(TEXT_PRIMARY)
    c.drawString(30, timeline_y, "Mood Confidence Trend")

    if mood_entries:
        _draw_rounded_rect(c, 30, timeline_y - 80, width - 60, 70, 10, CARD_BG)
        confidences = [e.get("emotion_confidence", 0.5) for e in mood_entries[:30]]
        confidences.reverse()
        _draw_sparkline(c, 50, timeline_y - 70, width - 100, 50, confidences, CYAN)

        c.setFont("Helvetica", 7)
        c.setFillColor(TEXT_DIM)
        c.drawString(50, timeline_y - 78, "Oldest")
        c.drawRightString(width - 50, timeline_y - 78, "Latest")

    # ── Footer ──
    c.setFont("Helvetica", 7)
    c.setFillColor(TEXT_DIM)
    c.drawString(30, 25, "MoodMeld 2.0 - AI-Powered Emotional Wellness Platform")
    c.drawRightString(width - 30, 25, "This report is AI-generated and does not constitute medical advice.")

    # ── PAGE 2: Detailed entries ──
    c.showPage()
    c.setFillColor(DARK_BG)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    _draw_gradient_header(c, width, height)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(30, height - 40, "Detailed Mood Log")
    c.setFont("Helvetica", 9)
    c.setFillColor(Color(1, 1, 1, 0.5))
    c.drawString(30, height - 55, f"Last {min(len(mood_entries), 20)} entries")

    # Table of recent entries
    entry_y = height - 90
    if mood_entries:
        header = ["Date", "Time", "Emotion", "Confidence", "Source"]
        rows = [header]
        for entry in mood_entries[:20]:
            created = entry.get("created_at")
            if isinstance(created, datetime):
                date_str = created.strftime("%b %d")
                time_str = created.strftime("%H:%M")
            else:
                date_str = str(created)[:10]
                time_str = str(created)[11:16]

            rows.append([
                date_str,
                time_str,
                entry.get("final_emotion", "?").replace("_", " ").capitalize(),
                f"{entry.get('emotion_confidence', 0)*100:.0f}%",
                entry.get("source", "manual"),
            ])

        t = Table(rows, colWidths=[70, 50, 100, 70, 80])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), VIOLET),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("TEXTCOLOR", (0, 1), (-1, -1), TEXT_SECONDARY),
            ("BACKGROUND", (0, 1), (-1, -1), CARD_BG),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [CARD_BG, HexColor("#1a1a28")]),
            ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#222233")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))

        tw, th = t.wrap(0, 0)
        t.drawOn(c, 30, entry_y - th)

    # Footer
    c.setFont("Helvetica", 7)
    c.setFillColor(TEXT_DIM)
    c.drawString(30, 25, "MoodMeld 2.0 - Confidential Wellness Report")
    c.drawRightString(width - 30, 25, "Page 2")

    c.save()
    buf.seek(0)
    return buf.read()
