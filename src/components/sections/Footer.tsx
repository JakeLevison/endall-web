export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "24px 16px",
        background: "var(--bg)",
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
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 16,
            color: "var(--text-primary)",
            fontWeight: 400,
          }}
        >
          endall
        </span>

        {/* Links */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Contact", href: "mailto:jake@endall.ai" },
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: 14,
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              onFocus={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
              onBlur={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <span
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          &copy; 2026 Endall
        </span>
      </div>
    </footer>
  );
}
