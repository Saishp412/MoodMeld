"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Moon,
  Zap,
  Briefcase,
  Dumbbell,
  Users,
  Target,
  Heart,
  Brain,
} from "lucide-react";
import AnimatedOrb from "@/components/shared/AnimatedOrb";
import { useAuthStore } from "@/stores/authStore";
import { profileApi } from "@/lib/api";

interface StepProps {
  data: Record<string, string | number>;
  update: (key: string, value: string | number) => void;
}

const steps = [
  {
    id: "lifestyle",
    title: "Your Daily Rhythm",
    subtitle: "Help us understand your typical day",
    icon: Moon,
  },
  {
    id: "wellness",
    title: "Physical Wellness",
    subtitle: "Exercise and social activity patterns",
    icon: Dumbbell,
  },
  {
    id: "goals",
    title: "Emotional Goals",
    subtitle: "What would you like to achieve?",
    icon: Target,
  },
  {
    id: "assessment",
    title: "Quick Assessment",
    subtitle: "A brief emotional baseline check",
    icon: Brain,
  },
];

function SliderInput({
  label,
  icon: Icon,
  value,
  onChange,
  min,
  max,
  unit,
  color,
}: {
  label: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-white/30" />
          <span className="text-sm text-white/60">{label}</span>
        </div>
        <span className="text-sm font-medium" style={{ color }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${
            ((value - min) / (max - min)) * 100
          }%, rgba(255,255,255,0.06) ${
            ((value - min) / (max - min)) * 100
          }%)`,
        }}
      />
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: { label: string; emoji: string }[];
  selected: string[];
  onSelect: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.label);
        return (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.label)}
            className={`glass-card p-4 text-left transition-all duration-300 ${
              isSelected
                ? "border-violet-500/40 bg-violet-500/[0.08]"
                : "hover:border-white/10"
            }`}
          >
            <span className="text-lg mb-2 block">{opt.emoji}</span>
            <span className="text-sm text-white/70">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Step1({ data, update }: StepProps) {
  return (
    <div className="space-y-4">
      <SliderInput
        label="Average Sleep"
        icon={Moon}
        value={(data.sleep as number) || 7}
        onChange={(v) => update("sleep", v)}
        min={3}
        max={12}
        unit="hrs"
        color="#8b5cf6"
      />
      <SliderInput
        label="Stress Level"
        icon={Zap}
        value={(data.stress as number) || 5}
        onChange={(v) => update("stress", v)}
        min={1}
        max={10}
        unit="/10"
        color="#f43f5e"
      />
      <SliderInput
        label="Work/Study Duration"
        icon={Briefcase}
        value={(data.work as number) || 8}
        onChange={(v) => update("work", v)}
        min={0}
        max={16}
        unit="hrs"
        color="#3b82f6"
      />
    </div>
  );
}

function Step2({ data, update }: StepProps) {
  return (
    <div className="space-y-4">
      <SliderInput
        label="Exercise Frequency"
        icon={Dumbbell}
        value={(data.exercise as number) || 3}
        onChange={(v) => update("exercise", v)}
        min={0}
        max={7}
        unit="days/wk"
        color="#10b981"
      />
      <SliderInput
        label="Social Interaction"
        icon={Users}
        value={(data.social as number) || 5}
        onChange={(v) => update("social", v)}
        min={1}
        max={10}
        unit="/10"
        color="#06b6d4"
      />
      <SliderInput
        label="Emotional Expressiveness"
        icon={Heart}
        value={(data.expressiveness as number) || 5}
        onChange={(v) => update("expressiveness", v)}
        min={1}
        max={10}
        unit="/10"
        color="#f59e0b"
      />
    </div>
  );
}

function Step3({ data, update }: StepProps) {
  const goals = [
    { label: "Reduce Stress", emoji: "🧘" },
    { label: "Prevent Burnout", emoji: "🔥" },
    { label: "Emotional Awareness", emoji: "🧠" },
    { label: "Better Sleep", emoji: "💤" },
    { label: "Improve Mood", emoji: "☀️" },
    { label: "Build Resilience", emoji: "💪" },
    { label: "Work-Life Balance", emoji: "⚖️" },
    { label: "Self-Discovery", emoji: "🔍" },
  ];

  const selected = ((data.goals as string) || "").split(",").filter(Boolean);

  const toggle = (label: string) => {
    const updated = selected.includes(label)
      ? selected.filter((s) => s !== label)
      : [...selected, label];
    update("goals", updated.join(","));
  };

  return (
    <div>
      <p className="text-xs text-white/30 mb-4">Select all that apply</p>
      <OptionGrid
        options={goals}
        selected={selected}
        onSelect={toggle}
        multi
      />
    </div>
  );
}

function Step4({ data, update }: StepProps) {
  const questions = [
    { key: "anxiety", label: "I often feel anxious without clear reason", emoji: "😟" },
    { key: "burnout", label: "I feel emotionally exhausted from work/study", emoji: "😫" },
    { key: "motivation", label: "I struggle with maintaining motivation", emoji: "😔" },
    { key: "sleep_quality", label: "I have trouble falling or staying asleep", emoji: "😴" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/30 mb-4">
        How often do these apply? (1 = Never, 5 = Always)
      </p>
      {questions.map((q) => (
        <div key={q.key} className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">{q.emoji}</span>
            <span className="text-sm text-white/60">{q.label}</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => update(q.key, v)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  (data[q.key] as number) === v
                    ? "bg-violet-500/20 border border-violet-500/30 text-violet-300"
                    : "bg-white/[0.02] border border-white/[0.06] text-white/30 hover:text-white/50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { token, loadFromStorage } = useAuthStore();
  const [data, setData] = useState<Record<string, string | number>>({
    sleep: 7,
    stress: 5,
    work: 8,
    exercise: 3,
    social: 5,
    expressiveness: 5,
    goals: "",
    anxiety: 0,
    burnout: 0,
    motivation: 0,
    sleep_quality: 0,
  });

  // Load auth from localStorage
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const update = (key: string, value: string | number) =>
    setData((d) => ({ ...d, [key]: value }));

  const StepComponents = [Step1, Step2, Step3, Step4];
  const CurrentStepComponent = StepComponents[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (isLast) {
      setSubmitting(true);
      try {
        if (token) {
          const goals = ((data.goals as string) || "").split(",").filter(Boolean);
          await profileApi.completeOnboarding(token, {
            sleep_hours: data.sleep,
            stress_level: data.stress,
            work_duration: data.work,
            exercise_frequency: data.exercise,
            social_frequency: data.social,
            expressiveness: data.expressiveness,
            goals,
            anxiety_level: data.anxiety || undefined,
            burnout_level: data.burnout || undefined,
            motivation_level: data.motivation || undefined,
            sleep_quality_level: data.sleep_quality || undefined,
          });
        }
      } catch (e) {
        console.error("Onboarding save failed:", e);
      }
      setSubmitting(false);
      window.location.href = "/dashboard";
    } else {
      setCurrentStep((c) => c + 1);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center noise-bg px-6 py-12 relative">
      {/* Background */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-600/[0.05] rounded-full blur-[130px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-blue-600/[0.04] rounded-full blur-[110px]" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full overflow-hidden bg-white/[0.06]"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{
                  width: i < currentStep ? "100%" : i === currentStep ? "50%" : "0%",
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          ))}
        </div>

        {/* Step header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                {(() => {
                  const Icon = steps[currentStep].icon;
                  return <Icon size={18} className="text-violet-400" />;
                })()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white/95">
                  {steps[currentStep].title}
                </h1>
                <p className="text-xs text-white/35">
                  {steps[currentStep].subtitle}
                </p>
              </div>
            </div>

            {/* Step content */}
            <div className="mt-6 mb-8">
              <CurrentStepComponent data={data} update={update} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
            className={`btn-secondary text-sm px-5 py-2.5 flex items-center gap-2 ${
              currentStep === 0 ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <span className="text-xs text-white/20">
            {currentStep + 1} of {steps.length}
          </span>

          <motion.button
            onClick={handleNext}
            className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={submitting}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLast ? "Start Using MoodMeld" : "Continue"}
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
