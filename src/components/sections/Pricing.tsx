"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ShimmerBorder from "@/components/shared/ShimmerBorder";

const plans = [
  {
    name: "Starter",
    price: 0,
    priceLabel: "Free",
    sub: "For individuals",
    features: ["500 contacts", "Basic sequences", "AI assistant", "Email sync"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: 49,
    priceLabel: "$49",
    period: "/user/mo",
    sub: "For teams",
    features: ["Unlimited contacts", "Advanced workflows", "Full automation", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 0,
    priceLabel: "Custom",
    sub: "For organizations",
    features: ["Unlimited everything", "Dedicated instance", "Custom integrations", "SLA"],
    highlighted: false,
  },
];

function AnimatedPrice({ target, label, isVisible }: { target: number; label: string; isVisible: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible || target === 0) return;
    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isVisible, target]);

  if (target === 0) {
    return <span>{label}</span>;
  }

  return <span>${isVisible ? count : 0}</span>;
}

function PricingCard({ plan, isVisible }: { plan: typeof plans[number]; isVisible: boolean }) {
  const card = (
    <div
      style={{
        background: "#111",
        border: `1px solid ${plan.highlighted ? "#333" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 12,
        padding: 28,
        transform: plan.highlighted ? "translateY(-8px)" : "none",
        boxShadow: plan.highlighted ? "0 0 80px rgba(255,255,255,0.03)" : "none",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Most popular badge */}
      {plan.highlighted && (
        <div
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "2px",
            background: "#fff",
            color: "#000",
            padding: "4px 12px",
            borderRadius: 4,
            display: "inline-block",
            marginBottom: 12,
          }}
        >
          Most popular
        </div>
      )}

      {/* Plan name */}
      <div
        style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#666",
          marginBottom: 16,
        }}
      >
        {plan.name}
      </div>

      {/* Price */}
      <div
        style={{
          fontFamily: "var(--font-serif, 'EB Garamond', serif)",
          fontSize: 36,
          color: "#fff",
          fontWeight: 400,
          marginBottom: 2,
        }}
      >
        <AnimatedPrice target={plan.price} label={plan.priceLabel} isVisible={isVisible} />
        {plan.period && (
          <span
            style={{
              fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
              fontSize: 13,
              color: "#666",
              fontWeight: 400,
            }}
          >
            {plan.period}
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
          fontSize: 12,
          color: "#666",
          marginBottom: 20,
        }}
      >
        {plan.sub}
      </p>

      {/* Features */}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px 0" }}>
        {plan.features.map((f) => (
          <li
            key={f}
            style={{
              fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
              fontSize: 13,
              color: "#888",
              padding: "4px 0",
            }}
          >
            {f}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href="/dashboard"
        style={{
          display: "block",
          textAlign: "center",
          padding: "10px 20px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          transition: "opacity 0.2s ease",
          ...(plan.highlighted
            ? { background: "#fff", color: "#000" }
            : { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }),
        }}
      >
        {plan.name === "Enterprise" ? "Contact Us" : "Get Started"}
      </Link>
    </div>
  );

  if (plan.highlighted) {
    return <ShimmerBorder>{card}</ShimmerBorder>;
  }

  return card;
}

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" style={{ padding: "80px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#666",
            textAlign: "center",
            marginBottom: 48,
          }}
        >
          Pricing
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            alignItems: "start",
            paddingTop: 16,
          }}
          className="pricing-grid"
        >
          {plans.map((plan) => (
            <div key={plan.name} className={plan.highlighted ? "pricing-highlighted" : ""}>
              <PricingCard plan={plan} isVisible={isVisible} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            max-width: 400px;
            margin: 0 auto;
          }
          .pricing-highlighted {
            order: -1;
          }
        }
      `}</style>
    </section>
  );
}
