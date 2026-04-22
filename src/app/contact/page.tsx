"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";

type Intent = "book_demo" | "talk_sales" | "learn_more";

const INTENT_TABS: { id: Intent; label: string }[] = [
  { id: "book_demo", label: "Book a Demo" },
  { id: "talk_sales", label: "Talk to Sales" },
  { id: "learn_more", label: "Learn More" },
];

const ROLES = [
  "Owner",
  "Operations Manager",
  "Project Manager",
  "Office Manager",
  "Other",
];

const CREW_SIZES = ["1-5", "6-15", "16-30", "31-50", "50+"];

const SOURCES = ["Google", "Referral", "LinkedIn", "Conference", "Other"];

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

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-tertiary)",
  marginBottom: 6,
  display: "block",
};

function ContactPageInner() {
  const searchParams = useSearchParams();
  const initialIntent = ((): Intent => {
    const q = searchParams.get("intent");
    if (q === "book_demo" || q === "talk_sales" || q === "learn_more") return q;
    return "book_demo";
  })();

  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Keep tab state synced if user navigates via ?intent= query change
  useEffect(() => {
    const q = searchParams.get("intent");
    if (q === "book_demo" || q === "talk_sales" || q === "learn_more") {
      setIntent(q);
    }
  }, [searchParams]);

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
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Contact
          </p>
          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            See Endall working for your business
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              color: "var(--text-tertiary)",
              lineHeight: 1.6,
              marginBottom: 40,
            }}
          >
            Tell us a bit about your operation and we&rsquo;ll reach out within
            24 hours to walk through what Endall would look like running the
            office for you.
          </p>

          {submitted ? (
            <div
              style={{
                padding: "48px 32px",
                background: "var(--overlay-weak)",
                border: "1px solid var(--overlay-medium)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: 12,
                }}
              >
                Thanks. We&rsquo;ll reach out within 24 hours.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 15,
                  color: "var(--text-tertiary)",
                  marginBottom: 24,
                  lineHeight: 1.6,
                }}
              >
                In the meantime, take a three-minute walkthrough of Endall on
                a real job.
              </p>
              <Link
                href="/demo/interactive"
                style={{
                  display: "inline-block",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--text-inverse)",
                  backgroundColor: "var(--brand-accent-light)",
                  padding: "12px 24px",
                  borderRadius: 6,
                  textDecoration: "none",
                }}
              >
                Open interactive demo →
              </Link>
            </div>
          ) : (
            <>
              {/* Intent tabs */}
              <div
                role="tablist"
                aria-label="What are you here for?"
                style={{
                  display: "flex",
                  gap: 6,
                  padding: 5,
                  background: "var(--overlay-soft)",
                  border: "1px solid var(--overlay-medium)",
                  borderRadius: 12,
                  marginBottom: 32,
                  boxShadow: "var(--shadow-inset)",
                }}
              >
                {INTENT_TABS.map((t) => {
                  const active = intent === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setIntent(t.id)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "none",
                        background: active ? "var(--brand-accent-light)" : "transparent",
                        color: active ? "#1a1a1a" : "var(--text-tertiary)",
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: 14,
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                        transition: "background 200ms ease, color 200ms ease",
                        minHeight: 44,
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  setError("");
                  const data = new FormData(e.currentTarget);
                  try {
                    const res = await fetch("/api/contact-submit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        intent,
                        company: data.get("company"),
                        name: data.get("name"),
                        email: data.get("email"),
                        phone: data.get("phone"),
                        role: data.get("role"),
                        crew_size: data.get("crew_size"),
                        challenge: data.get("challenge"),
                        source: data.get("source"),
                      }),
                    });
                    if (!res.ok) throw new Error("Failed to send");
                    setSubmitted(true);
                  } catch {
                    setError("Something went wrong. Please try again or email jake@endall.ai directly.");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <label htmlFor="company" style={labelStyle}>Company name</label>
                  <input id="company" name="company" required placeholder="e.g. Meridian Electric" style={inputStyle} />
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <label htmlFor="name" style={labelStyle}>Your name</label>
                    <input id="name" name="name" required placeholder="Jane Smith" style={inputStyle} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <label htmlFor="email" style={labelStyle}>Email</label>
                    <input id="email" name="email" type="email" required placeholder="jane@company.com" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" style={labelStyle}>Phone (speeds booking if you want a call)</label>
                  <input id="phone" name="phone" type="tel" placeholder="(555) 123-4567" style={inputStyle} />
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <label htmlFor="role" style={labelStyle}>Your role</label>
                    <select id="role" name="role" defaultValue="" style={inputStyle} required>
                      <option value="" disabled>Select your role…</option>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <label htmlFor="crew_size" style={labelStyle}>How many technicians / crew?</label>
                    <select id="crew_size" name="crew_size" defaultValue="" style={inputStyle} required>
                      <option value="" disabled>Select team size…</option>
                      {CREW_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="challenge" style={labelStyle}>Biggest front-office challenge</label>
                  <input
                    id="challenge"
                    name="challenge"
                    placeholder="Missed calls, chasing invoices, hiring admin staff…"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="source" style={labelStyle}>How did you find us?</label>
                  <select id="source" name="source" defaultValue="" style={inputStyle}>
                    <option value="" disabled>Select…</option>
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {error && (
                  <p style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: 13, color: "#ef4444" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    padding: "14px 32px",
                    background: submitting ? "var(--text-tertiary)" : "var(--brand-accent-light)",
                    color: "#1a1a1a",
                    border: "none",
                    borderRadius: 8,
                    cursor: submitting ? "not-allowed" : "pointer",
                    alignSelf: "flex-start",
                    marginTop: 8,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {submitting ? "Sending…" : intent === "book_demo" ? "Book my demo" : intent === "talk_sales" ? "Talk to sales" : "Send message"}
                </button>
              </form>
            </>
          )}

          <div
            style={{
              marginTop: 56,
              paddingTop: 32,
              borderTop: "1px solid var(--overlay-medium)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Or email us directly
            </p>
            <a
              href="mailto:jake@endall.ai"
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 16,
                color: "var(--text-tertiary)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            >
              jake@endall.ai
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageInner />
    </Suspense>
  );
}
