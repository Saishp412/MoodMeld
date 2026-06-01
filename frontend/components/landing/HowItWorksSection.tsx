"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, Cpu, LineChart, Lightbulb } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: MessageCircle,
    title: "Share How You Feel",
    description:
      "Talk, type, or journal — express yourself naturally through text or voice. No forms, no rigid structures.",
    color: "#8b5cf6",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Analyzes Deeply",
    description:
      "Our emotion fusion engine processes text sentiment, voice patterns, and behavioral data to understand your true state.",
    color: "#3b82f6",
  },
  {
    step: "03",
    icon: LineChart,
    title: "Patterns Emerge",
    description:
      "LSTM models identify emotional trends, predict future states, and detect early signs of burnout or stress escalation.",
    color: "#06b6d4",
  },
  {
    step: "04",
    icon: Lightbulb,
    title: "Personalized Support",
    description:
      "Receive empathetic AI responses, curated wellness recommendations, and actionable insights tailored to your needs.",
    color: "#10b981",
  },
];

export default function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="py-32 relative" ref={ref}>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/[0.03] rounded-full blur-[130px]" />

      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-blue-400/80 mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white/95 tracking-tight">
            Four Steps to{" "}
            <span className="gradient-text">Emotional Clarity</span>
          </h2>
          <p className="mt-5 text-base text-white/35 max-w-2xl mx-auto leading-relaxed">
            A seamless pipeline from expression to insight, powered by
            state-of-the-art AI and machine learning.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <div className="glass-card p-7 text-center relative group">
                  {/* Step number */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className="text-[10px] font-bold px-3 py-1 rounded-full border"
                      style={{
                        color: step.color,
                        borderColor: `${step.color}30`,
                        background: `${step.color}10`,
                      }}
                    >
                      STEP {step.step}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mt-4 mb-5 group-hover:scale-110 transition-transform duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}15, ${step.color}05)`,
                      border: `1px solid ${step.color}20`,
                    }}
                  >
                    <step.icon
                      size={24}
                      style={{ color: step.color }}
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-semibold text-white/90 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/35 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
