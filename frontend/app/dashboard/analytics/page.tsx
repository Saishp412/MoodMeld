"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Minus,
  Calendar, Brain, Activity, AlertTriangle,
  Loader2, PieChart, Zap, Heart, Sun, Moon,
  Wind, Download, FileText,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { useAuthStore } from "@/stores/authStore";
import { moodApi, feedbackApi } from "@/lib/api";

const EMOTION_COLORS: Record<string, string> = {
  happy: "#f59e0b", calm: "#06b6d4", sad: "#6366f1", anxious: "#f43f5e",
  stressed: "#ef4444", burned_out: "#78716c", fatigued: "#94a3b8", motivated: "#10b981",
};
const EMOTION_EMOJI: Record<string, string> = {
  happy: "😊", calm: "😌", sad: "😢", anxious: "😰",
  stressed: "😤", burned_out: "😫", fatigued: "😴", motivated: "💪",
};

export default function AnalyticsPage() {
  const { token } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [moodHistory, setMoodHistory] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.allSettled([
      moodApi.getAnalytics(token, period).then(setAnalytics),
      moodApi.getPredictions(token).then(setPredictions),
      feedbackApi.getStats(token).then(setFeedback),
      moodApi.getHistory(token, period).then(setMoodHistory),
    ]).finally(() => setLoading(false));
  }, [token, period]);

  const handleDownload = async () => {
    if (!token) return;
    setDownloading(true);
    try {
      await moodApi.downloadReport(token, period);
    } catch (e) {
      console.error("Report download failed:", e);
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={32} className="animate-spin text-violet-400/40" />
      </div>
    );
  }

  const emotionFreq = analytics?.emotion_frequency || {};
  const totalEntries = analytics?.total_entries || 0;
  const dailyMoods = analytics?.daily_moods || [];
  const dominant = analytics?.dominant_emotion || "calm";

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white/95">Mood Analytics</h1>
          <p className="text-sm text-white/35 mt-1">
            {totalEntries} mood entries analyzed over {period} days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleDownload}
            disabled={downloading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {downloading ? "Generating..." : "Download Report"}
          </motion.button>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                period === d
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                  : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>
      </motion.div>

      {/* Prediction Cards */}
      {predictions && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Predicted Mood",
              value: predictions.predicted_mood,
              display: predictions.predicted_mood?.replace("_", " "),
              icon: Brain,
              color: EMOTION_COLORS[predictions.predicted_mood] || "#8b5cf6",
            },
            {
              label: "Wellness Score",
              value: `${Math.round(predictions.wellness_score || 0)}/100`,
              display: `${Math.round(predictions.wellness_score || 0)}/100`,
              icon: Heart,
              color: (predictions.wellness_score || 0) > 60 ? "#10b981" : "#f59e0b",
            },
            {
              label: "Burnout Risk",
              value: predictions.burnout_risk,
              display: predictions.burnout_risk < 0.3 ? "Low" : predictions.burnout_risk < 0.6 ? "Medium" : "High",
              icon: AlertTriangle,
              color: predictions.burnout_risk < 0.3 ? "#10b981" : predictions.burnout_risk < 0.6 ? "#f59e0b" : "#ef4444",
            },
            {
              label: "Stress Trend",
              value: predictions.stress_trend,
              display: predictions.stress_trend === "rising" ? "Rising ↑" : predictions.stress_trend === "declining" ? "Declining ↓" : "Stable →",
              icon: predictions.stress_trend === "declining" ? TrendingDown : predictions.stress_trend === "rising" ? TrendingUp : Minus,
              color: predictions.stress_trend === "declining" ? "#06b6d4" : predictions.stress_trend === "rising" ? "#f43f5e" : "#94a3b8",
            },
            {
              label: "Stability",
              value: predictions.emotional_stability,
              display: `${Math.round(predictions.emotional_stability || 0)}%`,
              icon: Activity,
              color: "#8b5cf6",
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              className="glass-card p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-3">
                <card.icon size={18} style={{ color: card.color }} strokeWidth={1.5} />
              </div>
              <p className="text-lg font-semibold text-white/85 capitalize">{card.display}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Emotion Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-white/60 mb-5 flex items-center gap-2">
            <PieChart size={16} className="text-violet-400/60" />
            Emotion Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(emotionFreq)
              .sort(([, a]: any, [, b]: any) => b - a)
              .map(([emotion, count]: any, i) => {
                const pct = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
                return (
                  <motion.div
                    key={emotion}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{EMOTION_EMOJI[emotion] || "🤔"}</span>
                        <span className="text-xs text-white/50 capitalize">{emotion.replace("_", " ")}</span>
                      </div>
                      <span className="text-xs text-white/30">{pct}% ({count})</span>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: EMOTION_COLORS[emotion] || "#8b5cf6" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            {Object.keys(emotionFreq).length === 0 && (
              <p className="text-xs text-white/20 text-center py-8">No mood data yet. Start chatting with the AI Companion!</p>
            )}
          </div>
        </div>

        {/* Daily Mood Timeline */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-medium text-white/60 mb-5 flex items-center gap-2">
            <Calendar size={16} className="text-violet-400/60" />
            Daily Mood Timeline
          </h3>
          {dailyMoods.length > 0 ? (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-2">
              {dailyMoods.map((day: any, i: number) => (
                <motion.div
                  key={day.date}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <span className="text-xs text-white/25 w-20 flex-shrink-0">
                    {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${EMOTION_COLORS[day.emotion] || "#8b5cf6"}15` }}
                  >
                    <span className="text-sm">{EMOTION_EMOJI[day.emotion] || "🤔"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/60 capitalize">{day.emotion?.replace("_", " ")}</p>
                    <p className="text-[10px] text-white/20">{day.entry_count} entries • {Math.round(day.avg_confidence * 100)}% confidence</p>
                  </div>
                  <div className="h-2 w-20 bg-white/[0.04] rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${day.avg_confidence * 100}%`,
                        background: EMOTION_COLORS[day.emotion] || "#8b5cf6",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-xs text-white/20">No daily data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Multi-Graph Visualization ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emotion Radar Chart */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-violet-400/60" />
            Emotional Radar
          </h3>
          {Object.keys(emotionFreq).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={Object.entries(emotionFreq).map(([emotion, count]: any) => ({
                emotion: emotion.replace("_", " "),
                value: Math.round((count / totalEntries) * 100),
                fullMark: 100,
              }))}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="emotion"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                  style={{ textTransform: "capitalize" }}
                />
                <PolarRadiusAxis
                  tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 8 }}
                  axisLine={false}
                />
                <Radar
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-xs text-white/20">Log more moods to see radar chart</p>
            </div>
          )}
        </motion.div>

        {/* Emotion Frequency Bar Chart */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-violet-400/60" />
            Emotion Frequency
          </h3>
          {Object.keys(emotionFreq).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={Object.entries(emotionFreq)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([emotion, count]: any) => ({
                  emotion: emotion.replace("_", " "),
                  count,
                  color: EMOTION_COLORS[emotion] || "#8b5cf6",
                }))}
                margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
              >
                <XAxis
                  dataKey="emotion"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,15,25,0.95)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.7)",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {Object.entries(emotionFreq)
                    .sort(([, a]: any, [, b]: any) => b - a)
                    .map(([emotion]: any, i: number) => (
                      <Cell key={i} fill={EMOTION_COLORS[emotion] || "#8b5cf6"} fillOpacity={0.7} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px]">
              <p className="text-xs text-white/20">No data for bar chart</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Mood Confidence Timeline Area Chart */}
      {dailyMoods.length > 1 && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-violet-400/60" />
            Mood Confidence Over Time
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={dailyMoods.slice().reverse().map((d: any) => ({
                date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                confidence: Math.round(d.avg_confidence * 100),
                entries: d.entry_count,
              }))}
              margin={{ top: 5, right: 20, bottom: 5, left: -10 }}
            >
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,25,0.95)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.7)",
                }}
              />
              <Area
                type="monotone"
                dataKey="confidence"
                stroke="#8b5cf6"
                fill="url(#confGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Feedback Accuracy */}
      {feedback && feedback.total_feedback > 0 && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-sm font-medium text-white/60 mb-5">AI Performance (based on your feedback)</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Emotion Accuracy", value: `${feedback.emotion_accuracy}%`, color: "#10b981" },
              { label: "Rec Effectiveness", value: `${feedback.recommendation_effectiveness}%`, color: "#06b6d4" },
              { label: "Response Quality", value: `${feedback.response_helpfulness}%`, color: "#8b5cf6" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[11px] text-white/30 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/15 mt-3 text-center">Based on {feedback.total_feedback} feedback responses</p>
        </motion.div>
      )}
    </div>
  );
}
