"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Loader2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type Action = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

const QUICK_ACTIONS: Action[] = [
  { id: "meeting_prep", label: "Meeting prep", description: "Briefing for an upcoming meeting", icon: "📋" },
  { id: "deal_brief", label: "Deal brief", description: "Full briefing on a deal", icon: "💰" },
  { id: "follow_up_email", label: "Follow-up email", description: "Draft a follow-up email", icon: "✉️" },
  { id: "account_research", label: "Account research", description: "Research a company", icon: "🔍" },
  { id: "next_steps", label: "Suggest next steps", description: "Actionable task list", icon: "✅" },
  { id: "objection_handling", label: "Handle objections", description: "Prepare for objections", icon: "🛡️" },
];

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill context for a specific record */
  recordType?: "contact" | "company" | "deal";
  recordId?: string;
}

export default function ChatPanel({ isOpen, onClose, recordType, recordId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

      try {
        const resp = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            action,
            recordType,
            recordId,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = await resp.json();
        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply || data.error || "Something went wrong.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Failed to connect to AI service.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, recordType, recordId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
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
          top: 0,
          right: 0,
          width: "min(480px, 100vw)",
          height: "100dvh",
          background: "#0A0A0B",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          zIndex: 999,
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

        {/* Messages */}
        <div
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
                Ask anything about your CRM data, or use a quick action:
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
                    <span style={{ fontSize: 16 }}>{action.icon}</span>
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
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
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
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animationDelay: "0ms" }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animationDelay: "200ms" }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#555", animationDelay: "400ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — sticky at bottom, survives mobile keyboard */}
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
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={loading}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 16,
              color: "#fff",
              outline: "none",
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
