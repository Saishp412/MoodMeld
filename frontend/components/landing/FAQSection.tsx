"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqItems = [
  {
    question: "How does MoodMeld analyze my emotions?",
    answer:
      "MoodMeld uses a multimodal emotion fusion engine that combines three data streams: text sentiment analysis (using DistilBERT and VADER), voice emotion analysis (using MFCC feature extraction and pitch analysis), and behavioral pattern tracking (sleep, exercise, social activity). These signals are weighted and combined to produce a comprehensive emotional classification.",
  },
  {
    question: "Is my voice data stored on your servers?",
    answer:
      "No. Voice data is processed in real-time to extract emotional features (pitch, energy, speech rate), and the raw audio is immediately discarded. Only the extracted emotional scores are stored — never the original recordings. You can also disable voice analysis entirely in your settings.",
  },
  {
    question: "How accurate are the mood predictions?",
    answer:
      "Our LSTM prediction model achieves 85-92% accuracy on next-day mood prediction after 2-3 weeks of data collection. Accuracy improves with consistent usage and feedback. The system always displays prediction confidence levels so you know how reliable each prediction is.",
  },
  {
    question: "Can MoodMeld replace professional therapy?",
    answer:
      "No. MoodMeld is an emotional wellness and self-awareness tool, not a replacement for professional mental health support. If the system detects signs of severe emotional distress, it will provide resources for professional help and crisis hotlines. Always consult a licensed therapist for clinical concerns.",
  },
  {
    question: "What happens to my data if I delete my account?",
    answer:
      "When you delete your account, all associated data — emotional records, conversation history, behavioral logs, and profile information — is permanently and irreversibly removed from our systems within 24 hours. We maintain zero backups of deleted user data.",
  },
  {
    question: "Is MoodMeld free to use?",
    answer:
      "MoodMeld offers a generous free tier that includes daily mood tracking, basic analytics, and conversational AI support. Premium features like advanced prediction models, voice analysis, personalized recommendations, and detailed behavioral analytics are available with a subscription.",
  },
  {
    question: "How does the recommendation engine work?",
    answer:
      "Our recommendation engine uses content-based filtering combined with your current emotional state. When you're feeling stressed, it might suggest calming playlists via Spotify, mindfulness content, or relaxation techniques. When motivated, it can recommend productivity tools and energizing activities. Recommendations improve with your feedback.",
  },
];

function FAQItem({
  question,
  answer,
  index,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <button
        onClick={onToggle}
        className="w-full glass-card p-5 sm:p-6 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm sm:text-base font-medium text-white/80 group-hover:text-white/95 transition-colors">
            {question}
          </h3>
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center transition-all duration-300 ${
              isOpen ? "bg-violet-500/10 border-violet-500/20" : ""
            }`}
          >
            {isOpen ? (
              <Minus size={14} className="text-violet-400" />
            ) : (
              <Plus size={14} className="text-white/40" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-4 text-sm text-white/35 leading-relaxed pr-12">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-32 relative" ref={ref}>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/[0.03] rounded-full blur-[130px]" />

      <div className="section-container relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-violet-400/80 mb-4 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white/95 tracking-tight">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="mt-5 text-base text-white/35 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about MoodMeld and your emotional
            wellness journey.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="flex flex-col gap-3">
          {faqItems.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              index={index}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
