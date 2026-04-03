"use client";

import { useState } from "react";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

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
              color: "#fff",
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
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Message received.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 14,
                  color: "var(--text-tertiary)",
                }}
              >
                We&rsquo;ll get back to you shortly.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                // POST to a future API route — for now, open mailto fallback
                const name = data.get("name") as string;
                const email = data.get("email") as string;
                const message = data.get("message") as string;
                window.location.href = `mailto:jake@endall.ai?subject=Contact from ${encodeURIComponent(name)}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
                setSubmitted(true);
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
                    fontSize: 14,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
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
                    fontSize: 14,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
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
                  fontSize: 14,
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  outline: "none",
                  resize: "vertical",
                }}
              />
              <button
                type="submit"
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "14px 32px",
                  background: "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
              >
                Send Message
              </button>
            </form>
          )}

          <div
            style={{
              marginTop: 56,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.06)",
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
                fontSize: 14,
                color: "var(--text-tertiary)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
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
