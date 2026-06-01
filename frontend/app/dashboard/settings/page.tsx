"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  User, Mail, Shield, Bell, Palette, Moon,
  Sun, Globe, Key, LogOut, Save, Check,
  AlertTriangle, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { profileApi } from "@/lib/api";

export default function SettingsPage() {
  const { user, token, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!token) return;
    profileApi
      .getProfile(token)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token || !profile) return;
    setSaving(true);
    try {
      await profileApi.updateProfile(token, {
        sleep_hours: profile.sleep_hours,
        stress_level: profile.stress_level,
        work_duration: profile.work_duration,
        exercise_frequency: profile.exercise_frequency,
        social_frequency: profile.social_frequency,
        expressiveness: profile.expressiveness,
        goals: profile.goals || [],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Save failed:", e);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white/95">Settings</h1>
        <p className="text-sm text-white/35 mt-1">Manage your account and preferences</p>
      </motion.div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Tabs Sidebar */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="glass-card p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/15"
                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {/* Account Info */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium text-white/60 mb-5">Account Information</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-medium text-white/85">{user?.name || "User"}</p>
                    <p className="text-xs text-white/30 flex items-center gap-1.5">
                      <Mail size={12} /> {user?.email || "—"}
                    </p>
                    <p className="text-[10px] text-white/15 mt-1">
                      Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      readOnly
                      className="input-field text-sm bg-white/[0.01] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      readOnly
                      className="input-field text-sm bg-white/[0.01] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Wellness Profile */}
              {loading ? (
                <div className="glass-card p-6 flex items-center justify-center h-40">
                  <Loader2 size={24} className="animate-spin text-violet-400/40" />
                </div>
              ) : profile ? (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-medium text-white/60">Wellness Profile</h3>
                    {saved && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs text-emerald-400 flex items-center gap-1"
                      >
                        <Check size={12} /> Saved
                      </motion.span>
                    )}
                  </div>

                  <div className="grid gap-5">
                    {[
                      { key: "sleep_hours", label: "Average Sleep", unit: "hrs", min: 3, max: 12, color: "#8b5cf6", icon: Moon },
                      { key: "stress_level", label: "Stress Level", unit: "/10", min: 1, max: 10, color: "#f43f5e", icon: AlertTriangle },
                      { key: "work_duration", label: "Work Duration", unit: "hrs", min: 0, max: 16, color: "#3b82f6", icon: Globe },
                      { key: "exercise_frequency", label: "Exercise Frequency", unit: "days/wk", min: 0, max: 7, color: "#10b981", icon: Sun },
                    ].map((field) => (
                      <div key={field.key}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <field.icon size={14} className="text-white/25" />
                            <span className="text-xs text-white/50">{field.label}</span>
                          </div>
                          <span className="text-xs font-medium" style={{ color: field.color }}>
                            {profile[field.key]} {field.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={field.min}
                          max={field.max}
                          step={field.key === "sleep_hours" || field.key === "work_duration" ? 0.5 : 1}
                          value={profile[field.key] || 0}
                          onChange={(e) => setProfile({ ...profile, [field.key]: Number(e.target.value) })}
                          className="w-full h-1 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${field.color} ${
                              ((profile[field.key] - field.min) / (field.max - field.min)) * 100
                            }%, rgba(255,255,255,0.06) ${
                              ((profile[field.key] - field.min) / (field.max - field.min)) * 100
                            }%)`,
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-6"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </motion.button>
                </div>
              ) : (
                <div className="glass-card p-6 text-center">
                  <p className="text-sm text-white/30">Complete onboarding to set up your wellness profile</p>
                </div>
              )}

              {/* Danger Zone */}
              <div className="glass-card p-6 border-red-500/10">
                <h3 className="text-sm font-medium text-red-400/60 mb-4">Account Actions</h3>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.04] text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-sm font-medium text-white/60 mb-5">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { label: "Daily Mood Check-in Reminder", desc: "Get a gentle reminder to log your mood", default: true },
                  { label: "Weekly Wellness Report", desc: "Receive a summary of your emotional week", default: true },
                  { label: "Burnout Risk Alert", desc: "Alert when burnout risk becomes high", default: true },
                  { label: "New Recommendations", desc: "Notify when new personalized content is available", default: false },
                  { label: "AI Companion Insights", desc: "When AI detects patterns in your emotions", default: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div>
                      <p className="text-sm text-white/60">{notif.label}</p>
                      <p className="text-xs text-white/20 mt-0.5">{notif.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={notif.default} className="sr-only peer" />
                      <div className="w-9 h-5 bg-white/[0.06] rounded-full peer peer-checked:bg-violet-500/40 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/50 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-violet-300" />
                    </label>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-sm font-medium text-white/60 mb-5">Privacy & Security</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield size={18} className="text-emerald-400/60" />
                    <div>
                      <p className="text-sm text-white/60">Data Encryption</p>
                      <p className="text-xs text-white/20">All data is encrypted in transit and at rest</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 w-fit">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-emerald-400/80">Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3 mb-3">
                    <Key size={18} className="text-violet-400/60" />
                    <div>
                      <p className="text-sm text-white/60">Change Password</p>
                      <p className="text-xs text-white/20">Update your login credentials</p>
                    </div>
                  </div>
                  <button className="btn-secondary text-xs px-4 py-2">Change Password</button>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-white/25" />
                    <div>
                      <p className="text-sm text-white/60">Voice Data Policy</p>
                      <p className="text-xs text-white/20">Voice recordings are processed in-memory and never saved to disk</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-sm font-medium text-white/60 mb-5">Appearance</h3>
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-white/40 mb-3">Theme</p>
                  <div className="flex gap-3">
                    {[
                      { label: "Dark", icon: Moon, active: true },
                      { label: "Light", icon: Sun, active: false },
                    ].map((theme) => (
                      <button
                        key={theme.label}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                          theme.active
                            ? "bg-violet-500/10 border border-violet-500/25 text-violet-300"
                            : "bg-white/[0.02] border border-white/[0.06] text-white/30 cursor-not-allowed opacity-50"
                        }`}
                        disabled={!theme.active}
                      >
                        <theme.icon size={16} />
                        <span className="text-sm">{theme.label}</span>
                        {theme.active && <Check size={14} className="ml-2" />}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/15 mt-2">Light mode coming soon</p>
                </div>

                <div>
                  <p className="text-xs text-white/40 mb-3">Accent Color</p>
                  <div className="flex gap-2">
                    {["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"].map((color, i) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-lg transition-all ${i === 0 ? "ring-2 ring-white/30 ring-offset-2 ring-offset-[#0a0a0f]" : "hover:scale-110"}`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
