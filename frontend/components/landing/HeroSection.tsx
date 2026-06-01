"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedOrb from "@/components/shared/AnimatedOrb";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient meshes */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/[0.07] rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/[0.07] rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-cyan-500/[0.04] rounded-full blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="section-container relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/[0.08] mb-8"
            >
              <Sparkles size={14} className="text-violet-400" />
              <span className="text-xs font-medium text-violet-300/90 tracking-wide">
                AI-Powered Emotional Intelligence
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              <span className="text-white/95">Your AI</span>
              <br />
              <span className="gradient-text">Emotional</span>
              <br />
              <span className="text-white/95">Companion</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-white/40 leading-relaxed max-w-lg mx-auto lg:mx-0"
            >
              Understand your emotions intelligently. Predict emotional trends
              before burnout happens. Multimodal AI that listens, analyzes, and
              supports your emotional wellness journey.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/auth/register">
                <motion.button
                  className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3.5 w-full sm:w-auto"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start Your Journey
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
              <a href="#features">
                <motion.button
                  className="btn-secondary flex items-center justify-center gap-2 text-base px-8 py-3.5 w-full sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Explore Features
                </motion.button>
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 flex items-center gap-6 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0a0a0f] bg-gradient-to-br from-violet-400 to-blue-400"
                    style={{
                      opacity: 1 - i * 0.1,
                      background: `linear-gradient(135deg, hsl(${
                        260 + i * 20
                      }, 60%, 60%), hsl(${220 + i * 15}, 60%, 55%))`,
                    }}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm text-white/60">
                  <span className="text-white/90 font-semibold">2,400+</span>{" "}
                  people improving their emotional wellness
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right — Animated Orb */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          >
            <AnimatedOrb size={320} className="lg:w-[400px] lg:h-[400px]" />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 rounded-full border border-white/10 flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 rounded-full bg-white/30"
            animate={{ y: [0, 12, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
