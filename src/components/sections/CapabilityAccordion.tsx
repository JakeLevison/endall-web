"use client";

import { useState } from "react";
import { ChevronDown, Phone, Sunrise, Send, FileEdit, LineChart, Search } from "lucide-react";
import type { ReactNode } from "react";

type Card = {
  id: string;
  icon: ReactNode;
  title: string;
  collapsed: string;
  expanded: string;
  comingSoon?: string;
};

const CARDS: Card[] = [
  {
    id: "front-desk",
    icon: <Phone size={18} />,
    title: "Front Desk",
    collapsed: "Every call answered. Every lead captured. 24/7.",
    expanded:
      "When your phone rings, Endall picks up. It sounds like a real person - friendly, professional, natural. It asks the right questions, figures out what the caller needs, and books the job on your calendar. If it's urgent, you get a text immediately. If it's a tire-kicker, Endall takes care of it so you don't have to.",
  },
  {
    id: "morning-briefing",
    icon: <Sunrise size={18} />,
    title: "Morning Briefing",
    collapsed: "Your daily ops report. No meetings required.",
    expanded:
      "Every morning at 6 AM, before your first coffee, Endall sends you a one-page briefing. What happened yesterday. What's on deck today. What needs your attention. No meetings. No catch-up calls. Just clarity.",
  },
  {
    id: "sales-outreach",
    icon: <Send size={18} />,
    title: "Sales & Outreach",
    collapsed: "Prospecting, follow-ups, and pipeline - on autopilot.",
    expanded:
      "Endall finds prospects in your market, writes personalized emails in your voice, follows up on a cadence, and alerts you when someone's interested. You don't touch it until there's a meeting to take.",
  },
  {
    id: "estimating",
    icon: <FileEdit size={18} />,
    title: "Estimating & Proposals",
    collapsed: "Bid faster. Win more. Guess less.",
    expanded:
      "Tell Endall the job - 200-amp panel upgrade, 4,000 sq ft commercial space - and it generates a detailed estimate in under a minute. Material costs, labor hours, margin targets, formatted proposal ready to send.",
  },
  {
    id: "financial-ops",
    icon: <LineChart size={18} />,
    title: "Financial Ops",
    collapsed: "Margins, invoices, and cash flow - always visible.",
    expanded:
      "Endall tracks your margins on every job - estimated vs. actual. It flags jobs that are bleeding money before they finish. It shows you which customers pay on time and which don't. No spreadsheets. No guessing.",
    comingSoon: "QuickBooks integration coming soon",
  },
  {
    id: "competitive-intel",
    icon: <Search size={18} />,
    title: "Competitive Intel",
    collapsed: "Know your market. Win your bids.",
    expanded:
      "Ask Endall who's bidding on data center work in your corridor. It pulls public records, analyzes competitor pricing patterns, and tells you where you have an edge.",
  },
];

export default function CapabilityAccordion() {
  const [openId, setOpenId] = useState<string | null>("front-desk");

  return (
    <section id="how-it-works" style={{ padding: "80px 16px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "3px",
            color: "var(--text-muted)",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          What Endall does
        </p>
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
          One AI ops team. Every role covered.
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {CARDS.map((card) => {
            const isOpen = openId === card.id;
            return (
              <div
                key={card.id}
                style={{
                  border: "1px solid var(--overlay-medium)",
                  borderRadius: "12px",
                  background: isOpen ? "var(--overlay-weak)" : "var(--overlay-soft)",
                  overflow: "hidden",
                  transition: "background 200ms ease",
                }}
              >
                <button
                  onClick={() => setOpenId(isOpen ? null : card.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: isOpen ? "18px 20px 14px" : "16px 20px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    minHeight: "56px",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-primary)",
                      display: "flex",
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: "2px",
                      }}
                    >
                      {card.title}
                      {card.comingSoon && (
                        <span
                          style={{
                            marginLeft: "10px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            color: "#f59e0b",
                            background: "rgba(245,158,7,0.1)",
                            border: "1px solid rgba(245,158,7,0.3)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 500,
                            verticalAlign: "middle",
                          }}
                        >
                          Soon
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: "14px",
                        color: "var(--text-tertiary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {card.collapsed}
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      color: "var(--text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                      flexShrink: 0,
                    }}
                  />
                </button>

                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: "grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        padding: "0 20px 20px 52px",
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: "15px",
                        color: "var(--text-secondary)",
                        lineHeight: 1.65,
                      }}
                    >
                      {card.expanded}
                      {card.comingSoon && (
                        <div
                          style={{
                            marginTop: "10px",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {card.comingSoon}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "clamp(15px, 2.2vw, 17px)",
            color: "var(--text-tertiary)",
            textAlign: "center",
            marginTop: "48px",
            fontStyle: "italic",
          }}
        >
          And this is just what it does before you ask it anything.
        </p>
      </div>
    </section>
  );
}
