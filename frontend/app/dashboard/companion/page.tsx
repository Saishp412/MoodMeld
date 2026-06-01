"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Mic, MicOff, Brain, Sparkles, AlertTriangle,
  Sun, Moon, Wind, Zap, TrendingUp, Clock, MessageCircle,
  Activity, Check,
} from "lucide-react";
import AnimatedOrb from "@/components/shared/AnimatedOrb";
import { useAuthStore } from "@/stores/authStore";
import { conversationsApi, moodApi } from "@/lib/api";

// ── Types ──
interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
  emotion?: string;
  confidence?: number;
}
interface AutoActivity {
  type: string;
  value: number;
  unit: string;
  snippet: string;
}

const ACTIVITY_ICONS: Record<string, string> = {
  sleep: "🛌", exercise: "🏃", work: "💼", social: "👥",
};

// ── Helpers ──
const EMOTION_COLORS: Record<string, string> = {
  happy: "#f59e0b", calm: "#06b6d4", sad: "#6366f1", anxious: "#f43f5e",
  stressed: "#ef4444", burned_out: "#78716c", fatigued: "#94a3b8", motivated: "#10b981",
};
const EMOTION_EMOJI: Record<string, string> = {
  happy: "😊", calm: "😌", sad: "😢", anxious: "😰",
  stressed: "😤", burned_out: "😫", fatigued: "😴", motivated: "💪",
};

// ── Quick prompts ──
const QUICK_PROMPTS = [
  { text: "How am I doing emotionally?", icon: Brain },
  { text: "I'm feeling stressed about work", icon: Zap },
  { text: "Help me relax", icon: Wind },
  { text: "I need motivation", icon: TrendingUp },
];

