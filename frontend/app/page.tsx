import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AnalyticsPreview from "@/components/landing/AnalyticsPreview";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PrivacySection from "@/components/landing/PrivacySection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="noise-bg">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AnalyticsPreview />
      <HowItWorksSection />
      <TestimonialsSection />
      <PrivacySection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
