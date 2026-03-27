"use client";

import { useEffect, useState, useRef } from "react";

function CountUp({ target, suffix = "", delay = 0 }: { target: number; suffix?: string; delay?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1200;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);

  return <span>{value.toLocaleString()}{suffix}</span>;
}

const tableData = [
  { company: "Acme Corp", value: "$48,000", stage: "Negotiation", status: "Active" },
  { company: "TechFlow", value: "$32,500", stage: "Proposal", status: "Active" },
  { company: "Meridian Labs", value: "$67,200", stage: "Closed Won", status: "Won" },
  { company: "Apex Digital", value: "$21,000", stage: "Discovery", status: "New" },
];

export default function DashboardMock() {
  const [isTouch, setIsTouch] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  // After entrance animation finishes (600ms anim + 400ms delay = 1000ms),
  // remove the animation so the static CSS class + :hover can take effect.
  // We use setTimeout instead of animationend because animationend bubbles
  // from child elements (stagger-fadein on rows/cards) and fires too early.
  useEffect(() => {
    if (isTouch) return;
    const timer = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.style.animation = "none";
      }
      setAnimDone(true);
    }, 1100); // 400ms delay + 600ms duration + 100ms safety margin
    return () => clearTimeout(timer);
  }, [isTouch]);

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "0 16px",
        perspective: isTouch ? "none" : "1200px",
      }}
    >
      <div
        ref={cardRef}
        className={`dashboard-mock${isTouch ? " dashboard-mock--touch" : ""}`}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
          position: "relative",
          backfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
          animation: isTouch
            ? "dashboard-fadein-flat 600ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both"
            : animDone
              ? "none"
              : "dashboard-fadein 600ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both",
          willChange: animDone ? "auto" : "transform, opacity",
        }}
      >
        {/* Shimmer line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              animation: "shimmer 3s linear infinite",
            }}
          />
        </div>

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            animation: "stagger-fadein 600ms cubic-bezier(0.16, 1, 0.3, 1) 480ms both",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "14px",
              color: "#ffffff",
            }}
          >
            endall
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Pipeline", "Sequences", "Workflows", "Tasks"].map((tab) => (
              <span
                key={tab}
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: "11px",
                  color: tab === "Pipeline" ? "#ffffff" : "var(--text-muted)",
                }}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div
          className="grid grid-cols-2 md:grid-cols-3"
          style={{
            padding: "16px 20px",
            gap: "12px",
            animation: "stagger-fadein 600ms cubic-bezier(0.16, 1, 0.3, 1) 560ms both",
          }}
        >
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              Revenue
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "22px",
                fontWeight: 500,
                color: "#ffffff",
              }}
            >
              $<CountUp target={284} suffix="k" delay={1200} />
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "10px",
                color: "#4ade80",
                marginTop: "4px",
              }}
            >
              +23%
            </div>
          </div>

          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              Active Deals
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "22px",
                fontWeight: 500,
                color: "#ffffff",
              }}
            >
              <CountUp target={47} delay={1200} />
            </div>
          </div>

          <div
            className="hidden md:block"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "10px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              Emails Sent
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "22px",
                fontWeight: 500,
                color: "#ffffff",
              }}
            >
              <CountUp target={3812} delay={1200} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            padding: "0 20px 16px",
            animation: "stagger-fadein 600ms cubic-bezier(0.16, 1, 0.3, 1) 640ms both",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Company", "Value", "Stage", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      textAlign: "left",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 400,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 4).map((row, i) => (
                <tr
                  key={row.company}
                  className={i >= 2 ? "hidden md:table-row" : ""}
                  style={{
                    opacity: 0,
                    animation: `stagger-fadein 600ms cubic-bezier(0.16, 1, 0.3, 1) ${720 + i * 80}ms both`,
                  }}
                >
                  <td
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {row.company}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {row.value}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "12px",
                      color: "var(--text-tertiary)",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {row.stage}
                  </td>
                  <td
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: "10px",
                        color:
                          row.status === "Won"
                            ? "#4ade80"
                            : row.status === "New"
                              ? "#60a5fa"
                              : "var(--text-tertiary)",
                        backgroundColor:
                          row.status === "Won"
                            ? "rgba(74, 222, 128, 0.1)"
                            : row.status === "New"
                              ? "rgba(96, 165, 250, 0.1)"
                              : "rgba(255, 255, 255, 0.05)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        @keyframes dashboard-fadein {
          from {
            opacity: 0;
            transform: translateY(40px) rotateX(3deg) rotateY(-1.5deg);
          }
          to {
            opacity: 1;
            transform: rotateX(3deg) rotateY(-1.5deg);
          }
        }
        @keyframes dashboard-fadein-flat {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes stagger-fadein {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dashboard-mock {
          transform: rotateX(3deg) rotateY(-1.5deg);
          transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .dashboard-mock:hover {
          transform: rotateX(0deg) rotateY(0deg);
        }
        .dashboard-mock--touch {
          transform: none !important;
        }
        @media (hover: none) {
          .dashboard-mock {
            transform: none !important;
          }
          .dashboard-mock:hover {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
