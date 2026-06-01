"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Lock,
  Eye,
  Trash2,
  ShieldCheck,
  Database,
  FileKey,
} from "lucide-react";

const privacyFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All emotional data is encrypted at rest and in transit using AES-256.",
  },
  {
    icon: Eye,
    title: "Consent-Based Processing",
    description: "Voice analysis only activates with explicit user permission each session.",
  },
  {
    icon: Trash2,
    title: "User-Controlled Deletion",
    description: "Delete all your data at any time with a single click. No hidden retention.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Authentication",
    description: "JWT tokens with bcrypt hashing. No passwords stored in plain text.",
  },
  {
    icon: Database,
    title: "No Raw Audio Storage",
    description: "Voice features are extracted in real-time. Raw audio is never saved to servers.",
  },
  {
    icon: FileKey,
    title: "Transparent AI Decisions",
    description: "Every emotion classification explains why it was detected. Full auditability.",
  },
];

export default function PrivacySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="privacy" className="py-32 relative" ref={ref}>
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-600/[0.04] rounded-full blur-[120px]" />

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-emerald-400/80 mb-4 block">
              Privacy & Security
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white/95 tracking-tight mb-5">
              Your Emotions Are{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #10b981, #06b6d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Sacred
              </span>
            </h2>
            <p className="text-base text-white/35 leading-relaxed mb-8">
              We believe emotional data is the most sensitive data there is.
              MoodMeld is built privacy-first — your feelings are never
              commodified, shared, or exploited. You have full control over
              everything.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {["GDPR Compliant", "SOC 2 Type II", "Zero-Knowledge"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="text-xs px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400/80"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </motion.div>

          {/* Right — Privacy features grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {privacyFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="glass-card p-5 group"
              >
                <feature.icon
                  size={20}
                  className="text-emerald-400/70 mb-3 group-hover:text-emerald-400 transition-colors"
                  strokeWidth={1.5}
                />
                <h3 className="text-sm font-medium text-white/80 mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-white/30 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
