"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  File,
} from "lucide-react";
import { toast } from "sonner";

type FileAttachment = {
  file_id: string;
  filename: string;
  download_url: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
  previewHtml?: string;
};

type Action = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_ASK_ENDALL_BRIDGE_URL ||
  "https://ask-endall-bridge-production.up.railway.app";

const SKILLS_ACTIONS = new Set([
  "financial_model",
  "generate_budget",
  "capabilities_doc",
  "npv_analysis",
  "project_estimate",
  "proposal",
  "competitive_analysis",
  "review_financials",
  "swot_analysis",
]);

const QUICK_ACTIONS: Action[] = [
  { id: "financial_model", label: "Build a financial model", description: "P&L, cash flow, job margins, KPI dashboard", icon: "📊" },
  { id: "generate_budget", label: "Generate a budget", description: "Monthly budget with targets and tracking", icon: "💰" },
  { id: "capabilities_doc", label: "Create a capabilities doc", description: "Professional deck from your company profile", icon: "📄" },
  { id: "npv_analysis", label: "Analyze project returns", description: "NPV, IRR, sensitivity analysis on a specific bid", icon: "📈" },
  { id: "project_estimate", label: "Estimate a project", description: "Labor, materials, subs, timeline, margins", icon: "🔧" },
  { id: "proposal", label: "Draft a proposal", description: "Scoped SOW with pricing for a specific job", icon: "📝" },
  { id: "competitive_analysis", label: "Research competitors", description: "Report on competitors in your market", icon: "🔍" },
  { id: "review_financials", label: "Review my financials", description: "Monthly financial review with action items", icon: "✅" },
];

