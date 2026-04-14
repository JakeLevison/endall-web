"use client";

import Link from "next/link";

import { posthog } from "@/lib/posthog";

// Lightweight centered text CTA — used between marketing sections to give
// readers a natural off-ramp without a full banner. Amber accent only on
// the link itself; no full-width background.
export default function InlineCTA({
  lead,
  cta,
  href,
}: {
  lead: string;
  cta: string;
  href: string;
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
    </div>
  );
}
