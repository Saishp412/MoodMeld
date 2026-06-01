import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MoodMeld 2.0 — AI Emotional Wellness Platform",
  description:
    "Understand your emotions intelligently. MoodMeld 2.0 uses multimodal AI to analyze, predict, and support your emotional wellness through conversational intelligence, voice analysis, and behavioral tracking.",
  keywords: [
    "emotional wellness",
    "AI companion",
    "mood tracking",
    "mental health",
    "sentiment analysis",
    "mood prediction",
  ],
  openGraph: {
    title: "MoodMeld 2.0 — Your AI Emotional Companion",
    description:
      "Predict emotional trends before burnout happens. AI-powered mood analysis and personalized wellness support.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
