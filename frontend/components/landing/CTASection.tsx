"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimatedOrb from "@/components/shared/AnimatedOrb";

export default function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/[0.06] rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[100px]" />
      </div>

      <div className="section-container relative z-10 text-center">
        {/* Mini orb */}
        <motion.div
          className="mx-auto mb-10"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <AnimatedOrb size={120} interactive={false} />
        </motion.div>

        <motion.h2
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white/95 tracking-tight mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Ready to Understand
          <br />
          <span className="gradient-text">Yourself Better?</span>
        </motion.h2>

        <motion.p
          className="text-base text-white/35 max-w-xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Join thousands of people who are building deeper emotional
          self-awareness with AI-powered insights and empathetic support.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/auth/register">
            <motion.button
              className="btn-primary text-base px-10 py-4 flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Your Journey — Free
              <ArrowRight size={18} />
            </motion.button>
          </Link>
          <p className="mt-4 text-xs text-white/20">
            No credit card required · Free tier available
          </p>
        </motion.div>
      </div>
    </section>
  );
}
