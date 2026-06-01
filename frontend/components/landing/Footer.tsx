"use client";

import Link from "next/link";
import { Globe, MessageCircle, ExternalLink, Mail } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Analytics", href: "#analytics" },
    { label: "Pricing", href: "#" },
    { label: "Changelog", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Research", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Press", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "GDPR", href: "#" },
  ],
};

const socialLinks = [
  { icon: MessageCircle, href: "#", label: "Twitter" },
  { icon: Globe, href: "#", label: "GitHub" },
  { icon: ExternalLink, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#08080d]">
      <div className="section-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 opacity-80" />
                <div className="absolute inset-[2px] rounded-[4px] bg-[#08080d] flex items-center justify-center">
                  <span className="text-xs font-bold gradient-text">M</span>
                </div>
              </div>
              <span className="text-base font-semibold text-white/80">
                MoodMeld
              </span>
            </Link>
            <p className="text-sm text-white/25 leading-relaxed mb-5 max-w-[200px]">
              AI-powered emotional wellness for a more self-aware life.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/[0.12] transition-all"
                >
                  <social.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Groups */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/25 hover:text-white/60 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/15">
            © {new Date().getFullYear()} MoodMeld. All rights reserved.
          </p>
          <p className="text-xs text-white/15">
            Built with ❤️ for emotional wellness
          </p>
        </div>
      </div>
    </footer>
  );
}
