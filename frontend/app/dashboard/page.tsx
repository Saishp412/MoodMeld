"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, TrendingUp, TrendingDown, Sun, Moon, Dumbbell,
  Users, Briefcase, Music, Film, BookOpen, Wind, AlertTriangle, Zap,
  ThumbsUp, ThumbsDown, Sparkles, ChevronRight, Plus, Calendar,
  Brain, Heart, Loader2,
} from "lucide-react";
import { VoiceRecorder, VoiceState } from "@/components/shared/VoiceRecorder";
import AnimatedOrb from "@/components/shared/AnimatedOrb";
import { useAuthStore } from "@/stores/authStore";
import { moodApi, conversationsApi, activitiesApi, recommendationsApi, feedbackApi } from "@/lib/api";

// ── Types ──
interface ChatMessage { role: string; content: string; timestamp: string; emotion?: string; }
interface PredictionData { predicted_mood: string; confidence: number; burnout_risk: number; stress_trend: string; emotional_stability: number; wellness_score: number; }
interface MoodEntry { emotion: string; confidence: number; created_at: string; }

// ── Helpers ──
const EMOTION_COLORS: Record<string, string> = {
  happy: "#f59e0b", calm: "#06b6d4", sad: "#6366f1", anxious: "#f43f5e",
  stressed: "#ef4444", burned_out: "#78716c", fatigued: "#94a3b8", motivated: "#10b981",
};
const EMOTION_ICONS: Record<string, typeof Sun> = {
  happy: Sun, calm: Wind, sad: Moon, anxious: AlertTriangle,
  stressed: Zap, burned_out: AlertTriangle, fatigued: Moon, motivated: TrendingUp,
};

// ── Date Display (client-only to avoid hydration mismatch) ──
function DateDisplay() {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }));
  }, []);
  if (!dateStr) return null;
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <Calendar size={14} className="text-white/30" />
      <span className="text-xs text-white/40">{dateStr}</span>
    </div>
  );
}

