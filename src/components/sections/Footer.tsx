export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #222",
        padding: "24px 16px",
        background: "#0a0a0a",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: "var(--font-eb-garamond, 'EB Garamond', serif)",
            fontSize: 16,
            color: "#fff",
            fontWeight: 400,
          }}
        >
          endall
        </span>

        {/* Links */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Contact", href: "mailto:jake@endall.ai" },
            { label: "Privacy", href: "#" },
            { label: "Terms", href: "#" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
                fontSize: 11,
                color: "#666",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)",
            fontSize: 11,
            color: "#666",
          }}
        >
          &copy; 2026 Endall AI
        </span>
      </div>
    </footer>
  );
}
