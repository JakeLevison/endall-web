"use client";

export default function ReportsMock() {
  const bars = [
    { month: "Jan", height: 45 },
    { month: "Feb", height: 62 },
    { month: "Mar", height: 38 },
    { month: "Apr", height: 78 },
    { month: "May", height: 90 },
  ];

  return (
    <div style={{ background: "#111", borderRadius: 8, padding: 16, fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 80, gap: 8, position: "relative" }}>
        {/* Trend line overlay using SVG */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 100 80"
          preserveAspectRatio="none"
        >
          <polyline
            points={bars
              .map((b, i) => {
                const x = (i / (bars.length - 1)) * 100;
                const y = 80 - (b.height / 100) * 80;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        </svg>

        {bars.map((bar) => (
          <div key={bar.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4, zIndex: 1 }}>
            <div
              style={{
                width: "100%",
                maxWidth: 24,
                height: `${(bar.height / 100) * 80}px`,
                background: "linear-gradient(to top, #333, #555)",
                borderRadius: 3,
              }}
            />
            <span style={{ fontSize: 9, color: "#888" }}>{bar.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
