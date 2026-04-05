"use client";

import Link from "next/link";
import { useState } from "react";
import ScrollReveal from "@/components/shared/ScrollReveal";

const AVG_JOB_VALUE = 2500;
const CLOSE_RATE = 0.15;
const WEEKS_PER_MONTH = 4.3;

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function RoiCalculator() {
  const [staff, setStaff] = useState(1);
  const [monthlyCost, setMonthlyCost] = useState(4000);
  const [missedCalls, setMissedCalls] = useState(5);

  const lostRevenue = missedCalls * WEEKS_PER_MONTH * AVG_JOB_VALUE * CLOSE_RATE;
  const total = monthlyCost + lostRevenue;

  return (
    <ScrollReveal>
      <section style={{ padding: "80px 16px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: "48px",
            }}
          >
            Do the math.
          </h2>

          <div
            style={{
              background: "var(--overlay-weak)",
              border: "1px solid var(--overlay-medium)",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <SliderRow
              label="How many office or admin staff do you have?"
              value={staff}
              min={0}
              max={5}
              step={1}
              display={staff === 1 ? "1 person" : `${staff} people`}
              onChange={setStaff}
            />
            <SliderRow
              label="What do you pay them per month, total?"
              value={monthlyCost}
              min={0}
              max={15000}
              step={500}
              display={`$${fmt(monthlyCost)}`}
              onChange={setMonthlyCost}
            />
            <SliderRow
              label="How many calls do you miss per week?"
              value={missedCalls}
              min={0}
              max={20}
              step={1}
              display={`${missedCalls} call${missedCalls === 1 ? "" : "s"}`}
              onChange={setMissedCalls}
            />

            <div
              style={{
                marginTop: "28px",
                paddingTop: "24px",
                borderTop: "1px solid var(--overlay-medium)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <OutputRow label="Current admin cost" value={`$${fmt(monthlyCost)}/month`} />
              <OutputRow
                label="Estimated lost revenue from missed calls"
                value={`$${fmt(lostRevenue)}/month`}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: "10px",
                  paddingTop: "14px",
                  borderTop: "1px dashed var(--overlay-medium)",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "15px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  Total monthly cost of not automating
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "clamp(28px, 5vw, 36px)",
                    fontWeight: 600,
                    color: "#10b981",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ${fmt(total)}
                </span>
              </div>
            </div>
          </div>

          <p
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "16px",
              lineHeight: 1.5,
            }}
          >
            Missed-call revenue based on $2,500 average job value and 15% close
            rate. Your results may vary.
          </p>

          <div
            style={{
              marginTop: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Link
              href="/contact"
              style={{
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
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-inverse)")}
            >
              See how Endall can help
            </Link>
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "12px",
                color: "var(--text-muted)",
              }}
            >
              Month-to-month. Cancel anytime.
            </p>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "10px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "14px",
            color: "var(--text-tertiary)",
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "15px",
            color: "var(--text-primary)",
            fontWeight: 600,
          }}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "#10b981",
          cursor: "pointer",
          minHeight: "44px",
        }}
      />
    </div>
  );
}

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "14px",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "16px",
          color: "var(--text-secondary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
