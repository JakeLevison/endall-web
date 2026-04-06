"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import ScrollReveal from "@/components/shared/ScrollReveal";

const AVG_JOB_VALUE = 2500;
const CLOSE_RATE = 0.15;
const WEEKS_PER_MONTH = 4.3;
const PAY_PER_STAFF = 4000; // default monthly admin pay per head
const PAY_STEP = 500;
const PAY_MAX = 25000;

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Round to the slider's step grid so the default value always lands on a valid tick.
function snapToStep(n: number, step: number) {
  return Math.round(n / step) * step;
}

function suggestedPay(staff: number): number {
  if (staff <= 0) return 0;
  return snapToStep(Math.min(PAY_MAX, staff * PAY_PER_STAFF), PAY_STEP);
}

export default function RoiCalculator() {
  const [staff, setStaff] = useState(1);
  const [monthlyCost, setMonthlyCost] = useState(() => suggestedPay(1));
  const [missedCalls, setMissedCalls] = useState(5);
  const userTouchedPay = useRef(false);

  // Update pay slider alongside staff changes. While the user hasn't touched
  // pay, it tracks N × $4,000. Once they drag it, we leave it alone — except
  // moving back to 0 staff forces pay to $0 and re-arms auto-tracking.
  const handleStaffChange = (n: number) => {
    setStaff(n);
    if (n === 0) {
      setMonthlyCost(0);
      userTouchedPay.current = false;
      return;
    }
    if (!userTouchedPay.current) {
      setMonthlyCost(suggestedPay(n));
    }
  };

  const handlePayChange = (v: number) => {
    userTouchedPay.current = true;
    setMonthlyCost(v);
  };

  // Admin cost === whatever the pay slider shows (it already represents total
  // admin spend across all staff). Zero when no staff.
  const adminCost = staff > 0 ? monthlyCost : 0;
  const lostRevenue = missedCalls * WEEKS_PER_MONTH * AVG_JOB_VALUE * CLOSE_RATE;
  const total = adminCost + lostRevenue;

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
            Run your numbers.
          </h2>

          <div
            style={{
              background: "var(--overlay-weak)",
              border: "1px solid var(--overlay-medium)",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            <SliderRow
              label="How many office or admin staff do you have?"
              value={staff}
              min={0}
              max={5}
              step={1}
              display={staff === 1 ? "1 person" : `${staff} people`}
              onChange={handleStaffChange}
            />
            <SliderRow
              label="What do you pay them per month in total (all staff combined)?"
              value={monthlyCost}
              min={0}
              max={PAY_MAX}
              step={PAY_STEP}
              display={staff === 0 ? "$0" : `$${fmt(monthlyCost)}`}
              onChange={handlePayChange}
              disabled={staff === 0}
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
              <OutputRow label="Current admin cost" value={`$${fmt(adminCost)}/month`} />
              <OutputRow
                label="Estimated lost revenue from missed calls"
                value={`$${fmt(lostRevenue)}/month`}
              />
              <div
                style={{
                  marginTop: "10px",
                  paddingTop: "14px",
                  borderTop: "1px dashed var(--overlay-medium)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
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
                    Monthly cost of not automating
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                    }}
                  >
                    ${fmt(total)}
                  </span>
                </div>
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
                      fontSize: "15px",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    Annual cost of not automating
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "clamp(32px, 6vw, 44px)",
                      fontWeight: 700,
                      color: "var(--brand-accent-light)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    ${fmt(total * 12)}
                  </span>
                </div>
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
              marginTop: "48px",
              paddingBottom: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
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
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: "24px", opacity: disabled ? 0.4 : 1 }}>
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
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--brand-accent-light)",
          cursor: disabled ? "not-allowed" : "pointer",
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
