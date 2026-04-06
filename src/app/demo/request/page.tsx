"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { posthog } from "@/lib/posthog";
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
  fontSize: 16,
  padding: "14px 16px",
  background: "var(--overlay-soft)",
  border: "1px solid var(--overlay-medium)",
  borderRadius: 8,
  color: "var(--text-primary)",
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
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    posthog.capture("demo_form_started");
    return () => {
      if (!submittedRef.current) {
        posthog.capture("demo_form_abandoned");
      }
    };
  }, []);

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
                  color: "var(--text-primary)",
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
                  color: "var(--overlay-strong)",
                  marginBottom: 32,
                }}
              >
                <span>Powered by</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
                <span style={{ color: "var(--overlay-strong)" }}>Supabase</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
                <span style={{ color: "var(--overlay-strong)" }}>Twilio</span>
                <span style={{ margin: "0 10px", opacity: 0.4 }}>|</span>
                <span style={{ color: "var(--overlay-strong)" }}>Anthropic</span>
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
                        background: "var(--overlay-soft)",
                        border: "1px solid var(--overlay-medium)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-sans), sans-serif",
                          fontSize: 16,
                          fontWeight: 500,
                          color: "var(--text-primary)",
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
                      turnstile_token: turnstileToken,
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

                      submittedRef.current = true;
                      posthog.capture("demo_form_completed", {
                        trade: payload.trade,
                        team_size: payload.team_size,
                      });
                      router.push("/demo/confirmation");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Something went wrong");
                      setSubmitting(false);
                      turnstileRef.current?.reset();
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    padding: "32px",
                    background: "var(--overlay-weak)",
                    border: "1px solid var(--overlay-soft)",
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
                        <option value="" disabled style={{ color: "var(--text-inverse)", background: "var(--surface-inverse)" }}>Select trade</option>
                        {TRADE_OPTIONS.map((t) => (
                          <option key={t} value={t} style={{ color: "var(--text-inverse)", background: "var(--surface-inverse)" }}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={labelStyle}>Team Size</label>
                      <select name="teamSize" required style={selectStyle} defaultValue="">
                        <option value="" disabled style={{ color: "var(--text-inverse)", background: "var(--surface-inverse)" }}>Select range</option>
                        {TEAM_SIZE_OPTIONS.map((s) => (
                          <option key={s} value={s} style={{ color: "var(--text-inverse)", background: "var(--surface-inverse)" }}>{s}</option>
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

                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
                    onSuccess={setTurnstileToken}
                    onError={() => setTurnstileToken(null)}
                    onExpire={() => setTurnstileToken(null)}
                    options={{ theme: "auto", size: "normal" }}
                  />

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
                      fontSize: 16,
                      fontWeight: 500,
                      padding: "14px 32px",
                      background: submitting ? "var(--text-tertiary)" : "var(--text-primary)",
                      color: "var(--text-inverse)",
                      border: "none",
                      borderRadius: 8,
                      cursor: submitting ? "not-allowed" : "pointer",
                      transition: "background-color 0.2s ease",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "var(--surface-hover)"; }}
                    onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "var(--surface-inverse)"; }}
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