// ── AI Companion Panel ──
function AICompanionPanel() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm your emotional wellness companion. How are you feeling right now?", timestamp: "Just now" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !token) return;
    const text = input;
    setMessages(m => [...m, { role: "user", content: text, timestamp: "Just now" }]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await conversationsApi.sendMessage(token, text);
      setMessages(m => [...m, {
        role: "assistant", content: res.message, timestamp: "Just now",
        emotion: res.detected_emotion,
      }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "I'm having trouble connecting right now. Please try again.", timestamp: "Just now" }]);
    }
    setIsTyping(false);
  }, [input, token]);

  const handleVoiceResult = useCallback((result: { message: string; detected_emotion: string; emotion_confidence: number }) => {
    setMessages(m => [
      ...m,
      { role: "user", content: "🎤 Voice message", timestamp: "Just now" },
      { role: "assistant", content: result.message, timestamp: "Just now", emotion: result.detected_emotion },
    ]);
  }, []);

  const isVoiceActive = voiceState === "recording" || voiceState === "processing";

  return (
    <div className="glass-card flex flex-col h-[500px]">
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
        <AnimatedOrb size={36} interactive={false} />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white/80">AI Companion</h3>
          <p className={`text-[11px] ${voiceState === "recording" ? "text-red-400/70" : voiceState === "processing" ? "text-violet-400/70" : "text-emerald-400/70"}`}>
            {voiceState === "recording" ? "🎙️ Listening to your voice..." : voiceState === "processing" ? "🧠 Analyzing your mood..." : "Listening actively"}
          </p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/15">
          <Brain size={12} className="text-violet-400" />
          <span className="text-[10px] text-violet-400/80">Empathetic Mode</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-violet-500/20 border border-violet-500/15 rounded-br-md" : "bg-white/[0.03] border border-white/[0.06] rounded-bl-md"}`}>
              <p className="text-sm text-white/70 leading-relaxed">{msg.content}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[10px] text-white/20">{msg.timestamp}</p>
                {msg.emotion && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${EMOTION_COLORS[msg.emotion] || '#8b5cf6'}20`, color: EMOTION_COLORS[msg.emotion] || '#8b5cf6' }}>{msg.emotion}</span>}
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-white/30">
            <div className="flex gap-1">{[0, 1, 2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
            ))}</div>
            <span className="text-[11px]">AI is thinking...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Input bar: dynamically switches between text and voice mode ── */}
      <div className="p-4 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          {/* Voice recorder — compact mic button in idle, expands inline when recording/processing */}
          {token && (
            <VoiceRecorder
              token={token}
              onResult={handleVoiceResult}
              onStateChange={setVoiceState}
              disabled={isTyping}
            />
          )}

          {/* Text input + send button — hidden when voice is active */}
          {!isVoiceActive && (
            <>
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Share how you're feeling... or use the mic"
                className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-violet-500/30" />
              <motion.button onClick={sendMessage} whileTap={{ scale: 0.95 }} aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                <Send size={16} />
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mood Chart (uses real history) ──
function MoodChart({ entries }: { entries: MoodEntry[] }) {
  const chartHeight = 120;
  const VALENCE: Record<string, number> = { happy: 90, motivated: 80, calm: 70, fatigued: 40, stressed: 30, anxious: 25, sad: 20, burned_out: 15 };
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Group entries by day of week
  const byDay = dayLabels.map((label, idx) => {
    const dayEntries = entries.filter(e => new Date(e.created_at).getDay() === (idx + 1) % 7);
    if (dayEntries.length === 0) return { day: label, score: 50, emotion: "calm" };
    const latest = dayEntries[0];
    return { day: label, score: VALENCE[latest.emotion] || 50, emotion: latest.emotion };
  });

  return (
    <div className="flex items-end gap-2 h-[120px] px-2">
      {byDay.map((d, i) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div className="w-full rounded-t-md relative group cursor-pointer"
            style={{ background: `linear-gradient(to top, ${d.score >= 60 ? "#8b5cf6" : d.score >= 40 ? "#3b82f6" : "#f43f5e"}, ${d.score >= 60 ? "#3b82f6" : d.score >= 40 ? "#06b6d4" : "#f59e0b"})` }}
            initial={{ height: 0 }} animate={{ height: `${(d.score / 100) * chartHeight}px` }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap z-10">
              <p className="text-[10px] text-white/70">{d.emotion}: {d.score}%</p>
            </div>
          </motion.div>
          <span className="text-[10px] text-white/25">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ── Prediction Cards ──
function PredictionCards({ data }: { data: PredictionData | null }) {
  if (!data) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card p-4 animate-pulse h-28" />)}</div>;

  const cards = [
    { label: "Next-Day Mood", value: data.predicted_mood, confidence: Math.round(data.confidence * 100), icon: EMOTION_ICONS[data.predicted_mood] || Sun, color: EMOTION_COLORS[data.predicted_mood] || "#8b5cf6", trend: "up" },
    { label: "Burnout Risk", value: data.burnout_risk < 0.3 ? "Low" : data.burnout_risk < 0.6 ? "Medium" : "High", confidence: Math.round((1 - data.burnout_risk) * 100), icon: AlertTriangle, color: data.burnout_risk < 0.3 ? "#10b981" : data.burnout_risk < 0.6 ? "#f59e0b" : "#ef4444", trend: "down" },
    { label: "Stress Trend", value: data.stress_trend === "rising" ? "Rising" : data.stress_trend === "declining" ? "Declining" : "Stable", confidence: 78, icon: data.stress_trend === "declining" ? TrendingDown : TrendingUp, color: data.stress_trend === "declining" ? "#06b6d4" : "#f59e0b", trend: data.stress_trend === "declining" ? "down" : "up" },
    { label: "Wellness", value: `${Math.round(data.wellness_score)}/100`, confidence: Math.round(data.emotional_stability), icon: Heart, color: "#8b5cf6", trend: data.wellness_score > 60 ? "up" : "down" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((p, i) => (
        <motion.div key={p.label} className="glass-card p-4 group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}>
          <div className="flex items-center justify-between mb-3">
            <p.icon size={18} style={{ color: p.color }} strokeWidth={1.5} />
            {p.trend === "up" ? <TrendingUp size={14} className="text-emerald-400/60" /> : <TrendingDown size={14} className="text-cyan-400/60" />}
          </div>
          <p className="text-lg font-semibold text-white/85 capitalize">{p.value}</p>
          <p className="text-[11px] text-white/30 mt-0.5">{p.label}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: p.color }} initial={{ width: 0 }} animate={{ width: `${p.confidence}%` }} transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }} />
            </div>
            <span className="text-[10px] text-white/30">{p.confidence}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Activity Tracker ──
function ActivityTracker() {
  const { token } = useAuthStore();
  const [activities, setActivities] = useState<{icon: typeof Moon; label: string; value: string; target: string; percent: number; color: string}[]>([]);

  useEffect(() => {
    if (!token) return;
    activitiesApi.getToday(token).then((res: any) => {
      const s = res.summary || {};
      setActivities([
        { icon: Moon, label: "Sleep", value: `${s.sleep?.toFixed(1) || "0"} hrs`, target: "8 hrs", percent: ((s.sleep || 0) / 8) * 100, color: "#8b5cf6" },
        { icon: Dumbbell, label: "Exercise", value: `${s.exercise?.toFixed(0) || "0"} min`, target: "60 min", percent: ((s.exercise || 0) / 60) * 100, color: "#10b981" },
        { icon: Briefcase, label: "Work", value: `${s.work?.toFixed(1) || "0"} hrs`, target: "8 hrs", percent: ((s.work || 0) / 8) * 100, color: "#3b82f6" },
        { icon: Users, label: "Social", value: `${s.social?.toFixed(1) || "0"} hrs`, target: "2 hrs", percent: ((s.social || 0) / 2) * 100, color: "#06b6d4" },
      ]);
    }).catch(() => {
      setActivities([
        { icon: Moon, label: "Sleep", value: "-- hrs", target: "8 hrs", percent: 0, color: "#8b5cf6" },
        { icon: Dumbbell, label: "Exercise", value: "-- min", target: "60 min", percent: 0, color: "#10b981" },
        { icon: Briefcase, label: "Work", value: "-- hrs", target: "8 hrs", percent: 0, color: "#3b82f6" },
        { icon: Users, label: "Social", value: "-- hrs", target: "2 hrs", percent: 0, color: "#06b6d4" },
      ]);
    });
  }, [token]);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">Today&apos;s Activity</h3>
        <button className="text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors flex items-center gap-1"><Plus size={12} /> Log</button>
      </div>
      <div className="space-y-4">
        {activities.map((a, i) => (
          <motion.div key={a.label} className="flex items-center gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <a.icon size={16} style={{ color: a.color }} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-white/50">{a.label}</span>
                <span className="text-xs text-white/30">{a.value} / {a.target}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: a.color }} initial={{ width: 0 }} animate={{ width: `${Math.min(a.percent, 100)}%` }} transition={{ duration: 0.8, delay: i * 0.15 }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Recommendation Cards ──
function RecommendationCards() {
  const { token } = useAuthStore();
  const [recs, setRecs] = useState<any[]>([]);
  const iconMap: Record<string, typeof Music> = { music: Music, movie: Film, wellness: Wind, reading: BookOpen };

  useEffect(() => {
    if (!token) return;
    recommendationsApi.getAll(token).then((res: any) => {
      setRecs((res.recommendations || []).slice(0, 4));
    }).catch(() => {});
  }, [token]);

  const fallback = [
    { type: "music", title: "Calming Ambient Mix", subtitle: "Lo-fi beats for relaxation", source: "Curated" },
    { type: "movie", title: "Inside Out 2", subtitle: "An emotional journey of growth", source: "Curated" },
    { type: "wellness", title: "5-Min Breathing", subtitle: "Quick stress relief exercise", source: "MoodMeld" },
    { type: "reading", title: "Emotional Intelligence", subtitle: "By Daniel Goleman", source: "Curated" },
  ];
  const items = recs.length > 0 ? recs : fallback;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">For You</h3>
        <button className="text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors flex items-center gap-1">See all <ChevronRight size={12} /></button>
      </div>
      <div className="space-y-3">
        {items.map((rec: any, i: number) => {
          const Icon = iconMap[rec.type] || Sparkles;
          const color = rec.type === "music" ? "#8b5cf6" : rec.type === "movie" ? "#f43f5e" : rec.type === "wellness" ? "#06b6d4" : "#10b981";
          return (
            <motion.div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-all group"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 truncate group-hover:text-white/90 transition-colors">{rec.title}</p>
                <p className="text-[11px] text-white/25 truncate">{rec.subtitle}</p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/20 flex-shrink-0">{rec.source || rec.type}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Emotional Heatmap ──
const HEATMAP_DATA = [3,2,4,1,3,0,2, 4,0,3,1,2,3,4, 1,3,2,0,4,2,1, 3,4,1,2,0,3,2];
function EmotionalHeatmap() {
  const colors = ["rgba(255,255,255,0.02)", "#6366f120", "#8b5cf640", "#8b5cf680", "#8b5cf6"];
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">Mood Heatmap</h3>
        <span className="text-[11px] text-white/20">Last 4 Weeks</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["M","T","W","T","F","S","S"].map((d, i) => <span key={i} className="text-[9px] text-white/20 text-center mb-1">{d}</span>)}
        {HEATMAP_DATA.map((val, i) => (
          <motion.div key={i} className="aspect-square rounded-sm cursor-pointer hover:scale-110 transition-transform"
            style={{ background: colors[val] }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[9px] text-white/15">Less</span>
        {colors.map((c, i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />)}
        <span className="text-[9px] text-white/15">More</span>
      </div>
    </div>
  );
}

// ── Main Dashboard Page ──
export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.allSettled([
      moodApi.getPredictions(token).then((r: any) => setPredictions(r)),
      moodApi.getHistory(token, 7).then((r: any) => setMoodHistory(r.entries || [])),
    ]).finally(() => setLoading(false));
  }, [token]);

  const handleFeedback = async (positive: boolean) => {
    if (!token) return;
    try { await feedbackApi.submit(token, { emotion_correct: positive }); } catch {}
  };

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-white/95">{greeting}, {user?.name?.split(" ")[0] || "User"}</h1>
            <p className="text-sm text-white/35 mt-1">
              Your emotional wellness score is{" "}
              <span className="text-emerald-400">{predictions ? `${Math.round(predictions.wellness_score)}/100` : "--"}</span>
              {predictions?.stress_trend === "declining" ? " — trending upward" : predictions?.stress_trend === "rising" ? " — needs attention" : " — stable"}
            </p>
          </div>
          <DateDisplay />
        </div>
      </motion.div>

      <PredictionCards data={predictions} />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><AICompanionPanel /></div>
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/60">Weekly Mood</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">7D</span>
            </div>
            {loading ? <div className="h-[120px] flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white/20" /></div> : <MoodChart entries={moodHistory} />}
          </div>
          <ActivityTracker />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <RecommendationCards />
        <EmotionalHeatmap />
      </div>

      <motion.div className="glass-card p-4 flex items-center justify-between" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-violet-400/60" />
          <div>
            <p className="text-sm text-white/60">Was today&apos;s emotion detection accurate?</p>
            <p className="text-[11px] text-white/25">Your feedback helps our AI learn your emotional patterns better</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleFeedback(true)} className="w-9 h-9 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] flex items-center justify-center text-emerald-400/60 hover:text-emerald-400 transition-colors"><ThumbsUp size={14} /></button>
          <button onClick={() => handleFeedback(false)} className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/25 hover:text-white/50 transition-colors"><ThumbsDown size={14} /></button>
        </div>
      </motion.div>
    </div>
  );
}
