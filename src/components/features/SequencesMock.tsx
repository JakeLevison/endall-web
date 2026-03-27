"use client";

export default function SequencesMock() {
  const steps = [
    { icon: "\u2709", title: "Intro Email", status: "Sent \u00b7 94% open", dotColor: "#22c55e" },
    { icon: "\u23f0", title: "Wait 2 days", status: "", dotColor: "#555" },
    { icon: "\u2709", title: "Follow-up", status: "Scheduled", dotColor: "#555" },
  ];

  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: 16, fontFamily: "var(--font-sans, 'DM Sans', sans-serif)" }}>
      <div style={{ position: "relative", paddingLeft: 20 }}>
        {/* Vertical connecting line */}
        <div
          style={{
            position: "absolute",
            left: 5,
            top: 8,
            bottom: 8,
            width: 1,
            background: "#333",
          }}
        />
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < steps.length - 1 ? 20 : 0, position: "relative" }}>
            {/* Dot on the line */}
            <div
              style={{
                position: "absolute",
                left: -18,
                top: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: step.dotColor,
                border: "2px solid #111",
                zIndex: 1,
              }}
            />
            {/* Icon */}
            <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>{step.icon}</span>
            <div>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{step.title}</div>
              {step.status && (
                <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{step.status}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
