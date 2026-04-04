"use client";

export default function CompetitiveMock() {
  const competitors = [
    { name: "Ridgeline Mech.", share: 72, tone: "#3b82f6" },
    { name: "Apex Services", share: 54, tone: "#a855f7" },
    { name: "Northstar Co.", share: 38, tone: "#22c55e" },
  ];

  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #1a1a1a",
        borderRadius: 8,
        padding: 16,
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Market position</div>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 11,
            color: "#ccc",
          }}
        >
          3 competitors
        </div>
      </div>

      {/* Competitor bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {competitors.map((c) => (
          <div key={c.name}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#ccc" }}>{c.name}</span>
              <span style={{ fontSize: 11, color: "#888" }}>{c.share}</span>
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${c.share}%`,
                  height: "100%",
                  background: c.tone,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* SWOT strip */}
      <div style={{ display: "flex", gap: 6 }}>
        {[
          { label: "S", tone: "#22c55e" },
          { label: "W", tone: "#ef4444" },
          { label: "O", tone: "#3b82f6" },
          { label: "T", tone: "#eab308" },
        ].map((q) => (
          <div
            key={q.label}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "6px 0",
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              color: q.tone,
            }}
          >
            {q.label}
          </div>
        ))}
      </div>
    </div>
  );
}
