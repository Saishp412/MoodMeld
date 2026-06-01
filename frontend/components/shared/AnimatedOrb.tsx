"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedOrbProps {
  size?: number;
  className?: string;
  interactive?: boolean;
  mood?: string;
}

const moodColors: Record<string, string[]> = {
  neutral: ["#8b5cf6", "#3b82f6", "#06b6d4"],
  happy: ["#f59e0b", "#10b981", "#06b6d4"],
  calm: ["#3b82f6", "#06b6d4", "#10b981"],
  sad: ["#6366f1", "#4338ca", "#312e81"],
  anxious: ["#f43f5e", "#f59e0b", "#8b5cf6"],
  stressed: ["#ef4444", "#f97316", "#f59e0b"],
  motivated: ["#10b981", "#06b6d4", "#3b82f6"],
};

export default function AnimatedOrb({
  size = 200,
  className = "",
  interactive = true,
  mood = "neutral",
}: AnimatedOrbProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const colors = moodColors[mood] || moodColors.neutral;

  useEffect(() => {
    if (!interactive) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `radial-gradient(circle, ${colors[0]}40 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(30px)",
        }}
      />

      {/* Secondary glow */}
      <motion.div
        className="absolute inset-4"
        animate={{
          scale: [1.05, 1, 1.05],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        style={{
          background: `radial-gradient(circle, ${colors[1]}50 0%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(20px)",
        }}
      />

      {/* Main orb body */}
      <motion.div
        className="absolute inset-6"
        animate={{
          x: interactive ? mousePos.x : 0,
          y: interactive ? mousePos.y : 0,
          borderRadius: [
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "30% 60% 70% 40% / 50% 60% 30% 60%",
            "50% 50% 40% 60% / 40% 50% 60% 50%",
            "40% 60% 50% 50% / 60% 40% 50% 60%",
            "60% 40% 30% 70% / 60% 30% 70% 40%",
          ],
        }}
        transition={{
          borderRadius: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          },
          x: { type: "spring", stiffness: 50, damping: 30 },
          y: { type: "spring", stiffness: 50, damping: 30 },
        }}
        style={{
          backgroundImage: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
          backgroundSize: "200% 200%",
          animation: "gradient-shift 4s ease infinite",
          boxShadow: `
            0 0 40px ${colors[0]}40,
            0 0 80px ${colors[1]}20,
            inset 0 0 40px ${colors[2]}30
          `,
        }}
      />

      {/* Inner light reflection */}
      <motion.div
        className="absolute"
        style={{
          top: "20%",
          left: "25%",
          width: "30%",
          height: "20%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.3) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(8px)",
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Particle dots orbiting */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: 3 + i,
            height: 3 + i,
            background: colors[i % colors.length],
            borderRadius: "50%",
            top: "50%",
            left: "50%",
            boxShadow: `0 0 6px ${colors[i % colors.length]}`,
          }}
          animate={{
            x: [
              Math.cos((i * 72 * Math.PI) / 180) * (size * 0.35),
              Math.cos(((i * 72 + 120) * Math.PI) / 180) * (size * 0.38),
              Math.cos(((i * 72 + 240) * Math.PI) / 180) * (size * 0.33),
              Math.cos((i * 72 * Math.PI) / 180) * (size * 0.35),
            ],
            y: [
              Math.sin((i * 72 * Math.PI) / 180) * (size * 0.35),
              Math.sin(((i * 72 + 120) * Math.PI) / 180) * (size * 0.38),
              Math.sin(((i * 72 + 240) * Math.PI) / 180) * (size * 0.33),
              Math.sin((i * 72 * Math.PI) / 180) * (size * 0.35),
            ],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 6 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}
