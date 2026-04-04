"use client";

import { useState } from "react";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 24px" }}>
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
              marginBottom: 12,
            }}
          >
            Get in touch
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              color: "var(--text-tertiary)",
              lineHeight: 1.6,
              marginBottom: 48,
            }}
          >
            Questions, partnerships, or just want to learn more — we&rsquo;d love to hear from you.
          </p>

          {submitted ? (
            <div
              style={{
                padding: "40px 32px",
                background: "var(--overlay-weak)",
                border: "1px solid var(--overlay-soft)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}
              >
                Message received.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  color: "var(--text-tertiary)",
                }}
              >
                We&rsquo;ll get back to you shortly.
              </p>
            </div>
          ) : (
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
                      name: data.get("name"),
                      email: data.get("email"),
                      message: data.get("message"),
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
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <input
                  name="name"
                  required
                  placeholder="Name"
                  style={{
                    flex: "1 1 200px",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 16,
                    padding: "14px 16px",
                    background: "var(--overlay-soft)",
                    border: "1px solid var(--overlay-medium)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  style={{
                    flex: "1 1 200px",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 16,
                    padding: "14px 16px",
                    background: "var(--overlay-soft)",
                    border: "1px solid var(--overlay-medium)",
                    borderRadius: 8,
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
              </div>
              <textarea
                name="message"
                required
                placeholder="How can we help?"
                rows={5}
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  padding: "14px 16px",
                  background: "var(--overlay-soft)",
                  border: "1px solid var(--overlay-medium)",
                  borderRadius: 8,
                  color: "var(--text-primary)",
                  outline: "none",
                  resize: "vertical",
                }}
              />
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
                  fontWeight: 500,
                  padding: "14px 32px",
                  background: submitting ? "var(--text-tertiary)" : "var(--text-primary)",
                  color: "var(--text-inverse)",
                  border: "none",
                  borderRadius: 8,
                  cursor: submitting ? "not-allowed" : "pointer",
                  alignSelf: "flex-start",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "var(--surface-hover)"; }}
                onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "var(--surface-inverse)"; }}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}

          <div
            style={{
              marginTop: 56,
              paddingTop: 32,
              borderTop: "1px solid var(--overlay-soft)",
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
