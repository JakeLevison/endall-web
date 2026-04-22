"use client";

import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";
import CapabilityAccordion from "@/components/sections/CapabilityAccordion";

export default function FeaturesPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      <Navbar />
      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Features
          </p>
          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            Every role covered.
          </h1>
        </div>
        <CapabilityAccordion />
      </main>
      <Footer />
    </div>
  );
}
