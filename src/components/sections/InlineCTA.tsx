"use client";

import Link from "next/link";

import { posthog } from "@/lib/posthog";

// Lightweight centered text CTA between marketing sections. Amber accent
// only on the link itself; no full-width background. Set showVoiceCta to
// also render the "Try the voice agent" link that deep-links into /demo.
export default function InlineCTA({
  lead,
  cta,
  href,
  showVoiceCta = false,
}: {
  lead: string;
  cta: string;
  href: string;
  showVoiceCta?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "16px 16px 40px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "clamp(15px, 2.2vw, 17px)",
          color: "var(--text-tertiary)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {lead}{" "}
        <Link
          href={href}
          onClick={() =>
            posthog.capture("cta_clicked", {
              source: "inline_cta",
              cta,
              href,
            })
          }
          style={{
            color: "var(--brand-accent-light)",
            textDecoration: "none",
            fontWeight: 600,
            borderBottom: "1px solid transparent",
            transition: "border-color 200ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "var(--brand-accent-light)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
        >
          {cta} →
        </Link>
      </p>
      {showVoiceCta && (
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(14px, 2vw, 15px)",
            color: "var(--text-tertiary)",
            marginTop: 10,
            marginBottom: 0,
          }}
        >
          Or{" "}
          <Link
            href="/demo?start=voice"
            onClick={() =>
              posthog.capture("voice_agent_cta_clicked", {
                source: "inline_cta",
              })
            }
            style={{
              color: "var(--brand-accent-light)",
              textDecoration: "none",
              fontWeight: 600,
              borderBottom: "1px solid transparent",
              transition: "border-color 200ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = "var(--brand-accent-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
          >
            try the voice agent →
          </Link>
        </p>
      )}
    </div>
  );
}
