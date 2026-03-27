"use client";

import Link from "next/link";

const words = ["CRM", "Sequences", "Workflows", "Tasks", "Reports", "CRM"];

export default function HeroHeadline() {
  return (
    <section
      style={{
        paddingTop: "140px",
        paddingBottom: "60px",
        textAlign: "center",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-serif), serif",
          fontWeight: 400,
          color: "var(--text-secondary)",
          lineHeight: 1.15,
          margin: "0 auto",
          maxWidth: "900px",
        }}
        className="text-[40px] sm:text-[56px] lg:text-[72px]"
      >
        One platform for{" "}
        <span
          style={{
            display: "inline-block",
            height: "1.25em",
            overflow: "hidden",
            verticalAlign: "bottom",
            position: "relative",
          }}
        >
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              animation: "cycle-words 15s cubic-bezier(0.16, 1, 0.3, 1) infinite",
              willChange: "transform",
            }}
          >
            {words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                style={{
                  display: "block",
                  height: "1.25em",
                  lineHeight: 1.25,
                  color: "#ffffff",
                }}
              >
                {word}
              </span>
            ))}
          </span>
        </span>
      </h1>

      <p
        style={{
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "clamp(15px, 3vw, 18px)",
          color: "var(--text-tertiary)",
          maxWidth: "560px",
          margin: "24px auto 0",
          lineHeight: 1.6,
        }}
      >
        CRM, email sequences, workflow automation, task management, and AI agents.
      </p>

      <div style={{ marginTop: "40px" }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            color: "#000000",
            backgroundColor: "#ffffff",
            padding: "12px 24px",
            borderRadius: "6px",
            textDecoration: "none",
            transition: "background-color 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          onFocus={(e) => (e.currentTarget.style.backgroundColor = "#e5e5e5")}
          onBlur={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
        >
          Open App
        </Link>
      </div>
    </section>
  );
}
