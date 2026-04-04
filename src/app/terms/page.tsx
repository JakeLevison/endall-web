"use client";

import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";

export default function TermsPage() {
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
            Terms of Service
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
            <Section title="1. Agreement">
              <p>By using Endall, you agree to these terms. Endall provides an AI-powered operations platform for MEP contractors, including document generation, financial modeling, call management, and related services.</p>
            </Section>

            <Section title="2. Your Account">
              <p>You are responsible for maintaining the security of your account credentials. You agree to provide accurate company and contact information. Each account is for a single business entity.</p>
            </Section>

            <Section title="3. Acceptable Use">
              <p>You agree to use Endall for legitimate business purposes. You will not attempt to reverse-engineer the platform, use it to generate misleading financial documents, or misrepresent AI-generated content as certified professional advice where licensing is required.</p>
            </Section>

            <Section title="4. Generated Content">
              <p>Documents, financial models, proposals, and other files generated through Endall are tools for your business use. Financial models and estimates are projections, not guarantees. You are responsible for reviewing all generated content before use in business decisions, client communications, or regulatory submissions.</p>
            </Section>

            <Section title="5. Data Ownership">
              <p>You own your data. Company information, project details, and generated documents belong to you. Endall retains a limited license to process your data solely to provide and improve the service. We will not share your business data with competitors or third parties beyond what is necessary to operate the platform.</p>
            </Section>

            <Section title="6. Service Availability">
              <p>We aim for high availability but do not guarantee uninterrupted service. We will provide reasonable notice before planned maintenance. Call answering services are subject to carrier availability and are not a substitute for 911 or emergency services.</p>
            </Section>

            <Section title="7. Payment">
              <p>Pricing is agreed upon during your demo and onboarding. Payment terms, billing cycles, and cancellation policies will be specified in your service agreement.</p>
            </Section>

            <Section title="8. Limitation of Liability">
              <p>Endall is provided &ldquo;as is.&rdquo; We are not liable for business decisions made based on AI-generated content, missed calls due to carrier outages, or losses exceeding the fees paid in the preceding 12 months.</p>
            </Section>

            <Section title="9. Termination">
              <p>Either party may terminate with 30 days written notice. Upon termination, you can export your data for up to 60 days. After that period, your data will be permanently deleted.</p>
            </Section>

            <Section title="10. Contact">
              <p>Questions about these terms? Email <a href="mailto:jake@endall.ai" style={{ color: "var(--text-primary)", textDecoration: "underline", textUnderlineOffset: 3 }}>jake@endall.ai</a>.</p>
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
