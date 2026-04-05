"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Floating "Book a Demo" pill for mobile. Fades in after scrolling past the
// hero, fades out when the FinalCTA section approaches viewport (no need to
// double up on the page's own CTA).
export default function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const y = window.scrollY;
      const past = y > 700; // roughly past hero
      const finalCta = document.getElementById("final-cta");
      let nearBottom = false;
      if (finalCta) {
        const rect = finalCta.getBoundingClientRect();
        // hide pill once the FinalCTA is within the lower half of the viewport
        nearBottom = rect.top < window.innerHeight * 0.8;
      }
      setVisible(past && !nearBottom);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <Link
      href="/contact?intent=book_demo"
      className="md:hidden"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      style={{
        position: "fixed",
        left: "50%",
        bottom: "20px",
        transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        zIndex: 90,
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: 16,
        fontWeight: 600,
        color: "#1a1a1a",
        backgroundColor: "var(--brand-accent-light)",
        padding: "14px 28px",
        borderRadius: 999,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)",
        textDecoration: "none",
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        transition: "opacity 220ms ease, transform 220ms ease",
      }}
    >
      Book a Demo
    </Link>
  );
}
