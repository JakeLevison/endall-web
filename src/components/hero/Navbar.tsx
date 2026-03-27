"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
      <nav
        style={{
          position: "fixed",
          top: "16px",
          left: "50%",
          transform: `translateX(-50%) ${scrolled ? "scale(0.95)" : "scale(1)"}`,
          width: "calc(100% - 32px)",
          maxWidth: "1200px",
          zIndex: 100,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-serif), serif",
            fontSize: "18px",
            color: "#ffffff",
            textDecoration: "none",
            fontWeight: 400,
          }}
        >
          endall
        </Link>

        {/* Desktop links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
          }}
          className="hidden md:flex"
        >
          <a
            href="#features"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            onFocus={(e) => (e.currentTarget.style.color = "#ffffff")}
            onBlur={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            onFocus={(e) => (e.currentTarget.style.color = "#ffffff")}
            onBlur={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            How it Works
          </a>
          <a
            href="#pricing"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              transition: "color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            onFocus={(e) => (e.currentTarget.style.color = "#ffffff")}
            onBlur={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
          >
            Pricing
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link
            href="/dashboard"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "#000000",
              backgroundColor: "#ffffff",
              padding: "10px 16px",
              minHeight: "44px",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "background-color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            onFocus={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
            onBlur={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          >
            Open App
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
                backgroundColor: "#ffffff",
                transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                transform: menuOpen ? "translateY(5.5px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: "18px",
                height: "1.5px",
                backgroundColor: "#ffffff",
                transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: "18px",
                height: "1.5px",
                backgroundColor: "#ffffff",
                transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                transform: menuOpen ? "translateY(-5.5px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            top: "80px",
            left: "16px",
            right: "16px",
            zIndex: 99,
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
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
            href="#pricing"
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
            Pricing
          </a>
        </div>
      )}
    </>
  );
}
