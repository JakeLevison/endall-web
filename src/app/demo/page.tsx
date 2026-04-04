"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";

const TRADE_OPTIONS = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Mechanical",
  "Fire Protection",
  "Refrigeration",
  "Multi-trade",
  "Other",
];

const TEAM_SIZE_OPTIONS = [
  "1\u201310",
  "11\u201325",
  "26\u201350",
  "51\u2013100",
  "100+",
];

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 14,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  outline: "none",
  width: "100%",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: 1,
  marginBottom: 8,
  display: "block",
};

export default function DemoPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 64,
            }}
            className="md:grid-cols-2"
          >
            {/* Left column — pitch */}
            <div>
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
                Request a Demo
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "clamp(28px, 5vw, 40px)",
                  fontWeight: 600,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  marginBottom: 20,
                }}
              >
                See Endall in action
              </h1>

              {/* Credibility bar */}
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: 1,
                  lineHeight: 1.6,
                  marginBottom: 12,
                }}
              >
                Built for MEP contractors running real operations
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 0",
                  alignItems: "center",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                <span>8 AI-powered actions</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>&middot;</span>
                <span>Real Excel formulas</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>&middot;</span>
                <span>Personalized walkthrough</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 0",
                  alignItems: "center",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 32,
                }}
              >
                <span>Powered by</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Supabase</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Twilio</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Anthropic</span>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  color: "var(--text-tertiary)",
                  lineHeight: 1.7,
                  marginBottom: 40,
                }}
              >
                Get a 20-minute walkthrough tailored to your trade. We&rsquo;ll show you how Endall runs lead capture, quoting, scheduling, and follow-ups &mdash; so your team can focus on the work.
              </p>

              {/* Interactive demo CTA */}
              <a
                href="/demo/interactive"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  background: "rgba(59,130,246,0.1)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: 8,
                  color: "#60a5fa",
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  marginBottom: 32,
                  transition: "background 0.15s",
                }}
              >
                Or try the interactive demo first
              </a>

              {/* Trust signals */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { label: "Built for MEP contractors", detail: "Plumbing, electrical, mechanical — not a generic SaaS." },
                  { label: "Tailored to your operation", detail: "We configure Endall around your trade, team size, and workflow." },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-sans), sans-serif",
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#fff",
                          marginBottom: 2,
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-sans), sans-serif",
                          fontSize: 13,
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — form */}
            <div>
              <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    setError(null);

                    const data = new FormData(e.currentTarget);
                    const payload = {
                      name: data.get("name") as string,
                      work_email: data.get("email") as string,
                      company: data.get("company") as string,
                      trade: data.get("trade") as string,
                      team_size: data.get("teamSize") as string,
                      notes: data.get("notes") as string,
                    };

                    try {
                      const res = await fetch("/api/demo-submit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      });

                      if (!res.ok) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(body.error || "Something went wrong");
                      }

                      router.push("/demo/confirmation");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Something went wrong");
                      setSubmitting(false);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    padding: "32px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={labelStyle}>Name</label>
                      <input name="name" required placeholder="Full name" style={inputStyle} />
                    </div>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={labelStyle}>Work Email</label>
                      <input name="email" type="email" required placeholder="you@company.com" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Company</label>
                    <input name="company" required placeholder="Company name" style={inputStyle} />
                  </div>

                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={labelStyle}>Trade</label>
                      <select name="trade" required style={selectStyle} defaultValue="">
                        <option value="" disabled style={{ color: "#000", background: "#fff" }}>Select trade</option>
                        {TRADE_OPTIONS.map((t) => (
                          <option key={t} value={t} style={{ color: "#000", background: "#fff" }}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={labelStyle}>Team Size</label>
                      <select name="teamSize" required style={selectStyle} defaultValue="">
                        <option value="" disabled style={{ color: "#000", background: "#fff" }}>Select range</option>
                        {TEAM_SIZE_OPTIONS.map((s) => (
                          <option key={s} value={s} style={{ color: "#000", background: "#fff" }}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Anything we should know?</label>
                    <textarea
                      name="notes"
                      rows={3}
                      placeholder="Current tools, pain points, timeline — whatever helps us prep"
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>

                  {error && (
                    <p
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: 13,
                        color: "#ef4444",
                        textAlign: "center",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "14px 32px",
                      background: submitting ? "#999" : "#fff",
                      color: "#000",
                      border: "none",
                      borderRadius: 8,
                      cursor: submitting ? "not-allowed" : "pointer",
                      transition: "background-color 0.2s ease",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#e5e5e5"; }}
                    onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#ffffff"; }}
                  >
                    {submitting ? "Submitting..." : "Request a Demo"}
                  </button>

                  <p
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    No spam. We&rsquo;ll only use your info to set up the demo.
                  </p>
                </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
