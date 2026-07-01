"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      e.preventDefault();
      router.push("/");
    }
  };

  // Nav anchor links. On "/" we smooth-scroll to the section; on any other
  // page we navigate to /#anchor so the URL is always resolvable.
  const handleAnchorClick =
    (anchor: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/") {
        e.preventDefault();
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // otherwise let the browser navigate to /#anchor
    };

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
          overflow: "hidden",
          transition: "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Left section — fixed width to balance right section */}
        <div style={{ minWidth: 160 }}>
          <Link
            href="/"
            onClick={handleLogoClick}
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
            href="/features"
            className="nav-link-hover"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
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
            href="/#how-it-works"
            onClick={handleAnchorClick("how-it-works")}
            className="nav-link-hover"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
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
            href="/about"
            className="nav-link-hover"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
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
              fontSize: "16px",
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", overflow: "hidden" }}>
          <ThemeToggle />
          <Link
            href="/dashboard/ask-endall"
            className="hidden sm:inline-flex"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--text-primary)",
              backgroundColor: "transparent",
              padding: "0 14px",
              height: "36px",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              borderRadius: "8px",
              textDecoration: "none",
              transition: "background-color 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--overlay-soft)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            onFocus={(e) => (e.currentTarget.style.backgroundColor = "var(--overlay-soft)")}
            onBlur={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Ask Endall
          </Link>
          <Link
            href="/contact?intent=book_demo"
            className="hidden sm:inline-flex"
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#1a1a1a",
              backgroundColor: "var(--brand-accent-light)",
              padding: "0 16px",
              height: "36px",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              borderRadius: "8px",
              textDecoration: "none",
              transition: "background-color 300ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-accent-light)")}
            onFocus={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-accent)")}
            onBlur={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-accent-light)")}
          >
            Book a Demo
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
            href="/features"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
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
            href="/#how-it-works"
            onClick={(e) => { setMenuOpen(false); handleAnchorClick("how-it-works")(e); }}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
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
            href="/about"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
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
              fontSize: "16px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            Contact
          </a>
          <a
            href="/contact?intent=book_demo"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#1a1a1a",
              backgroundColor: "var(--brand-accent-light)",
              textDecoration: "none",
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "4px",
            }}
          >
            Book a Demo
          </a>
        </div>
        </>
      )}
    </>
  );
}
