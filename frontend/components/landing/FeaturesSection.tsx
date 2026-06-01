"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Brain,
  Mic,
  BarChart3,
  Sparkles,
  Shield,
  Heart,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Conversational AI",
    description:
      "An empathetic AI companion that truly understands your emotional state through natural conversation and validates your feelings.",
    color: "#8b5cf6",
    gradient: "from-violet-500/20 to-violet-600/5",
  },
  {
    icon: Mic,
    title: "Voice Emotion Analysis",
    description:
      "Advanced vocal analysis detects stress, calmness, and emotional tension through speech patterns, pitch, and energy.",
    color: "#3b82f6",
    gradient: "from-blue-500/20 to-blue-600/5",
  },
  {
    icon: BarChart3,
    title: "Predictive Analytics",
    description:
      "LSTM-powered models predict your next-day mood, burnout probability, and stress trajectory before they escalate.",
    color: "#06b6d4",
    gradient: "from-cyan-500/20 to-cyan-600/5",
  },
  {
    icon: Sparkles,
    title: "Smart Recommendations",
    description:
      "Personalized music, movies, meditation, and wellness activities tailored to your current emotional needs.",
    color: "#f59e0b",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: Shield,
    title: "Privacy-First Design",
    description:
      "End-to-end encrypted data, no raw audio storage, consent-based processing, and complete user data control.",
    color: "#10b981",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  {
    icon: Heart,
    title: "Emotional Safety Net",
    description:
      "Intelligent distress detection triggers calming resources, professional support links, and safety prompts.",
    color: "#f43f5e",
    gradient: "from-rose-500/20 to-rose-600/5",
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-32 relative" ref={ref}>
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/[0.03] rounded-full blur-[150px]" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-violet-400/80 mb-4 block">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white/95 tracking-tight">
            Multimodal Emotional{" "}
            <span className="gradient-text">Intelligence</span>
          </h2>
          <p className="mt-5 text-base text-white/35 max-w-2xl mx-auto leading-relaxed">
            Six integrated AI systems work together to build a comprehensive
            understanding of your emotional landscape.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="glass-card p-7 h-full group cursor-default">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  style={{ border: `1px solid ${feature.color}20` }}
                >
                  <feature.icon
                    size={22}
                    style={{ color: feature.color }}
                    strokeWidth={1.5}
                  />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white/90 mb-2.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/35 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover accent line */}
                <div
                  className="mt-5 h-[1px] w-0 group-hover:w-full transition-all duration-500"
                  style={{
                    background: `linear-gradient(90deg, ${feature.color}40, transparent)`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