export default function CompanionPage() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! 👋 I'm your AI emotional wellness companion. I'm here to listen, understand, and support you. How are you feeling right now? You can type freely, use the quick prompts below, or just share whatever's on your mind.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [autoActivities, setAutoActivities] = useState<AutoActivity[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation history
  useEffect(() => {
    if (!token) return;
    conversationsApi.getAll(token, 1).then((res: any) => {
      if (res.conversations?.length > 0) {
        const latest = res.conversations[0];
        conversationsApi.getById(token, latest.id).then((conv: any) => {
          if (conv.messages?.length > 0) {
            const loaded: ChatMessage[] = conv.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              emotion: m.emotion_detected || undefined,
            }));
            setMessages([
              {
                role: "assistant",
                content: "Welcome back! Here's our recent conversation. Feel free to continue where we left off. 💜",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
              ...loaded,
            ]);
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [token]);

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || !token) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((m) => [
      ...m,
      { role: "user", content: messageText, timestamp: now },
    ]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await conversationsApi.sendMessage(token, messageText);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.message,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          emotion: res.detected_emotion,
          confidence: res.emotion_confidence,
        },
      ]);
      setCurrentMood(res.detected_emotion);

      // Show auto-logged activities
      if (res.auto_logged_activities?.length) {
        setAutoActivities(res.auto_logged_activities);
        setTimeout(() => setAutoActivities([]), 6000);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment. 🔄",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
    setIsTyping(false);
  }, [input, token]);

  return (
    <div className="h-[calc(100vh-112px)] flex gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-5 border-b border-white/[0.04]">
          <AnimatedOrb size={44} interactive={false} mood={currentMood || "neutral"} />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white/85">AI Companion</h2>
            <p className="text-xs text-emerald-400/70 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Listening actively • Empathetic Mode
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentMood && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                style={{
                  background: `${EMOTION_COLORS[currentMood] || "#8b5cf6"}10`,
                  borderColor: `${EMOTION_COLORS[currentMood] || "#8b5cf6"}25`,
                }}
              >
                <span className="text-sm">{EMOTION_EMOJI[currentMood] || "🤔"}</span>
                <span className="text-[11px] capitalize" style={{ color: EMOTION_COLORS[currentMood] || "#8b5cf6" }}>
                  {currentMood.replace("_", " ")}
                </span>
              </motion.div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/15">
              <Brain size={12} className="text-violet-400" />
              <span className="text-[10px] text-violet-400/80">GPT-4o</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-end gap-2 max-w-[75%]">
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mb-1">
                    <Sparkles size={12} className="text-violet-400" />
                  </div>
                )}
                <div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-violet-500/20 border border-violet-500/15 rounded-br-md"
                        : "bg-white/[0.04] border border-white/[0.06] rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    <Clock size={10} className="text-white/15" />
                    <p className="text-[10px] text-white/20">{msg.timestamp}</p>
                    {msg.emotion && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${EMOTION_COLORS[msg.emotion] || "#8b5cf6"}15`,
                          color: EMOTION_COLORS[msg.emotion] || "#8b5cf6",
                        }}
                      >
                        {msg.emotion.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={12} className="text-violet-400" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-violet-400/50"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-white/25">thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Auto-logged activity toast */}
        {autoActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-5 mb-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Check size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400/90">Activity auto-logged from your message</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {autoActivities.map((act, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-[11px] text-emerald-300/80">
                  {ACTIVITY_ICONS[act.type] || "📋"} {act.type}: {act.value} {act.unit}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <div className="px-5 pb-2">
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => sendMessage(prompt.text)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 hover:text-white/60 hover:border-violet-500/20 transition-all"
                >
                  <prompt.icon size={14} />
                  {prompt.text}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-5 border-t border-white/[0.04]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                isRecording
                  ? "bg-red-500/20 border border-red-500/30 text-red-400"
                  : "bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/50"
              }`}
              aria-label={isRecording ? "Stop recording" : "Start voice"}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Share how you're feeling..."
              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-violet-500/30 transition-colors"
            />
            <motion.button
              onClick={() => sendMessage()}
              whileTap={{ scale: 0.92 }}
              disabled={isTyping || !input.trim()}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white hover:opacity-80 transition-opacity disabled:opacity-30 flex-shrink-0"
              aria-label="Send message"
            >
              <Send size={18} />
            </motion.button>
          </div>
          <p className="text-[10px] text-white/15 mt-2 text-center">
            MoodMeld AI provides emotional support, not medical advice. If you&apos;re in crisis, call 988.
          </p>
        </div>
      </div>

      {/* Right sidebar — Session info */}
      <div className="hidden xl:flex flex-col w-72 gap-4">
        {/* Current Emotion */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-medium text-white/40 mb-4 uppercase tracking-wider">Detected Mood</h3>
          <div className="flex flex-col items-center gap-3">
            <AnimatedOrb size={80} interactive={false} mood={currentMood || "neutral"} />
            <div className="text-center">
              <p className="text-lg font-semibold text-white/85 capitalize">
                {currentMood?.replace("_", " ") || "Waiting..."}
              </p>
              <p className="text-xs text-white/30 mt-1">Based on your messages</p>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-medium text-white/40 mb-4 uppercase tracking-wider">This Session</h3>
          <div className="space-y-3">
            {[
              { label: "Messages", value: messages.filter((m) => m.role === "user").length.toString(), icon: MessageCircle },
              { label: "Emotions Detected", value: new Set(messages.filter((m) => m.emotion).map((m) => m.emotion)).size.toString(), icon: Brain },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <stat.icon size={16} className="text-violet-400/60 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-white/30">{stat.label}</p>
                  <p className="text-sm font-medium text-white/70">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-medium text-white/40 mb-3 uppercase tracking-wider">Tips</h3>
          <div className="space-y-2.5">
            {[
              "Be honest — I'm here to listen, not judge",
              "Share as much or as little as you want",
              "I can suggest breathing exercises and coping strategies",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-violet-400/40 mt-2 flex-shrink-0" />
                <p className="text-xs text-white/30 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
