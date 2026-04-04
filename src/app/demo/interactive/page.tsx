"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, BarChart3, Wallet, FileText, TrendingUp, Wrench, FileEdit, Search, CheckCircle, Download, Send } from "lucide-react";
import DemoOverlay from "@/components/demo/DemoOverlay";
import { askEndallDemo } from "@/components/demo/ask-endall-config";
import ChatMessage from "@/components/chat/ChatMessage";

// Simulated quick actions (mirrors real QUICK_ACTIONS)
const DEMO_ACTIONS = [
  { id: "financial_model", label: "Build a financial model", description: "P&L, cash flow, job margins, KPI dashboard", icon: BarChart3, color: "#3b82f6" },
  { id: "generate_budget", label: "Generate a budget", description: "Monthly budget with targets and tracking", icon: Wallet, color: "#10b981" },
  { id: "npv_analysis", label: "Analyze project returns", description: "NPV, IRR, sensitivity analysis on a specific bid", icon: TrendingUp, color: "#f59e0b" },
  { id: "project_estimate", label: "Estimate a project", description: "Labor, materials, subs, timeline, margins", icon: Wrench, color: "#ef4444" },
  { id: "proposal", label: "Draft a proposal", description: "Scoped SOW with pricing for a specific job", icon: FileEdit, color: "#06b6d4" },
  { id: "competitive_analysis", label: "Research competitors", description: "Report on competitors in your market", icon: Search, color: "#f97316" },
  { id: "review_financials", label: "Review my financials", description: "Monthly financial review with action items", icon: CheckCircle, color: "#84cc16" },
  { id: "capabilities_doc", label: "Create a capabilities doc", description: "Professional deck from your company profile", icon: FileText, color: "#8b5cf6" },
];

type SimMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: { filename: string }[];
};

export default function InteractiveDemoPage() {
  const [demoActive, setDemoActive] = useState(true);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate the NPV flow for the demo
  const simulateNpv = useCallback(async () => {
    setSelectedAction("npv_analysis");
    setMessages([{
      id: "1",
      role: "user",
      content: "[Analyze project returns]",
    }]);
    setLoading(true);

    // Phase 1: asking for details
    await new Promise((r) => setTimeout(r, 1500));
    setMessages((prev) => [...prev, {
      id: "2",
      role: "assistant",
      content: "I'll build an NPV analysis for you. I need a few details:\n\n1. **Project name** and type\n2. **Total contract value**\n3. **Duration** (months)\n4. **Cost breakdown** — labor %, materials %, subs %\n5. **Discount rate** (or I'll use 10%)\n\nGive me what you have and I'll fill in MEP industry benchmarks for the rest.",
    }]);
    setLoading(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;
    const userMsg: SimMessage = { id: String(Date.now()), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate generation phases
    const phases = [
      { delay: 0, msg: "Building your document..." },
      { delay: 2000, msg: "Running calculations..." },
      { delay: 4000, msg: "Formatting workbook and applying formulas..." },
    ];
    phases.forEach((p) => setTimeout(() => setLoadingPhase(p.msg), p.delay));

    // Simulate completion
    setTimeout(() => {
      setLoading(false);
      setLoadingPhase("");
      setMessages((prev) => [...prev, {
        id: String(Date.now() + 1),
        role: "assistant",
        content: "Your NPV analysis is ready. Here's what I built:\n\n- **6 tabs**: How to Use, Assumptions, Cash Flow, Sensitivity, Summary, Executive Summary\n- **268 live formulas** — all dynamic, all editable\n- **Go/No-Go recommendation** based on your inputs\n- **Sensitivity analysis** at +10%, +20%, +30% cost overruns\n\nThe file is ready to download below.",
        files: [{ filename: "NPV_DataCenter_HVAC_2026.xlsx" }],
      }]);
    }, 6000);
  }, [input]);

  const handleActionClick = useCallback((actionId: string) => {
    if (actionId === "npv_analysis") {
      simulateNpv();
    }
  }, [simulateNpv]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0A0A0B", color: "#ccc" }}>
      {/* Top bar */}
      <header
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: "#fff" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>ask endall</span>
          <span
            style={{
              fontSize: 10,
              color: "#f59e0b",
              background: "rgba(245,158,7,0.15)",
              border: "1px solid rgba(245,158,7,0.3)",
              padding: "2px 8px",
              borderRadius: 4,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Interactive Demo
          </span>
        </div>
        <a
          href="/demo"
          style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}
        >
          Exit to demo request
        </a>
      </header>

      {/* Chat area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", maxWidth: 768, margin: "0 auto", width: "100%" }}>
        {messages.length === 0 && (
          <div style={{ paddingTop: 40 }}>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16, textAlign: "center" }}>
              Try any action below to see Endall in action:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 480, margin: "0 auto" }}>
              {DEMO_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  data-demo={action.id === "npv_analysis" ? "action-npv" : undefined}
                  onClick={() => handleActionClick(action.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: `3px solid ${action.color}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                >
                  <action.icon size={16} style={{ color: action.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{action.label}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: msg.role === "user" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${msg.role === "user" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div style={{ fontSize: 15, color: msg.role === "user" ? "#fff" : "#ccc", lineHeight: 1.65 }}>
                <ChatMessage role={msg.role} content={msg.content} />
              </div>
              {msg.files && msg.files.length > 0 && (
                <div data-demo="file-download" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {msg.files.map((f) => (
                    <div
                      key={f.filename}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        borderRadius: 8,
                        color: "#60a5fa",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <Download size={14} />
                      <span>{f.filename}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div
              data-demo="progress-bar"
              style={{
                padding: "12px 16px",
                borderRadius: "12px 12px 12px 2px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 200,
              }}
            >
              {loadingPhase && (
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.4 }}>{loadingPhase}</div>
              )}
              <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <div className="demo-progress-fill" style={{ height: "100%", background: "#fff", borderRadius: 2 }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 24px", paddingBottom: "max(12px, env(safe-area-inset-bottom))", borderTop: "1px solid rgba(255,255,255,0.06)", maxWidth: 768, margin: "0 auto", width: "100%", display: "flex", gap: 8 }}>
        <textarea
          data-demo="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask anything..."
          rows={2}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 15,
            color: "#fff",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() ? "#3b82f6" : "rgba(255,255,255,0.06)",
            color: input.trim() ? "#fff" : "#666",
            border: "none",
            borderRadius: 10,
            padding: "0 16px",
            minHeight: 42,
            cursor: input.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-end",
          }}
        >
          <Send size={16} />
        </button>
      </div>

      {/* Demo overlay */}
      {demoActive && (
        <DemoOverlay
          config={askEndallDemo}
          onComplete={() => setDemoActive(false)}
          onExit={() => setDemoActive(false)}
        />
      )}

      <style jsx>{`
        @keyframes demo-progress-slide {
          0% { transform: translateX(-100%); width: 40%; }
          50% { width: 60%; }
          100% { transform: translateX(300%); width: 40%; }
        }
        .demo-progress-fill {
          animation: demo-progress-slide 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
