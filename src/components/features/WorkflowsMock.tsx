"use client";

export default function WorkflowsMock() {
  const nodes = [
    { label: "New Deal", icon: "+" },
    { label: "AI: Classify", icon: "\u2726" },
    { label: "Assign Rep", icon: "\u2192" },
  ];

  return (
    <div style={{ background: "#111", borderRadius: 8, padding: 16, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
        {nodes.map((node, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            {/* Node */}
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #333",
                borderRadius: 8,
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: "0 0 auto",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 12, color: "#666" }}>{node.icon}</span>
              <span style={{ fontSize: 11, color: "#ccc" }}>{node.label}</span>
            </div>
            {/* Connecting line with animated dot */}
            {i < nodes.length - 1 && (
              <div style={{ flex: 1, height: 1, background: "#333", position: "relative", minWidth: 12 }}>
                <div
                  className="workflow-dot"
                  style={{
                    position: "absolute",
                    top: -2,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <style jsx>{`
        .workflow-dot {
          animation: travel 2s ease-in-out infinite;
        }
        @keyframes travel {
          0% { left: 0; }
          50% { left: calc(100% - 5px); }
          100% { left: 0; }
        }
      `}</style>
    </div>
  );
}
