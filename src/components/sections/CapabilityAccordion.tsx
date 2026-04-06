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
};

const CARDS: Card[] = [
  {
    id: "sales-outreach",
    icon: <Send size={18} />,
    title: "Lead Qualification & Outreach",
    collapsed: "Prospecting, follow-ups, and pipeline — on autopilot.",
    expanded:
      "Endall finds prospects in your corridor, writes personalized emails in your voice, follows up on a cadence, and alerts you when someone's interested. You don't touch it until there's a meeting to take.",
  },
  {
    id: "estimating",
    icon: <FileEdit size={18} />,
    title: "Estimating & Proposals",
    collapsed: "Bid faster. Win more. Guess less.",
    expanded:
      "You just won a data center subcontract. Tell Endall the scope — 200-amp panel upgrade, 4,000 sq ft commercial rough-in — and it generates a detailed estimate in under a minute. Material costs, labor hours, margin targets, branded proposal ready to send. Under 5 minutes from scope to proposal.",
  },
  {
    id: "morning-briefing",
    icon: <Sunrise size={18} />,
    title: "Morning Briefing",
    collapsed: "Your daily ops report. No meetings required.",
    expanded:
      "It's Monday morning. Before your first coffee, Endall sends you a one-page briefing. Three new leads, two overdue invoices, one job hitting margin targets, one that isn't. What needs your attention today. No meetings. No catch-up calls. Just clarity.",
  },
  {
    id: "financial-ops",
    icon: <LineChart size={18} />,
    title: "Financial Ops",
    collapsed: "Your back-office finance team. Margins, invoices, cash flow — always visible.",
    expanded:
      "Endall connects to QuickBooks and becomes your back-office finance team. It tracks margin on every job — estimated vs. actual — and flags jobs bleeding money before they finish. It shows you who's paid, who's overdue, and how much is outstanding. It forecasts cash flow weekly. Ask Endall: 'Am I profitable this month?' 'Which jobs are losing money?' 'Who hasn't paid me?' — you get the real answer, from real data.",
  },
  {
    id: "competitive-intel",
    icon: <Search size={18} />,
    title: "Competitive Intel",
    collapsed: "Active market research. On your behalf. Continuously.",
    expanded:
      "Endall researches your market without being asked. It tracks who's bidding on data center work in your corridor, watches competitor pricing patterns in public records, and surfaces gaps where you have an edge. Ask 'who are the other electrical bidders on Loudoun DC-14?' and you get a real answer — not a Google search summary.",
  },
  {
    id: "front-desk",
    icon: <Phone size={18} />,
    title: "Front Desk",
    collapsed: "Every call answered. Every lead qualified. 24/7.",
    expanded:
      "A GC calls at 7 PM. Endall picks up. It sounds like a real person — friendly, professional, natural. It asks the right questions, figures out what the caller needs, and books the site visit on your calendar. If it's urgent, you get a text immediately. If it's a tire-kicker, Endall takes care of it so you don't have to.",
  },
];

export default function CapabilityAccordion() {
  const [openId, setOpenId] = useState<string | null>("sales-outreach");

  return (
    <>
      {/* Anchor aliases - both nav links land here */}
      <div id="features" style={{ scrollMarginTop: "100px" }} />
      <div id="how-it-works" style={{ scrollMarginTop: "100px" }} />
      <section style={{ padding: "80px 16px 40px" }}>
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
                    transition: "background 200ms ease, border-color 200ms ease, box-shadow 240ms ease",
                    borderColor: isOpen ? "var(--brand-accent-light)" : "var(--overlay-medium)",
                    boxShadow: isOpen ? "var(--shadow-card)" : "none",
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
                      padding: "16px 20px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      minHeight: "56px",
                      color: "inherit",
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        color: isOpen ? "var(--brand-accent-light)" : "var(--text-primary)",
                        display: "flex",
                        flexShrink: 0,
                        transition: "color 200ms ease",
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

                  {/* max-height transition avoids the 0fr→1fr grid
                      sub-pixel rendering bug that was drawing a thin
                      horizontal line right above expanded content. */}
                  <div
                    style={{
                      maxHeight: isOpen ? "400px" : "0",
                      overflow: "hidden",
                      transition: "max-height 320ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <div
                      style={{
                        padding: "4px 20px 20px 52px",
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: "15px",
                        color: "var(--text-secondary)",
                        lineHeight: 1.65,
                      }}
                    >
                      {card.expanded}
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
              marginTop: "32px",
              fontStyle: "italic",
            }}
          >
            And this is just what it does before you ask it anything.
          </p>
        </div>
      </section>
    </>
  );
}
