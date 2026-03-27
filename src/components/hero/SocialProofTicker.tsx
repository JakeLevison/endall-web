"use client";

const companies = [
  "Acme Corp",
  "TechFlow",
  "Meridian Labs",
  "Apex Digital",
  "NovaStar",
  "Quantum Systems",
  "Atlas Group",
  "Cipher Inc",
];

export default function SocialProofTicker() {
  return (
    <section style={{ padding: "60px 0 40px", overflow: "hidden" }}>
      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "3px",
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        Trusted by teams at
      </p>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            width: "max-content",
            animation: "ticker-scroll 40s linear infinite",
          }}
        >
          {[...companies, ...companies].map((name, i) => (
            <span
              key={`${name}-${i}`}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "15px",
                fontWeight: 300,
                color: "rgba(255, 255, 255, 0.25)",
                padding: "0 40px",
                whiteSpace: "nowrap",
                transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "default",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.25)")}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
