"use client";

import { useState, useCallback } from "react";
import LogoEntrance from "@/components/hero/LogoEntrance";
import Navbar from "@/components/hero/Navbar";
import HeroHeadline from "@/components/hero/HeroHeadline";
import SocialProofTicker from "@/components/hero/SocialProofTicker";
import ScrollReveal from "@/components/shared/ScrollReveal";
import ValuePropSection from "@/components/sections/ValuePropSection";
import CapabilityAccordion from "@/components/sections/CapabilityAccordion";
import DashboardPreview from "@/components/sections/DashboardPreview";
import RoiCalculator from "@/components/sections/RoiCalculator";
import Testimonials from "@/components/sections/Testimonials";
import UseCases from "@/components/sections/UseCases";
import Pricing from "@/components/sections/Pricing";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";

export default function Home() {
  const [entranceDone, setEntranceDone] = useState(false);

  const handleEntranceComplete = useCallback(() => {
    setEntranceDone(true);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      <LogoEntrance onComplete={handleEntranceComplete} />

      <div
        style={{
          opacity: entranceDone ? 1 : 0,
          transition: "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: entranceDone ? "auto" : "none",
        }}
      >
        <Navbar />

        <main style={{ position: "relative", zIndex: 2 }}>
          {/* 1. Hook — "We run your ___" */}
          <HeroHeadline />

          {/* 2. Why — "Here's the problem you have" */}
          <ValuePropSection />

          {/* 3. How — expandable capability cards */}
          <ScrollReveal>
            <div
              style={{
                maxWidth: "1100px",
                margin: "0 auto",
                borderTop: "1px solid var(--border)",
              }}
            />
            <CapabilityAccordion />
          </ScrollReveal>

          {/* 4. Proof — "Your entire operation. One screen." */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <DashboardPreview />

          {/* Social proof ticker (compact) */}
          <SocialProofTicker />

          {/* 5. ROI — "Do the math." */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <RoiCalculator />

          {/* Trust + social proof */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <Testimonials />

          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <UseCases />

          {/* Pricing */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <Pricing />

          {/* 6. Final CTA */}
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto",
              borderTop: "1px solid var(--border)",
            }}
          />
          <FinalCTA />

          {/* Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
