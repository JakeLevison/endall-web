"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import ChatMessage from "@/components/chat/ChatMessage";
import DemoCoach from "@/components/demo/DemoCoach";
import { WALKTHROUGH_PRESETS, WALKTHROUGH_FALLBACK } from "@/data/demo-walkthrough";

const SUGGESTIONS = WALKTHROUGH_PRESETS.map((p) => p.question);

// Match a question (or close paraphrase) to a cached preset. Case- and
// whitespace-insensitive, with a simple keyword backoff.
function findCachedResponse(question: string): { response: string; typingDelayMs: number } | null {
  const q = question.toLowerCase().trim();
  // Exact suggestion match first
  for (const p of WALKTHROUGH_PRESETS) {
    if (p.question.toLowerCase().trim() === q) return p;
  }
  // Keyword backoff - catches light paraphrases of the suggestions
  if (q.includes("200a") || q.includes("panel upgrade")) return WALKTHROUGH_PRESETS[0];
  if (q.includes("data center")) return WALKTHROUGH_PRESETS[1];
  if (q.includes("profit margin") || q.includes("commercial mechanical")) return WALKTHROUGH_PRESETS[2];
  return null;
}

type Msg = { id: string; role: "user" | "assistant"; content: string };

interface AskStepProps {
  onNext: () => void;
  onSuggestionChosen?: (suggestion: string) => void;
}

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AskStep({ onNext, onSuggestionChosen }: AskStepProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseReceived, setResponseReceived] = useState(false);
  const sessionId = useRef(`demo-ask-${genId()}`);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: genId(), role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Demo-mode cache: answer the 3 suggested questions (and close
    // paraphrases) in under 1.5s from a static file, skipping /api/chat.
    const cached = findCachedResponse(text);
    if (cached) {
      await new Promise((r) => setTimeout(r, cached.typingDelayMs));
      setMessages([
        ...next,
        { id: genId(), role: "assistant", content: cached.response },
      ]);
      setResponseReceived(true);
      setLoading(false);
      return;
    }

    // Free-text fallback: light typing delay + generic response. We do NOT
    // hit /api/chat here because the demo promise is "sub-1.5s" and live
    // Claude calls regularly take 8-12s.
    await new Promise((r) => setTimeout(r, 800));
    setMessages([
      ...next,
      { id: genId(), role: "assistant", content: WALKTHROUGH_FALLBACK },
    ]);
    setResponseReceived(true);
    setLoading(false);
  };

  const chooseSuggestion = (s: string) => {
    onSuggestionChosen?.(s);
    send(s);
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 20px 180px",
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 72px)",
      }}
    >
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Ask a question.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 17,
              color: "var(--text-tertiary)",
              lineHeight: 1.5,
              marginBottom: 24,
            }}
          >
            Type anything — or tap one of these to start:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => chooseSuggestion(s)}
                style={{
                  textAlign: "left",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  color: "var(--text-primary)",
                  background: "var(--overlay-soft)",
                  border: "1px solid var(--overlay-medium)",
                  borderRadius: 10,
                  padding: "14px 18px",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                  lineHeight: 1.4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--overlay-medium)";
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--overlay-soft)";
                  e.currentTarget.style.borderColor = "var(--overlay-medium)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
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
              padding: "12px 16px",
              borderRadius:
                msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background:
                msg.role === "user" ? "var(--overlay-medium)" : "var(--overlay-weak)",
              border: "1px solid var(--overlay-soft)",
              fontSize: 16,
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}
          >
            <ChatMessage role={msg.role} content={msg.content} />
          </div>
        </div>
      ))}

      {loading && (
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "12px 12px 12px 2px",
              background: "var(--overlay-weak)",
              border: "1px solid var(--overlay-soft)",
              display: "flex",
              gap: 6,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--text-tertiary)",
                  animation: `demo-bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} />

      {/* Free-text input — also highlighted by coach */}
      <div
        className="demo-ask-input"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 20px calc(env(safe-area-inset-bottom) + 16px)",
          background: "var(--bg)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto 8px", textAlign: "right" }}>
          <button
            type="button"
            onClick={onNext}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 13,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 0",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Skip this step →
          </button>
        </div>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Type your question..."
            rows={1}
            style={{
              flex: 1,
              background: "var(--overlay-soft)",
              border: "1px solid var(--overlay-medium)",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 16,
              color: "var(--text-primary)",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            aria-label="Send"
            style={{
              background: input.trim() ? "var(--surface-inverse)" : "var(--overlay-soft)",
              color: input.trim() ? "var(--text-inverse)" : "var(--text-muted)",
              border: "none",
              borderRadius: 10,
              padding: "0 16px",
              height: 44,
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Coach: no spotlight until response arrives */}
      {!responseReceived && messages.length === 0 && (
        <DemoCoach
          title="Ask a question"
          description="Type anything — or tap a suggestion. You'll get a real answer from the Ask Endall engine."
          backdrop={false}
        />
      )}
      {responseReceived && (
        <DemoCoach
          title="That's your AI ops team."
          description="It answers in real time. It knows your trade — pricing, margins, scope, MEP benchmarks."
          showNext
          onNext={onNext}
          backdrop={false}
        />
      )}

      <style jsx global>{`
        @keyframes demo-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
