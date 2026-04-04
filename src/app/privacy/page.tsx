"use client";

import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text-secondary)",
      }}
    >
      <Navbar />
      <main style={{ paddingTop: 140, paddingBottom: 80 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Legal
          </p>
          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 48,
            }}
          >
            Last updated: April 2026
          </p>

          <div
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 15,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            <Section title="1. Information We Collect">
              <p>When you use Endall or request a demo, we collect information you provide directly: your name, email address, company name, trade, and team size. We also collect usage data including pages visited, features used, and files generated within the platform.</p>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>We use your information to provide and improve the Endall platform, respond to demo requests, communicate about your account, and send relevant product updates. We do not sell your personal information to third parties.</p>
            </Section>

            <Section title="3. Data Storage and Security">
              <p>Your data is stored on secure, encrypted servers. Documents and files generated through Ask Endall are stored in encrypted cloud storage and are accessible only to your account. We use industry-standard security measures to protect your information.</p>
            </Section>

            <Section title="4. Third-Party Services">
              <p>Endall uses third-party services for hosting (Vercel), data storage (Supabase), email delivery (Resend), and scheduling (Calendly). These services have their own privacy policies and are selected for their security standards.</p>
            </Section>

            <Section title="5. Your Rights">
              <p>You can request access to, correction of, or deletion of your personal data at any time by contacting us at jake@endall.ai. We will respond to your request within 30 days.</p>
            </Section>

            <Section title="6. Cookies">
              <p>We use essential cookies and local storage to maintain your session and preferences. We do not use tracking cookies or third-party advertising cookies.</p>
            </Section>

            <Section title="7. Changes to This Policy">
              <p>We may update this policy from time to time. We will notify you of material changes via email or through the platform.</p>
            </Section>

            <Section title="8. Contact">
              <p>Questions about this policy? Email <a href="mailto:jake@endall.ai" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>jake@endall.ai</a>.</p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      <div style={{ color: "var(--text-secondary)" }}>{children}</div>
    </div>
  );
}
