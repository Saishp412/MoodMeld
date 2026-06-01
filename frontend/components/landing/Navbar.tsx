"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Analytics", href: "#analytics" },
  { label: "Privacy", href: "#privacy" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className={`transition-all duration-500 ${
          isScrolled
            ? "bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="section-container flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-[2px] rounded-[6px] bg-[#0a0a0f] flex items-center justify-center">
                <span className="text-sm font-bold gradient-text">M</span>
              </div>
            </div>
            <span className="text-lg font-semibold text-white/90 tracking-tight">
              MoodMeld
            </span>
            <span className="text-[10px] font-medium text-violet-400/80 bg-violet-500/10 px-1.5 py-0.5 rounded-full border border-violet-500/20">
              2.0
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-sm text-white/50 hover:text-white/90 transition-colors duration-300 rounded-lg hover:bg-white/[0.04]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-white/60 hover:text-white/90 transition-colors duration-300 px-4 py-2"
            >
              Sign In
            </Link>
            <Link href="/auth/register">
              <motion.button
                className="btn-primary text-sm px-5 py-2.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white/60 hover:text-white/90 transition-colors p-2"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="md:hidden overflow-hidden"
        initial={false}
        animate={{
          height: isMobileOpen ? "auto" : 0,
          opacity: isMobileOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="bg-[#0a0a0f]/95 backdrop-blur-2xl border-b border-white/[0.06] px-6 pb-6 pt-2">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-3 text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.04] rounded-lg transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/[0.06]">
            <Link
              href="/auth/login"
              className="text-sm text-white/60 hover:text-white/90 transition-colors px-4 py-3 text-center rounded-lg hover:bg-white/[0.04]"
            >
              Sign In
            </Link>
            <Link href="/auth/register">
              <button className="btn-primary w-full text-sm py-3">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
