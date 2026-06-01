"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, AlertCircle } from "lucide-react";
import AnimatedOrb from "@/components/shared/AnimatedOrb";
import { useAuthStore } from "@/stores/authStore";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form.name, form.email, form.password);
      window.location.href = "/onboarding";
    } catch {
      // Error is set in store
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Password strength
  const getStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = getStrength();
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#f43f5e", "#f59e0b", "#06b6d4", "#10b981"];

  return (
    <div className="min-h-screen flex noise-bg">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/[0.08] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-600/[0.06] rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 text-center px-12">
          <AnimatedOrb size={180} interactive={false} mood="motivated" />
          <motion.h2
            className="text-3xl font-bold text-white/90 mt-8 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Begin Your Journey
          </motion.h2>
          <motion.p
            className="text-base text-white/35 max-w-sm mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Create your emotional wellness profile and let AI understand you
            better than you understand yourself.
          </motion.p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          <ArrowLeft size={16} />
          Home
        </Link>

        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 opacity-80" />
              <div className="absolute inset-[2px] rounded-[6px] bg-[#0a0a0f] flex items-center justify-center">
                <span className="text-sm font-bold gradient-text">M</span>
              </div>
            </div>
            <span className="text-lg font-semibold text-white/90">MoodMeld</span>
          </div>

          <h1 className="text-2xl font-bold text-white/95 mb-2">Create Account</h1>
          <p className="text-sm text-white/35 mb-8">
            Start your AI-powered emotional wellness journey
          </p>

          {/* Error message */}
          {error && (
            <motion.div
              className="mb-6 p-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400/80">{error}</p>
              <button onClick={clearError} className="ml-auto text-red-400/40 hover:text-red-400 text-xs">
                Dismiss
              </button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-white/40 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="input-field pl-11"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-medium text-white/40 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="input-field pl-11"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-white/40 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength */}
              {form.password && (
                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{
                          background:
                            strength >= level
                              ? strengthColors[strength]
                              : "rgba(255,255,255,0.06)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-medium" style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-white/20 leading-relaxed">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-violet-400/60 hover:text-violet-400/80">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-violet-400/60 hover:text-violet-400/80">
                Privacy Policy
              </a>
              .
            </p>

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-white/30 mt-8">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-violet-400/80 hover:text-violet-400 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
