"use client";

import { useState, useEffect, useRef } from "react";

interface LogoEntranceProps {
  onComplete: () => void;
}

export default function LogoEntrance({ onComplete }: LogoEntranceProps) {
  const [phase, setPhase] = useState<"fadein" | "hold" | "fadeout" | "done">("fadein");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Skip entrance for return visitors within the same session
    if (sessionStorage.getItem("endall-entrance-seen")) {
      setPhase("done");
      onCompleteRef.current();
      return;
    }

    // Phase 1 (0ms): mount with fadein state, CSS transition handles the visual fade
    // Phase 2 (50ms → hold): trigger the fade-in transition immediately after first paint
    const holdTimer = setTimeout(() => setPhase("hold"), 50);
    // Phase 3 (800ms → fadeout): dissolve the overlay
    const fadeoutTimer = setTimeout(() => setPhase("fadeout"), 800);
    // Phase 4 (1200ms → done): clean up
    const doneTimer = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("endall-entrance-seen", "1");
      onCompleteRef.current();
    }, 1200);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeoutTimer);
      clearTimeout(doneTimer);
    };
  }, []); // stable — uses ref for callback

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
          fontFamily: "var(--font-sans), sans-serif",
          fontSize: "48px",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: "#ffffff",
          transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          transform: phase === "fadein" ? "scale(0.96)" : "scale(1)",
          opacity: phase === "fadein" ? 0 : phase === "fadeout" ? 0 : 1,
        }}
      >
        endall
      </span>
    </div>
  );
}
