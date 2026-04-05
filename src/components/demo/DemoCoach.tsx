"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface DemoCoachProps {
  /** CSS selector for the element to highlight. If omitted, renders a
   *  centered modal with no spotlight. */
  targetSelector?: string;
  title: string;
  description: string;
  position?: TooltipPosition;
  showNext?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onSkip?: () => void;
  /** When true, shows the dim backdrop. Defaults to true. */
  backdrop?: boolean;
}

function useTargetRect(selector: string | undefined): TargetRect | null {
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    update();
    const ro = new ResizeObserver(update);
    document.querySelectorAll(selector).forEach((el) => ro.observe(el));
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    // Re-measure periodically in case content shifts
    const interval = setInterval(update, 500);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      clearInterval(interval);
    };
  }, [selector]);

  return rect;
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

export default function DemoCoach({
  targetSelector,
  title,
  description,
  position = "bottom",
  showNext = false,
  nextLabel = "Next step",
  onNext,
  onSkip,
  backdrop = true,
}: DemoCoachProps) {
  const rect = useTargetRect(targetSelector);
  const [mobile, setMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setMobile(isMobile());
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keyboard: Esc to skip
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && onSkip) onSkip();
      if (e.key === "Enter" && showNext && onNext) onNext();
    },
    [onNext, onSkip, showNext]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Tooltip position (desktop only; on mobile we use a bottom sheet)
  const tooltipStyle: React.CSSProperties = (() => {
    if (mobile) {
      return {
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "max(16px, env(safe-area-inset-bottom))",
        maxWidth: "none",
      };
    }

    const width = 340;
    const padding = 16;
    const arrow = 8;

    if (!rect) {
      // Centered modal
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width,
      };
    }

    let top = 0;
    let left = 0;
    switch (position) {
      case "top":
        top = rect.top - padding - arrow - 200;
        left = rect.left + rect.width / 2 - width / 2;
        break;
      case "bottom":
        top = rect.top + rect.height + padding + arrow;
        left = rect.left + rect.width / 2 - width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - 100;
        left = rect.left - width - padding - arrow;
        break;
      case "right":
        top = rect.top + rect.height / 2 - 100;
        left = rect.left + rect.width + padding + arrow;
        break;
    }

    // Clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (left < 12) left = 12;
    if (left + width > vw - 12) left = vw - width - 12;
    if (top < 12) top = 12;
    if (top + 220 > vh - 12) top = vh - 220 - 12;

    return { position: "fixed", top, left, width };
  })();

  // Spotlight cutout rect (only on desktop with a target)
  const spotlight = !mobile && rect && backdrop;
  const SPOTLIGHT_PAD = 8;

  return (
    <>
      {backdrop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            pointerEvents: "none",
          }}
        >
          {spotlight ? (
            <svg
              width="100%"
              height="100%"
              style={{ position: "absolute", inset: 0 }}
            >
              <defs>
                <mask id="demo-coach-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={rect.left - SPOTLIGHT_PAD}
                    y={rect.top - SPOTLIGHT_PAD}
                    width={rect.width + SPOTLIGHT_PAD * 2}
                    height={rect.height + SPOTLIGHT_PAD * 2}
                    rx={12}
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="var(--backdrop)"
                mask="url(#demo-coach-mask)"
              />
              {/* Pulse ring around spotlight */}
              <rect
                x={rect.left - SPOTLIGHT_PAD}
                y={rect.top - SPOTLIGHT_PAD}
                width={rect.width + SPOTLIGHT_PAD * 2}
                height={rect.height + SPOTLIGHT_PAD * 2}
                rx={12}
                fill="none"
                stroke="var(--text-primary)"
                strokeWidth={2}
                opacity={0.6}
              >
                <animate
                  attributeName="opacity"
                  values="0.6;0.2;0.6"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </rect>
            </svg>
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--backdrop)",
              }}
            />
          )}
        </motion.div>
      )}

      <AnimatePresence>
        <motion.div
          ref={tooltipRef}
          key={`${title}-${description}`}
          initial={{ opacity: 0, y: mobile ? 20 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: mobile ? 20 : 8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            ...tooltipStyle,
            zIndex: 100,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: mobile ? "20px 20px calc(env(safe-area-inset-bottom) + 20px)" : "20px",
            boxShadow: "0 20px 60px var(--overlay-strong)",
            pointerEvents: "auto",
          }}
          role="dialog"
          aria-label={title}
        >
          <h3
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              marginBottom: 6,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 15,
              color: "var(--text-tertiary)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>

          {(showNext || onSkip) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
                gap: 12,
              }}
            >
              {onSkip ? (
                <button
                  type="button"
                  onClick={onSkip}
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 14,
                    color: "var(--text-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  Skip
                </button>
              ) : (
                <span />
              )}

              {showNext && onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--text-inverse)",
                    background: "var(--surface-inverse)",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 18px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--surface-inverse)")
                  }
                >
                  {nextLabel} →
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

/** Step progress dots. */
export function DemoProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background:
              i <= current ? "var(--text-primary)" : "var(--overlay-medium)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      ))}
    </div>
  );
}