export default function AskEndallPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const [savedFiles, setSavedFiles] = useState<
    Array<{
      id: string;
      file_name: string;
      file_type: string;
      description: string;
      file_path: string;
      workflow: string;
      created_at: string;
    }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (activeTab === "files") {
      const sessionId = "web-" + (typeof window !== "undefined" ? window.location.hostname : "default");
      fetch(`${BRIDGE_URL}/files?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then((d) => setSavedFiles(d.files || []))
        .catch(() => setSavedFiles([]));
    }
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, action?: string) => {
      if (!text.trim() && !action) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: action
          ? `[${QUICK_ACTIONS.find((a) => a.id === action)?.label}] ${text || ""}`
          : text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      const currentWorkflow = action || activeWorkflow;
      if (action) {
        setActiveWorkflow(action);
      }

      const isSkillsWorkflow = !!(
        (action && SKILLS_ACTIONS.has(action)) ||
        (currentWorkflow && SKILLS_ACTIONS.has(currentWorkflow))
      );

      const phases = [
        { delay: 0, msg: "Building your document..." },
        { delay: 10000, msg: "Running calculations..." },
        { delay: 25000, msg: "Formatting workbook and applying conditional formatting..." },
        { delay: 45000, msg: "Finalizing and preparing download..." },
        { delay: 90000, msg: "This is taking longer than usual. Still working - complex models can take up to 2 minutes." },
      ];
      const phaseTimers: ReturnType<typeof setTimeout>[] = [];

      if (isSkillsWorkflow) {
        for (const phase of phases) {
          phaseTimers.push(setTimeout(() => setLoadingPhase(phase.msg), phase.delay));
        }
      }

      try {
        let data: { reply?: string; error?: string; files?: FileAttachment[]; previewHtml?: string };

        if (isSkillsWorkflow) {
          const resp = await fetch(`${BRIDGE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              action: action || currentWorkflow,
              session_id: "web-" + (typeof window !== "undefined" ? window.location.hostname : "default"),
            }),
          });

          if (!resp.ok) {
            const errText = await resp.text();
            let parsed: { detail?: string } = {};
            try { parsed = JSON.parse(errText); } catch { /* not JSON */ }
            const detail = parsed.detail || errText;

            let userMessage = "Something went wrong generating your file. Try again or ask me to simplify the request.";
            if (resp.status === 429 || detail.includes("rate_limit")) {
              userMessage = "We've hit a temporary limit. Please wait 30 seconds and try again.";
            } else if (detail.includes("timeout") || resp.status === 504) {
              userMessage = "Your request is taking longer than expected. Try refreshing in 30 seconds, or try again.";
            }
            throw new Error(userMessage);
          }

          const bridgeData = await resp.json();
          const files = (bridgeData.files || []).map((f: { file_id: string; filename: string }) => ({
            file_id: f.file_id,
            filename: f.filename,
            download_url: `${BRIDGE_URL}/download/${f.file_id}`,
          }));

          data = {
            reply: bridgeData.reply,
            files: files.length > 0 ? files : undefined,
            previewHtml: bridgeData.preview_html || undefined,
          };
        } else {
          const resp = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text,
              action,
              history: messages.map((m) => ({ role: m.role, content: m.content })),
            }),
          });
          data = await resp.json();
        }

        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || data.error || "Something went wrong.",
          timestamp: new Date(),
          files: data.files || undefined,
          previewHtml: data.previewHtml || undefined,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const errorMsg =
          err instanceof Error && err.message !== "Failed to fetch"
            ? err.message
            : isSkillsWorkflow
              ? "We're having trouble reaching our AI service. This usually resolves in a few minutes."
              : "Failed to connect to AI service. Please try again.";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: errorMsg,
            timestamp: new Date(),
          },
        ]);
      } finally {
        phaseTimers.forEach(clearTimeout);
        setLoadingPhase("");
        setLoading(false);
      }
    },
    [messages, activeWorkflow]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={16} style={{ color: "#fff" }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              fontFamily: "var(--font-sans), sans-serif",
            }}
          >
            ask endall
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 6,
              padding: 2,
            }}
          >
            {(["chat", "files"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: activeTab === tab ? "#fff" : "#555",
                  background: activeTab === tab ? "rgba(255,255,255,0.08)" : "none",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {tab === "chat" ? "Chat" : "My Files"}
              </button>
            ))}
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                setActiveWorkflow(null);
              }}
              title="New chat"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "#666",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
            >
              <RotateCcw size={14} />
              <span>New chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Files tab */}
      {activeTab === "files" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {savedFiles.length === 0 ? (
              <p
                style={{
                  fontSize: 13,
                  color: "#555",
                  textAlign: "center",
                  marginTop: 40,
                }}
              >
                No files generated yet. Use the Chat tab to create budgets, NPV
                analyses, and more.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedFiles.map((f) => {
                  const icon =
                    f.file_type === "xlsx"
                      ? FileSpreadsheet
                      : f.file_type === "pdf"
                        ? FileText
                        : File;
                  const Icon = icon;
                  return (
                    <div
                      key={f.id}
                      style={{
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={18} style={{ color: "#3b82f6", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.file_name}
                          </div>
                          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                            {f.description}
                          </div>
                          <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                            {new Date(f.created_at).toLocaleString()}
                          </div>
                        </div>
                        <a
                          href={`${BRIDGE_URL}/download/${f.id}`}
                          download={f.file_name}
                          onClick={() => toast.success("File downloaded")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "6px 10px",
                            background: "rgba(59,130,246,0.1)",
                            border: "1px solid rgba(59,130,246,0.3)",
                            borderRadius: 6,
                            color: "#60a5fa",
                            fontSize: 12,
                            textDecoration: "none",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          <Download size={12} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages (Chat tab) */}
      {activeTab === "chat" && (
        <div
          onClick={(e) => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
              inputRef.current?.focus();
            }
          }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
            }}
          >
            {messages.length === 0 && (
              <div style={{ padding: "40px 0 20px" }}>
                <h1
                  style={{
                    fontSize: "clamp(24px, 4vw, 32px)",
                    fontWeight: 600,
                    color: "#fff",
                    textAlign: "center",
                    marginBottom: 8,
                    fontFamily: "var(--font-sans), sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  What can Endall help you with?
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    color: "#666",
                    marginBottom: 32,
                    textAlign: "center",
                  }}
                >
                  Ask anything, or pick a workflow:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 8,
                  }}
                >
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => sendMessage("", action.id)}
                      disabled={loading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 8,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                      }
                    >
                      <span style={{ fontSize: 18 }}>{action.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>
                          {action.label}
                        </div>
                        <div style={{ fontSize: 11, color: "#666" }}>
                          {action.description}
                        </div>
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
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius:
                      msg.role === "user"
                        ? "12px 12px 2px 12px"
                        : "12px 12px 12px 2px",
                    background:
                      msg.role === "user"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.03)",
                    border: `1px solid ${msg.role === "user" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      color: msg.role === "user" ? "#fff" : "#ccc",
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.previewHtml && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                        Preview
                      </div>
                      <div
                        style={{
                          overflowX: "auto",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.3)",
                        }}
                        dangerouslySetInnerHTML={{ __html: msg.previewHtml }}
                      />
                      <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>
                        Full workbook available in the download below
                      </div>
                    </div>
                  )}
                  {msg.files && msg.files.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      {msg.files.map((f) => (
                        <a
                          key={f.file_id}
                          href={f.download_url}
                          download={f.filename}
                          onClick={() => toast.success("File downloaded")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            background: "rgba(59, 130, 246, 0.1)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            borderRadius: 8,
                            color: "#60a5fa",
                            fontSize: 13,
                            fontWeight: 500,
                            textDecoration: "none",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)")
                          }
                        >
                          <Download size={14} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.filename}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px 12px 12px 2px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {loadingPhase && (
                    <div style={{ fontSize: 13, color: "#888", lineHeight: 1.4 }}>
                      {loadingPhase}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animationDelay: "0ms" }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animationDelay: "200ms" }} />
                    <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input */}
      {activeTab === "chat" && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "#0A0A0B" }}>
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "12px 24px",
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              display: "flex",
              gap: 8,
              maxWidth: 768,
              margin: "0 auto",
              width: "100%",
            }}
          >
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={loading}
              rows={3}
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
                minHeight: 72,
                maxHeight: 160,
                overflow: "auto",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 160) + "px";
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? "#3b82f6" : "rgba(255,255,255,0.06)",
                color: input.trim() ? "#fff" : "#666",
                border: "none",
                borderRadius: 10,
                padding: "0 16px",
                minHeight: 42,
                minWidth: 42,
                alignSelf: "flex-end",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .typing-dot {
          animation: typing-bounce 1.2s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}
