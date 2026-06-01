"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center noise-bg px-6 relative">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-blue-600/[0.04] rounded-full blur-[100px]" />

      <Link
        href="/auth/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {!sent ? (
          <>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 opacity-80" />
                <div className="absolute inset-[2px] rounded-[6px] bg-[#0a0a0f] flex items-center justify-center">
                  <span className="text-sm font-bold gradient-text">M</span>
                </div>
              </div>
              <span className="text-lg font-semibold text-white/90">
                MoodMeld
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white/95 mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-white/35 mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-medium text-white/40 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                  />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

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
                  <>
                    Send Reset Link
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white/95 mb-2">
              Check Your Email
            </h2>
            <p className="text-sm text-white/35 mb-8">
              We&apos;ve sent a password reset link to{" "}
              <span className="text-white/60">{email}</span>
            </p>
            <Link href="/auth/login">
              <button className="btn-secondary text-sm px-6 py-3">
                Back to Sign In
              </button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
