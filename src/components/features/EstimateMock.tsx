"use client";

export default function EstimateMock() {
  const lines = [
    { label: "Labor", value: "$28,400", pct: 62 },
    { label: "Materials", value: "$14,200", pct: 31 },
    { label: "Subs", value: "$3,200", pct: 7 },
  ];

  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 16,
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* Total row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 2 }}>Estimate total</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>$45,800</div>
        </div>
        <div
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 11,
            color: "#22c55e",
          }}
        >
          28% margin
        </div>
      </div>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {lines.map((line) => (
          <div key={line.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{line.label}</span>
              <span style={{ fontSize: 11, color: "var(--text-primary)" }}>{line.value}</span>
            </div>
            <div
              style={{
                height: 4,
                background: "var(--overlay-soft)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${line.pct}%`,
                  height: "100%",
                  background: "var(--surface-inverse)",
                  opacity: 0.85,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Schedule footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: "1px solid var(--overlay-soft)",
          fontSize: 11,
          color: "var(--text-tertiary)",
        }}
      >
        <span>Timeline</span>
        <span style={{ color: "var(--text-secondary)" }}>12 weeks · 4 phases</span>
      </div>
    </div>
  );
}
