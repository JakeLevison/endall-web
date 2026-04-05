"use client";

import { useState } from "react";

const CREW_SIZES = ["1-5", "6-15", "16-30", "31-50", "50+"];

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 15,
  padding: "12px 14px",
  background: "var(--overlay-soft)",
  border: "1px solid var(--overlay-medium)",
  borderRadius: 8,
  color: "var(--text-primary)",
  outline: "none",
  width: "100%",
  minHeight: 44,
};

// Natural pause partway through the interactive demo — "we want to
// personalize the rest for your business" framing, not a brick wall.
// 4 fields, submission saved to Supabase + notification email + localStorage.
export default function DemoGate({ onComplete }: { onComplete: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      company: data.get("company"),
      crew_size: data.get("crew_size"),
    };
    try {
      const res = await fetch("/api/demo-gate-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      try {
        localStorage.setItem("endall_demo_gate_filled", "1");
      } catch {
        // ignore localStorage failures (private mode, etc.)
      }
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-gate-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10002,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "32px 28px",
          background: "var(--surface)",
          border: "1px solid var(--overlay-medium)",
          borderRadius: 16,
          boxShadow: "0 24px 72px rgba(0,0,0,0.55)",
        }}
      >
        <h2
          id="demo-gate-title"
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 22,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            marginBottom: 10,
            lineHeight: 1.2,
          }}
        >
          You&rsquo;ve seen what Endall can do.
          <br />Want to see it on YOUR jobs?
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 14,
            color: "var(--text-tertiary)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          We want to personalize the rest of the demo for your business. Takes
          about fifteen seconds.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input name="name" required placeholder="Your name" style={inputStyle} autoComplete="name" />
          <input name="email" type="email" required placeholder="Work email" style={inputStyle} autoComplete="email" />
          <input name="company" required placeholder="Company name" style={inputStyle} autoComplete="organization" />
          <select name="crew_size" required defaultValue="" style={inputStyle}>
            <option value="" disabled>Crew size…</option>
            {CREW_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

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
              fontSize: 15,
              fontWeight: 600,
              padding: "14px 24px",
              background: submitting ? "var(--text-muted)" : "var(--brand-accent-light)",
              color: "#1a1a1a",
              border: "none",
              borderRadius: 8,
              cursor: submitting ? "not-allowed" : "pointer",
              minHeight: 48,
              marginTop: 4,
            }}
          >
            {submitting ? "Saving…" : "Continue the demo"}
          </button>
        </form>
      </div>
    </div>
  );
}
