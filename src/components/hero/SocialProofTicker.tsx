"use client";

const teams = [
  "Series A Startups",
  "Consulting Firms",
  "SaaS Companies",
  "Real Estate Teams",
  "Financial Services",
  "Marketing Agencies",
  "Professional Services",
  "Growth-Stage Companies",
];

export default function SocialProofTicker() {
  return (
    <section style={{ padding: "80px 16px", overflow: "hidden" }}>
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
        Built for teams like yours
      </p>
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div
          className="ticker-track"
          style={{
            display: "flex",
            width: "max-content",
          }}
        >
          {[...teams, ...teams].map((name, i) => (
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
      <style jsx>{`
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
        }
        @media (max-width: 768px) {
          .ticker-track {
            animation-duration: 80s;
          }
        }
      `}</style>
    </section>
  );
}
