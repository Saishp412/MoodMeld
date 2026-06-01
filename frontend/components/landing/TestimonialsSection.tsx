"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Designer",
    content:
      "MoodMeld predicted my burnout a week before I felt it. The voice analysis caught subtle changes in my tone during meetings that I wasn't even aware of. It suggested breaks and calming playlists that genuinely helped.",
    emotion: "Grateful",
    avatar: "SC",
    gradient: "from-violet-500 to-blue-500",
  },
  {
    name: "Marcus Rivera",
    role: "Software Engineer",
    content:
      "I've tried every mood tracking app out there. MoodMeld is different — it doesn't rely on me remembering to log my emotions. The behavioral analysis and conversational AI make tracking feel effortless and natural.",
    emotion: "Impressed",
    avatar: "MR",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Aisha Patel",
    role: "Graduate Student",
    content:
      "During thesis season, the stress prediction was eerily accurate. It helped me develop healthier study patterns and the recommendation engine introduced me to meditation practices I still use daily.",
    emotion: "Empowered",
    avatar: "AP",
    gradient: "from-cyan-500 to-emerald-500",
  },
  {
    name: "James Thompson",
    role: "Startup Founder",
    content:
      "The emotional trend graphs revealed patterns I'd been blind to for years. Seeing the correlation between my sleep, exercise, and emotional state has been genuinely life-changing.",
    emotion: "Enlightened",
    avatar: "JT",
    gradient: "from-emerald-500 to-amber-500",
  },
  {
    name: "Luna Kim",
    role: "UX Researcher",
    content:
      "What I love most is how the AI validates my emotions instead of trying to fix them. It feels like talking to someone who genuinely understands, not a chatbot reading from a script.",
    emotion: "Understood",
    avatar: "LK",
    gradient: "from-amber-500 to-rose-500",
  },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () =>
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-32 relative" ref={ref}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/[0.03] rounded-full blur-[130px]" />

      <div className="section-container relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-amber-400/80 mb-4 block">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white/95 tracking-tight">
            Stories of{" "}
            <span className="gradient-text-warm">Transformation</span>
          </h2>
          <p className="mt-5 text-base text-white/35 max-w-2xl mx-auto leading-relaxed">
            Real experiences from people who rediscovered their emotional
            balance with MoodMeld.
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-card p-8 sm:p-10 relative overflow-hidden">
            {/* Quote icon */}
            <Quote
              size={48}
              className="absolute top-6 right-6 text-white/[0.03]"
              strokeWidth={1}
            />

            {/* Content */}
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 relative z-10">
                &ldquo;{testimonials[current].content}&rdquo;
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${testimonials[current].gradient} flex items-center justify-center`}
                  >
                    <span className="text-sm font-semibold text-white">
                      {testimonials[current].avatar}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {testimonials[current].name}
                    </p>
                    <p className="text-xs text-white/35">
                      {testimonials[current].role}
                    </p>
                  </div>
                </div>

                {/* Emotion tag */}
                <span className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40">
                  Feeling: {testimonials[current].emotion}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "bg-violet-400 w-6"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            {/* Arrow buttons */}
            <div className="flex gap-2">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/[0.12] transition-all"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="w-10 h-10 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white/70 hover:border-white/[0.12] transition-all"
                aria-label="Next testimonial"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
