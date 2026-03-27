"use client";

import { useState, useEffect, useCallback } from "react";

interface LogoEntranceProps {
  onComplete: () => void;
}

export default function LogoEntrance({ onComplete }: LogoEntranceProps) {
  const [phase, setPhase] = useState<"fadein" | "hold" | "fadeout" | "done">("fadein");

  const finish = useCallback(() => {
    setPhase("done");
    sessionStorage.setItem("endall-entrance-seen", "1");
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Skip entrance for return visitors within the same session
    if (sessionStorage.getItem("endall-entrance-seen")) {
      setPhase("done");
      onComplete();
      return;
    }

    // Phase 1 (0-800ms): Fade in center-screen
    const holdTimer = setTimeout(() => setPhase("hold"), 800);
    // Phase 2 (800-2200ms): Hold in center for 1400ms
    const fadeoutTimer = setTimeout(() => setPhase("fadeout"), 2200);
    // Phase 3 (2200-2800ms): Fade out in place over 600ms, then done
    const doneTimer = setTimeout(() => {
      finish();
    }, 2800);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeoutTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete, finish]);

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
        opacity: phase === "fadeout" ? 0 : 1,
        pointerEvents: phase === "fadeout" ? "none" : "auto",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-serif), serif",
          fontSize: "48px",
          color: "#ffffff",
          transition: "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1)",
          transform: phase === "fadein" ? "scale(0.96)" : "scale(1)",
          opacity: phase === "fadein" ? 0 : 1,
        }}
      >
        endall
      </span>
    </div>
  );
}
