"use client";

export default function WorkflowsMock() {
  const nodes = [
    { label: "New Deal", icon: "+" },
    { label: "AI: Classify", icon: "\u2726" },
    { label: "Assign Rep", icon: "\u2192" },
  ];

  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, fontFamily: "var(--font-sans), sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        {nodes.map((node, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            {/* Node */}
            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: "0 0 auto",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{node.icon}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{node.label}</span>
            </div>
            {/* Connecting line with animated dot */}
            {i < nodes.length - 1 && (
              <div style={{ flex: 1, height: 1, background: "var(--text-secondary)", position: "relative", minWidth: 12 }}>
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: -2,
                    width: 0,
                    height: 0,
                    borderTop: "3px solid transparent",
                    borderBottom: "3px solid transparent",
                    borderLeft: "4px solid var(--text-muted)",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
