"use client";

export default function CRMMock() {
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: 16, fontFamily: "var(--font-sans, 'DM Sans', sans-serif)" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "#888",
            flexShrink: 0,
          }}
        >
          SC
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Sarah Chen</div>
          <div style={{ fontSize: 11, color: "#888" }}>Acme Corp</div>
        </div>
      </div>

      {/* Deal row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Deal value</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>$48,000</div>
        </div>
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
          Negotiation
        </div>
      </div>

      {/* Activity timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Activity</div>
        {[
          { color: "#3b82f6", label: "Email sent" },
          { color: "#22c55e", label: "Meeting booked" },
          { color: "#a855f7", label: "Proposal viewed" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: "#888" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
