"use client";

import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/hero/Navbar";
import Footer from "@/components/sections/Footer";
import { posthog } from "@/lib/posthog";

const EXAMPLE_QUESTIONS = [
  "Which of my jobs are bleeding margin right now, and why?",
  "Who owes me money, how much, and how late are they?",
  "Which GCs in my corridor are bidding DC work I'm not on?",
  "If I took one service agreement off my plate tomorrow, what breaks first?",
  "What's my true hourly cost for a journeyman once benefits and downtime are in?",
  "Who called last week that I never called back, and what were they asking for?",
  "If I add two more techs, when does my back office stop keeping up?",
];

export default function DiscoveryPage() {
  useEffect(() => {
    posthog.capture("discovery_page_viewed");
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

      <main style={{ position: "relative", zIndex: 2 }}>
        <section
          style={{
            paddingTop: "140px",
            paddingBottom: "60px",
            paddingLeft: "16px",
            paddingRight: "16px",
            maxWidth: "880px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: "var(--text-muted)",
              marginBottom: "20px",
            }}
          >
            Before we hop on a call
          </p>

          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: 0,
              maxWidth: "780px",
            }}
            className="text-[36px] sm:text-[48px] lg:text-[60px]"
          >
            If you had an AI, what would you ask it?
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(16px, 2.4vw, 20px)",
              color: "var(--text-tertiary)",
              maxWidth: "680px",
              margin: "24px 0 48px",
              lineHeight: 1.6,
            }}
          >
            Bring that one question to the discovery call. The more specific
            and annoying the better, because that is the thing we are going to
            point the ops layer at on day one.
          </p>

          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(20px, 3vw, 26px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 20px",
              letterSpacing: "-0.01em",
            }}
          >
            Stuck? Here is what other contractors ask.
          </h2>

          <ul
            data-testid="discovery-questions"
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 48px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <li
                key={q}
                style={{
                  border: "1px solid var(--overlay-medium)",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  background: "var(--overlay-weak)",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "clamp(15px, 2vw, 17px)",
                  color: "var(--text-secondary)",
                  lineHeight: 1.55,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginRight: "10px",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {q}
              </li>
            ))}
          </ul>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "12px",
              borderTop: "1px solid var(--border)",
              paddingTop: "32px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "clamp(16px, 2.2vw, 18px)",
                color: "var(--text-secondary)",
                margin: 0,
                maxWidth: "600px",
              }}
            >
              Got your question? Let us put it to work.
            </p>
            <Link
              href="/contact?intent=book_demo"
              onClick={() =>
                posthog.capture("cta_clicked", {
                  source: "discovery_page",
                  cta: "Book a discovery call",
                  href: "/contact?intent=book_demo",
                })
              }
              style={{
                display: "inline-block",
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--text-inverse)",
                backgroundColor: "var(--surface-inverse)",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                transition: "background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--surface-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--surface-inverse)")
              }
            >
              Book a discovery call
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
