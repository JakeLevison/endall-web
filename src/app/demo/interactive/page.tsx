"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, BarChart3, Wallet, FileText, TrendingUp, Wrench, FileEdit, Search, CheckCircle, Download, Send } from "lucide-react";
import DemoOverlay from "@/components/demo/DemoOverlay";
import DemoProgressBar from "@/components/demo/DemoProgressBar";
import { askEndallDemo } from "@/components/demo/ask-endall-config";
import {
  getDemoPresets,
  getDemoCompanyOrEmpty,
  type DemoFile,
} from "@/data/demo-presets";
import ChatMessage from "@/components/chat/ChatMessage";

// Extract a filename from a Content-Disposition header, or null if absent /
// malformed. The bridge is the source of truth for the filename — it knows
// the fallback company name used inside the workbook, which may differ from
// anything the client could compute (localStorage might be empty, in which
// case the bridge substitutes its own neutral name).
function filenameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null;
  const m = /filename="?([^";]+)"?/i.exec(cd);
  return m ? m[1] : null;
}

async function fetchPresetFile(file: DemoFile): Promise<void> {
  const resp = await fetch(`/api/demo/${file.presetPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name: getDemoCompanyOrEmpty(),
      // NPV preset requires a contract_value; pick a reasonable demo default
      // matching the chat copy ("$4.25M contract"). Other presets ignore it.
      contract_value: file.presetPath === "npv" ? 4_250_000 : undefined,
    }),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(err || `HTTP ${resp.status}`);
  }
  // Prefer the bridge's Content-Disposition filename so the filename matches
  // the company name actually used inside the file. Fall back to the
  // client-computed filename if the header is missing.
  const downloadName =
    filenameFromContentDisposition(resp.headers.get("Content-Disposition")) ||
    file.filename;
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Defer revoke so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

// Preset quick actions (mirrors real QUICK_ACTIONS). Each ID maps to a cached
// response in DEMO_PRESETS so the demo feels instant.
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
  files?: DemoFile[];
};

// Mirrors DemoProgressBar's internal 250ms fade after `done=true`. The final
// chat bubble appends at delay + FINISH_TAIL_MS so the bar has time to show
// "Done" before it unmounts.
const FINISH_TAIL_MS = 250;

export default function InteractiveDemoPage() {
  const [demoActive, setDemoActive] = useState(true);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressDone, setProgressDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Schedule the progress bar's fake work and the append of the final bubble.
  // The final message is captured by value in this closure — no ref, no
  // callback from DemoProgressBar — so it survives React 19 StrictMode
  // double-invocation of the state updater.
  const scheduleFinalMessage = useCallback(
    (finalMsg: SimMessage, delayMs: number) => {
      setProgressDone(false);
      setLoading(true);
      setTimeout(() => setProgressDone(true), delayMs);
      setTimeout(() => {
        setLoading(false);
        setMessages((prev) => [...prev, finalMsg]);
      }, delayMs + FINISH_TAIL_MS);
    },
    []
  );

  const runPreset = useCallback(
    (presetId: string) => {
      const preset = getDemoPresets()[presetId];
      if (!preset) return;

      setMessages([
        { id: "u-" + presetId, role: "user", content: preset.userMessage },
      ]);

      const finalMsg: SimMessage = {
        id: "r-" + presetId,
        role: "assistant",
        content: preset.response,
        files: preset.files,
      };
      const delay = preset.renderDelayMs ?? 1000;

      if (preset.intro) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { id: "i-" + presetId, role: "assistant", content: preset.intro! },
          ]);
          scheduleFinalMessage(finalMsg, delay);
        }, 600);
      } else {
        scheduleFinalMessage(finalMsg, delay);
      }
    },
    [scheduleFinalMessage]
  );

  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;
    const userMsg: SimMessage = {
      id: String(Date.now()),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const q = userMsg.content.toLowerCase();
    const keywordMatch: Array<[string, string[]]> = [
      ["npv_analysis", ["npv", "return", "irr"]],
      ["project_estimate", ["estimate", "bid", "cost"]],
      ["proposal", ["proposal", "sow"]],
      ["generate_budget", ["budget"]],
      ["financial_model", ["financial model", "p&l", "model"]],
      ["review_financials", ["review", "financials", "variance"]],
      ["competitive_analysis", ["competitor", "market", "competitive"]],
      ["capabilities_doc", ["capabilities", "deck", "company profile"]],
    ];
    const matched = keywordMatch.find(([, kws]) =>
      kws.some((k) => q.includes(k))
    );
    const presets = getDemoPresets();
    const preset = matched ? presets[matched[0]] : null;

    const finalMsg: SimMessage = preset
      ? {
          id: "r-" + Date.now(),
          role: "assistant",
          content: preset.response,
          files: preset.files,
        }
      : {
          id: "r-" + Date.now(),
          role: "assistant",
          content:
            "That's a great question. In the full product, Endall would pull your actual pipeline, crew data, and financials to answer this. Try one of the preset actions to see a complete example.",
        };
    scheduleFinalMessage(finalMsg, preset?.renderDelayMs ?? 1600);
  }, [input, scheduleFinalMessage]);

  const handleActionClick = useCallback(
    (actionId: string) => {
      runPreset(actionId);
    },
    [runPreset]
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: "var(--text-secondary)" }}>
      {/* Top bar */}
      <header
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid var(--overlay-soft)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: "var(--text-primary)" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>ask endall</span>
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
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, textAlign: "center" }}>
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
                    background: "var(--overlay-weak)",
                    border: "1px solid var(--overlay-soft)",
                    borderLeft: `3px solid ${action.color}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--overlay-soft)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--overlay-weak)")}
                >
                  <action.icon size={16} style={{ color: action.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{action.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{action.description}</div>
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
                background: msg.role === "user" ? "var(--overlay-medium)" : "var(--overlay-weak)",
                border: `1px solid ${msg.role === "user" ? "var(--overlay-medium)" : "var(--overlay-soft)"}`,
              }}
            >
              <div style={{ fontSize: 15, color: msg.role === "user" ? "var(--text-primary)" : "var(--text-secondary)", lineHeight: 1.65 }}>
                <ChatMessage role={msg.role} content={msg.content} />
              </div>
              {msg.files && msg.files.length > 0 && (
                <div data-demo="file-download" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {msg.files.map((f) => (
                    <button
                      key={f.filename}
                      type="button"
                      onClick={async () => {
                        try {
                          await fetchPresetFile(f);
                        } catch (err) {
                          console.error("demo preset download failed:", err);
                        }
                      }}
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
                        fontFamily: "inherit",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.1)")}
                    >
                      <Download size={14} />
                      <span>{f.filename}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <DemoProgressBar done={progressDone} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 24px", paddingBottom: "max(12px, env(safe-area-inset-bottom))", borderTop: "1px solid var(--overlay-soft)", maxWidth: 768, margin: "0 auto", width: "100%", display: "flex", gap: 8 }}>
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
            background: "var(--overlay-soft)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 15,
            color: "var(--text-primary)",
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
            background: input.trim() ? "#3b82f6" : "var(--overlay-soft)",
            color: input.trim() ? "var(--text-primary)" : "var(--text-muted)",
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
    </div>
  );
}
