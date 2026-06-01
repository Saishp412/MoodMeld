"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Simulated mood data for the preview chart
const moodData = [
  { day: "Mon", happy: 72, calm: 65, stress: 30, energy: 80 },
  { day: "Tue", happy: 68, calm: 70, stress: 35, energy: 75 },
  { day: "Wed", happy: 55, calm: 50, stress: 55, energy: 60 },
  { day: "Thu", happy: 60, calm: 55, stress: 45, energy: 65 },
  { day: "Fri", happy: 78, calm: 72, stress: 25, energy: 85 },
  { day: "Sat", happy: 85, calm: 80, stress: 15, energy: 90 },
  { day: "Sun", happy: 82, calm: 78, stress: 20, energy: 88 },
];

const emotions = [
  { label: "Happy", value: 78, color: "#f59e0b", icon: "😊" },
  { label: "Calm", value: 72, color: "#06b6d4", icon: "😌" },
  { label: "Motivated", value: 85, color: "#10b981", icon: "💪" },
  { label: "Stress", value: 25, color: "#f43f5e", icon: "😰" },
];

function AnimatedChart() {
  const maxVal = 100;
  const chartHeight = 160;

  return (
    <div className="flex items-end gap-1 h-[160px]">
      {moodData.map((d, i) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col items-center gap-[2px]" style={{ height: chartHeight }}>
            <motion.div
              className="w-full rounded-t-sm"
              style={{ background: "linear-gradient(to top, #8b5cf6, #3b82f6)" }}
              initial={{ height: 0 }}
              whileInView={{ height: `${(d.happy / maxVal) * chartHeight}px` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] text-white/30 mt-1">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

function EmotionMeter({ label, value, color, icon, delay }: {
  label: string;
  value: number;
  color: string;
  icon: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-white/50">{label}</span>
          <span className="text-xs font-medium text-white/70">{value}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${value}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function FloatingMetric({ label, value, unit, delay, color }: {
  label: string;
  value: string;
  unit: string;
  delay: number;
  color: string;
}) {
  const [count, setCount] = useState(0);
  const target = parseInt(value);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / 40;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 30);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <motion.div
      ref={ref}
      className="glass-card p-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <p className="text-2xl font-bold" style={{ color }}>{count}<span className="text-sm font-normal text-white/40">{unit}</span></p>
      <p className="text-xs text-white/35 mt-1">{label}</p>
    </motion.div>
  );
}

export default function AnalyticsPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="analytics" className="py-32 relative" ref={ref}>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.04] rounded-full blur-[120px]" />

      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-cyan-400/80 mb-4 block">
            Analytics Dashboard
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white/95 tracking-tight">
            Your Emotional <span className="gradient-text">Landscape</span>
          </h2>
          <p className="mt-5 text-base text-white/35 max-w-2xl mx-auto leading-relaxed">
            Visualize your emotional patterns with beautiful, intelligent dashboards
            that reveal insights you never knew about yourself.
          </p>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          className="glass-card p-6 sm:p-8 glow-violet"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* Mock top bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-white/20 font-mono">MoodMeld Dashboard — Weekly Overview</span>
            <div className="w-20" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart Panel */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/60">Mood Trend — This Week</h3>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">7D</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.03] text-white/30 border border-white/[0.06]">30D</span>
                </div>
              </div>
              <AnimatedChart />
            </div>

            {/* Emotion Meters */}
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-4">Current State</h3>
              <div className="flex flex-col gap-4">
                {emotions.map((e, i) => (
                  <EmotionMeter key={e.label} {...e} delay={i * 0.1} />
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
            <FloatingMetric label="Emotional Stability" value="87" unit="%" delay={0.3} color="#10b981" />
            <FloatingMetric label="Prediction Confidence" value="92" unit="%" delay={0.4} color="#8b5cf6" />
            <FloatingMetric label="Burnout Risk" value="15" unit="%" delay={0.5} color="#f43f5e" />
            <FloatingMetric label="Wellness Score" value="84" unit="/100" delay={0.6} color="#06b6d4" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
