"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Fade below navbar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: "linear-gradient(to bottom, var(--nav-fade) 0%, var(--nav-fade-mid) 40%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 97,
        }}
      />
      <nav
        style={{
          position: "fixed",
          top: "16px",
          left: "50%",
          transform: `translateX(-50%) ${scrolled ? "scale(0.95)" : "scale(1)"}`,
          width: "calc(100% - 32px)",
          maxWidth: "1200px",
          zIndex: 100,
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--overlay-medium)",
          borderRadius: "16px",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Left section — fixed width to balance right section */}
        <div style={{ minWidth: 160 }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "18px",
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            endall
          </Link>
        </div>

        {/* Center section — true viewport center */}
        <div
          className="hidden md:flex items-center justify-center gap-7"
          style={{ flex: 1 }}
        >
          <a
            href="#features"
            className="nav-link-hover"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            onFocus={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onBlur={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="nav-link-hover"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            onFocus={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onBlur={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            How it Works
          </a>
          <a
            href="/team"
            className="nav-link-hover"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            onFocus={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onBlur={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            About
          </a>
          <a
            href="/contact"
            className="nav-link-hover"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            onFocus={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onBlur={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            Contact
          </a>
        </div>

        {/* Right section — fixed width to balance left section */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 160, justifyContent: "flex-end" }}>
          <ThemeToggle />
          <Link
            href="/dashboard/ask-endall"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text-inverse)",
              backgroundColor: "var(--surface-inverse)",
              padding: "0 20px",
              height: "36px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              borderRadius: "8px",
              textDecoration: "none",
              transition: "background-color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-inverse)")}
            onFocus={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
            onBlur={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-inverse)")}
          >
            Ask Endall
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px",
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                display: "block",
                width: "18px",
                height: "1.5px",
                backgroundColor: "var(--surface-inverse)",
                transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                transform: menuOpen ? "translateY(5.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: "18px",
                height: "1.5px",
                backgroundColor: "var(--surface-inverse)",
                transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: "18px",
                height: "1.5px",
                backgroundColor: "var(--surface-inverse)",
                transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                transform: menuOpen ? "translateY(-5.5px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu backdrop + drawer */}
      {menuOpen && (
        <>
        <div
          className="md:hidden"
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 98,
          }}
        />
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            top: "80px",
            left: "16px",
            right: "16px",
            zIndex: 99,
            background: "var(--nav-menu-bg)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <a
            href="#features"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "15px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "15px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            How it Works
          </a>
          <a
            href="/team"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "15px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            About
          </a>
          <a
            href="/contact"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "15px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Contact
          </a>
        </div>
        </>
      )}
    </>
  );
}
