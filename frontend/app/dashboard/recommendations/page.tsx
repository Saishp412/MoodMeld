"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Music, Film, Wind, BookOpen, Sparkles,
  ChevronRight, ExternalLink, Loader2, RefreshCw,
  Heart,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { recommendationsApi } from "@/lib/api";

const EMOTION_EMOJI: Record<string, string> = {
  happy: "😊", calm: "😌", sad: "😢", anxious: "😰",
  stressed: "😤", burned_out: "😫", fatigued: "😴", motivated: "💪",
};

const TYPE_CONFIG: Record<string, { icon: typeof Music; color: string; bg: string }> = {
  music: { icon: Music, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)" },
  movie: { icon: Film, color: "#f43f5e", bg: "rgba(244, 63, 94, 0.08)" },
  wellness: { icon: Wind, color: "#06b6d4", bg: "rgba(6, 182, 212, 0.08)" },
  reading: { icon: BookOpen, color: "#10b981", bg: "rgba(16, 185, 129, 0.08)" },
};

export default function RecommendationsPage() {
  const { token } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const loadRecs = () => {
    if (!token) return;
    setLoading(true);
    recommendationsApi
      .getAll(token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRecs();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={32} className="animate-spin text-violet-400/40" />
      </div>
    );
  }

  const recs = data?.recommendations || [];
  const moodContext = data?.mood_context || "calm";
  const sources = data?.sources || {};

  const grouped: Record<string, any[]> = {};
  recs.forEach((rec: any) => {
    const type = rec.type || "other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(rec);
  });

  const filteredRecs = filter ? recs.filter((r: any) => r.type === filter) : recs;
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white/95">Recommendations</h1>
          <p className="text-sm text-white/35 mt-1">
            Personalized for your {moodContext.replace("_", " ")} mood {EMOTION_EMOJI[moodContext] || ""}
          </p>
        </div>
        <motion.button
          onClick={loadRecs}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Mood Context Banner */}
      <motion.div
        className="glass-card p-5 flex items-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl">
          {EMOTION_EMOJI[moodContext] || "🤔"}
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/70">
            Based on your current mood: <span className="font-medium text-white/90 capitalize">{moodContext.replace("_", " ")}</span>
          </p>
          <p className="text-xs text-white/25 mt-0.5">
            Sources: {Object.entries(sources).map(([k, v]) => `${k}: ${v}`).join(" • ")}
          </p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/15">
          <Sparkles size={12} className="text-violet-400" />
          <span className="text-[10px] text-violet-400/80">{recs.length} picks</span>
        </div>
      </motion.div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            !filter
              ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
              : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
          }`}
        >
          All ({recs.length})
        </button>
        {categories.map((cat) => {
          const config = TYPE_CONFIG[cat] || TYPE_CONFIG.wellness;
          const Icon = config.icon;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                filter === cat
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/20"
                  : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
              }`}
            >
              <Icon size={12} />
              {cat.charAt(0).toUpperCase() + cat.slice(1)} ({grouped[cat]?.length || 0})
            </button>
          );
        })}
      </div>

      {/* Recommendations Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRecs.map((rec: any, i: number) => {
          const config = TYPE_CONFIG[rec.type] || TYPE_CONFIG.wellness;
          const Icon = config.icon;
          return (
            <motion.div
              key={i}
              className="glass-card p-5 group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: config.bg, border: `1px solid ${config.color}20` }}
                >
                  <Icon size={22} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium"
                      style={{ background: `${config.color}15`, color: config.color }}
                    >
                      {rec.type}
                    </span>
                    <span className="text-[9px] text-white/15">{rec.source || "Curated"}</span>
                  </div>
                  <h4 className="text-sm font-medium text-white/80 group-hover:text-white/95 transition-colors truncate">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-white/30 mt-1 line-clamp-2">
                    {rec.subtitle}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                {rec.rating && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-amber-400">★</span>
                    <span className="text-[10px] text-white/30">{rec.rating}</span>
                  </div>
                )}
                {!rec.rating && <div />}
                {rec.url ? (
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-white/15">
                    <Heart size={10} /> Save
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredRecs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Sparkles size={32} className="text-white/10" />
          <p className="text-sm text-white/20">No recommendations found</p>
        </div>
      )}
    </div>
  );
}
