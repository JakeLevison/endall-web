"use client";

export default function AIMock() {
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: 16, fontFamily: "var(--font-sans, 'DM Sans', sans-serif)", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* User message */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "10px 10px 2px 10px",
            padding: "8px 12px",
            maxWidth: "80%",
          }}
        >
          <span style={{ fontSize: 12, color: "#ccc" }}>Summarize my pipeline</span>
        </div>
      </div>

      {/* AI message */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            background: "#151515",
            border: "1px solid #222",
            borderRadius: "10px 10px 10px 2px",
            padding: "8px 12px",
            maxWidth: "85%",
          }}
        >
          <span style={{ fontSize: 12, color: "#ccc" }}>
            You have 12 active deals worth $284k. 3 closing this week.
          </span>
        </div>
      </div>

      {/* Typing indicator */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="typing-dot"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#555",
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .typing-dot {
          animation: typing-bounce 1.2s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
