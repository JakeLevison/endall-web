"use client";

import { useState, useEffect } from "react";

interface LogoEntranceProps {
  onComplete: () => void;
}

export default function LogoEntrance({ onComplete }: LogoEntranceProps) {
  const [phase, setPhase] = useState<"fadein" | "hold" | "shrink" | "done">("fadein");

  useEffect(() => {
    // Phase 1: fade in over 800ms
    const holdTimer = setTimeout(() => setPhase("hold"), 800);
    // Phase 2: hold for 600ms, then shrink
    const shrinkTimer = setTimeout(() => setPhase("shrink"), 1400);
    // Phase 3: shrink animation takes 600ms, then done
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(shrinkTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: phase === "shrink" ? 0 : 1,
        pointerEvents: phase === "shrink" ? "none" : "auto",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif), serif",
          fontSize: "48px",
          color: "#ffffff",
          transition: "all 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          transform:
            phase === "fadein"
              ? "scale(0.95)"
              : phase === "hold"
                ? "scale(1)"
                : "scale(0.6) translate(-40vw, -40vh)",
          opacity: phase === "fadein" ? 0 : 1,
          animation: phase === "fadein" ? "none" : undefined,
        }}
      >
        endall
      </span>
    </div>
  );
}
