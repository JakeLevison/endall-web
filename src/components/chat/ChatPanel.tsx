"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Loader2, RotateCcw, Download, Maximize2, Minimize2, FileSpreadsheet, FileText, File, BarChart3, Wallet, TrendingUp, Wrench, FileEdit, Search, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useChat, QUICK_ACTIONS, type Message } from "@/hooks/useChat";
import ChatMessage from "./ChatMessage";


const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  BarChart3, Wallet, FileText, TrendingUp, Wrench, FileEdit, Search, CheckCircle,
};

function QuickActionIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <span style={{ fontSize: 16 }}>{name}</span>;
  return <Icon size={16} style={{ color: "#888", flexShrink: 0 }} />;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Navigate to full-page Ask Endall */
  onExpandFullPage?: () => void;
  /** Pre-fill context for a specific record */
  recordType?: "contact" | "company" | "deal";
  recordId?: string;
}

export default function ChatPanel({ isOpen, onClose, onExpandFullPage, recordType, recordId }: ChatPanelProps) {
  const {
    messages, conversations, loading, loadingPhase,
    activeWorkflow, activeTab, savedFiles,
    setActiveTab, sendMessage, resetChat, loadConversation,
  } = useChat({ recordType, recordId });
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Files tab loading is now handled by useChat hook

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expanded) {
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expanded]);

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 998,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: expanded ? 0 : 0,
          right: 0,
          width: expanded ? "min(75vw, 900px)" : "min(480px, 100vw)",
          height: "100dvh",
          background: "#0A0A0B",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} style={{ color: "#fff" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
              ask endall
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {(messages.length > 0 || activeTab === "files") && (
              <button
                onClick={() => { resetChat(); setActiveTab("chat"); }}
                title="New chat"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "#666",
                }}
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              onClick={() => {
                if (!expanded && onExpandFullPage) {
                  onClose();
                  onExpandFullPage();
                } else {
                  setExpanded(!expanded);
                }
              }}
              title={expanded ? "Collapse (Esc)" : "Open full page"}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "#666",
              }}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "#666",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {(["chat", "files"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "8px 0",
                fontSize: 12,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: activeTab === tab ? "#fff" : "#555",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {tab === "chat" ? "Chat" : "My Files"}
            </button>
          ))}
        </div>

        {/* Files tab */}
        {activeTab === "files" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {savedFiles.length === 0 ? (
              <p style={{ fontSize: 13, color: "#555", textAlign: "center", marginTop: 40 }}>
                No files generated yet. Use the Chat tab to create budgets, NPV analyses, and more.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedFiles.map((f) => {
                  const icon = f.file_type === "xlsx" ? FileSpreadsheet
                    : f.file_type === "pdf" ? FileText
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
        )}

        {/* Messages (Chat tab) */}
        {activeTab === "chat" && (
          <div
          onClick={(e) => {
            // Only focus input if clicking empty space, not selecting text
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
              inputRef.current?.focus();
            }
          }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <div style={{ padding: "20px 0" }}>
              <p
                style={{
                  fontSize: 13,
                  color: "#666",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                Ask anything, or pick a workflow:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => sendMessage("", action.id)}
                    disabled={loading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
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
                    <QuickActionIcon name={action.icon} />
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
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: msg.role === "user" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
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
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Preview</div>
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
        )}

        {/* Input — visible on chat tab only */}
        {activeTab === "chat" && (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "12px 16px",
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 8,
            flexShrink: 0,
            background: "#0A0A0B",
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
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .typing-dot {
            animation: typing-bounce 1.2s ease-in-out infinite;
          }
          @keyframes typing-bounce {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-3px); }
          }
        `}</style>
      </div>
    </>
  );
}
