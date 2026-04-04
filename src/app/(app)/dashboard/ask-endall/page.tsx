"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  File,
  MessageSquare,
  Trash2,
  BarChart3,
  Wallet,
  TrendingUp,
  Wrench,
  FileEdit,
  Search,
  CheckCircle,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useChat, QUICK_ACTIONS, type Message } from "@/hooks/useChat";
import ChatMessage from "@/components/chat/ChatMessage";


const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  BarChart3, Wallet, FileText, TrendingUp, Wrench, FileEdit, Search, CheckCircle,
};

const ACTION_COLORS: Record<string, string> = {
  financial_model: "#3b82f6",
  generate_budget: "#10b981",
  capabilities_doc: "#8b5cf6",
  npv_analysis: "#f59e0b",
  project_estimate: "#ef4444",
  proposal: "#06b6d4",
  competitive_analysis: "#f97316",
  review_financials: "#84cc16",
};

function QuickActionIcon({ name, color }: { name: string; color?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <span style={{ fontSize: 18 }}>{name}</span>;
  return <Icon size={16} style={{ color: color || "#888", flexShrink: 0 }} />;
}

export default function AskEndallPage() {
  const {
    messages, conversations, loading, loadingPhase,
    activeWorkflow, activeTab, savedFiles,
    setActiveTab, sendMessage, resetChat, loadConversation, deleteConversation,
  } = useChat();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (loading || !input.trim()) return;
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", position: "relative" }}>
      {/* Mobile backdrop — click to close */}
      {sidebarOpen && (
        <div
          className="ae-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      {/* Conversation history sidebar */}
      <div
        className={`ae-sidebar${sidebarOpen ? " ae-sidebar-open" : ""}`}
      >
        <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => { resetChat(); setActiveTab("chat"); setSidebarOpen(false); }}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={14} /> New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {conversations.length === 0 ? (
            <p style={{ fontSize: 12, color: "#444", textAlign: "center", marginTop: 20, padding: "0 12px" }}>
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => { loadConversation(conv.id); setSidebarOpen(false); }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  borderLeft: "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <MessageSquare size={14} style={{ color: "#555", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conv.title || "New conversation"}
                  </div>
                  <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  title="Delete conversation"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#444", opacity: 0.5 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
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
          <button
            className="ae-hamburger"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Close conversation history" : "Open conversation history"}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              padding: 4,
              alignItems: "center",
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
          {(messages.length > 0 || activeTab === "files") && (
            <button
              onClick={() => { resetChat(); setActiveTab("chat"); setSidebarOpen(false); }}
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
                          href={`/api/chat/download?file_id=${f.file_path}&filename=${encodeURIComponent(f.file_name)}`}
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
                        borderLeft: `3px solid ${ACTION_COLORS[action.id] || "#333"}`,
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
                      <QuickActionIcon name={action.icon} color={ACTION_COLORS[action.id]} />
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
                    }}
                  >
                    <ChatMessage role={msg.role} content={msg.content} />
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
                    minWidth: 200,
                  }}
                >
                  {loadingPhase && (
                    <div style={{ fontSize: 13, color: "#888", lineHeight: 1.4 }}>
                      {loadingPhase}
                    </div>
                  )}
                  <div className="progress-bar-track" style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                    <div className="progress-bar-fill" style={{ height: "100%", background: "#fff", borderRadius: 2 }} />
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
              placeholder={loading ? "Type your next message..." : "Ask anything..."}
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
        @keyframes progress-slide {
          0% { transform: translateX(-100%); width: 40%; }
          50% { width: 60%; }
          100% { transform: translateX(300%); width: 40%; }
        }
        .progress-bar-fill {
          animation: progress-slide 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
      </div>{/* end main chat area */}
    </div>
  );
}
