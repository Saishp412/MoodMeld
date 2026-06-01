"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Moon, Dumbbell, Briefcase, Users, Plus, X,
  Calendar, TrendingUp, Loader2, Clock, Check,
  Activity as ActivityIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { activitiesApi } from "@/lib/api";

const ACTIVITY_TYPES = [
  { type: "sleep", label: "Sleep", icon: Moon, color: "#8b5cf6", unit: "hours", max: 14, step: 0.5 },
  { type: "exercise", label: "Exercise", icon: Dumbbell, color: "#10b981", unit: "minutes", max: 180, step: 5 },
  { type: "work", label: "Work", icon: Briefcase, color: "#3b82f6", unit: "hours", max: 16, step: 0.5 },
  { type: "social", label: "Social", icon: Users, color: "#06b6d4", unit: "hours", max: 12, step: 0.5 },
];

export default function ActivitiesPage() {
  const { token } = useAuthStore();
  const [todayActivities, setTodayActivities] = useState<any>(null);
  const [historyActivities, setHistoryActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("sleep");
  const [formValue, setFormValue] = useState(7);
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadData = () => {
    if (!token) return;
    setLoading(true);
    Promise.allSettled([
      activitiesApi.getToday(token).then(setTodayActivities),
      activitiesApi.getAll(token, 7).then((res: any) => setHistoryActivities(res.activities || [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await activitiesApi.log(token, formType, formValue, undefined, formNotes || undefined);
      setSuccess(true);
      setShowForm(false);
      setFormNotes("");
      loadData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
    setSubmitting(false);
  };

  const selectedType = ACTIVITY_TYPES.find((t) => t.type === formType) || ACTIVITY_TYPES[0];
  const summary = todayActivities?.summary || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={32} className="animate-spin text-violet-400/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white/95">Activity Tracker</h1>
          <p className="text-sm text-white/35 mt-1">Log and track your daily activities</p>
        </div>
        <motion.button
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
        >
          <Plus size={16} />
          Log Activity
        </motion.button>
      </motion.div>

      {/* Success toast */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06]"
          >
            <Check size={16} className="text-emerald-400" />
            <p className="text-sm text-emerald-400/80">Activity logged successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIVITY_TYPES.map((act, i) => {
          const value = summary[act.type] || 0;
          const target = act.type === "sleep" ? 8 : act.type === "exercise" ? 60 : act.type === "work" ? 8 : 2;
          const pct = Math.min((value / target) * 100, 100);
          return (
            <motion.div
              key={act.type}
              className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-3">
                <act.icon size={20} style={{ color: act.color }} strokeWidth={1.5} />
                <span className="text-[10px] text-white/20 uppercase">{act.label}</span>
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-white/85">
                  {act.type === "exercise" ? Math.round(value) : value.toFixed(1)}
                </span>
                <span className="text-xs text-white/30 ml-1">{act.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: act.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <span className="text-[10px] text-white/25 flex-shrink-0">
                  {Math.round(pct)}%
                </span>
              </div>
              <p className="text-[10px] text-white/15 mt-1.5">
                Target: {target} {act.unit}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Log Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="glass-card p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white/90">Log Activity</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Type Selector */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {ACTIVITY_TYPES.map((act) => (
                  <button
                    key={act.type}
                    onClick={() => {
                      setFormType(act.type);
                      setFormValue(act.type === "sleep" ? 7 : act.type === "exercise" ? 30 : act.type === "work" ? 8 : 1);
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      formType === act.type
                        ? "bg-violet-500/10 border border-violet-500/25"
                        : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1]"
                    }`}
                  >
                    <act.icon size={18} style={{ color: formType === act.type ? act.color : "rgba(255,255,255,0.3)" }} />
                    <span className={`text-[10px] ${formType === act.type ? "text-white/70" : "text-white/30"}`}>
                      {act.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Value Slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">{selectedType.label} Duration</span>
                  <span className="text-sm font-medium" style={{ color: selectedType.color }}>
                    {formValue} {selectedType.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={selectedType.max}
                  step={selectedType.step}
                  value={formValue}
                  onChange={(e) => setFormValue(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${selectedType.color} ${
                      (formValue / selectedType.max) * 100
                    }%, rgba(255,255,255,0.06) ${(formValue / selectedType.max) * 100}%)`,
                  }}
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-xs text-white/40 mb-2 block">Notes (optional)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="How was it?"
                  className="input-field text-sm"
                />
              </div>

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                disabled={submitting || formValue === 0}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Check size={16} />
                    Log {selectedType.label}
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity History */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-white/60 mb-5 flex items-center gap-2">
          <Clock size={16} className="text-violet-400/60" />
          Recent Activity Log (7 Days)
        </h3>
        {historyActivities.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {historyActivities.map((act: any, i: number) => {
              const typeInfo = ACTIVITY_TYPES.find((t) => t.type === act.type) || ACTIVITY_TYPES[0];
              return (
                <motion.div
                  key={act.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}25` }}
                  >
                    <typeInfo.icon size={16} style={{ color: typeInfo.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60 capitalize">{act.type}</p>
                    <p className="text-[10px] text-white/20">
                      {act.date} {act.notes ? `• ${act.notes}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-white/50">
                    {act.value} {typeInfo.unit}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <ActivityIcon size={32} className="text-white/10" />
            <p className="text-xs text-white/20">No activities logged yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors"
            >
              Log your first activity →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
