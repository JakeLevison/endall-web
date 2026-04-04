"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronRight, SkipForward, RotateCcw } from "lucide-react";
import type { DemoStep, DemoConfig } from "./types";

interface DemoOverlayProps {
  config: DemoConfig;
  onComplete: () => void;
  onExit: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(selector: string): TargetRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getTooltipPosition(
  targetRect: TargetRect,
  placement: DemoStep["placement"],
  tooltipWidth: number,
  tooltipHeight: number
) {
  const padding = 16;
  const arrowSize = 8;
  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = targetRect.top - tooltipHeight - arrowSize - padding;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      top = targetRect.top + targetRect.height + arrowSize + padding;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - tooltipWidth - arrowSize - padding;
      break;
    case "right":
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left + targetRect.width + arrowSize + padding;
      break;
  }

  // Clamp to viewport
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  if (left < 12) left = 12;
  if (left + tooltipWidth > vw - 12) left = vw - tooltipWidth - 12;
  if (top < 12) top = 12;
  if (top + tooltipHeight > vh - 12) top = vh - tooltipHeight - 12;

  return { top, left };
}

export default function DemoOverlay({ config, onComplete, onExit }: DemoOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [completed, setCompleted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const step = config.steps[currentStep];
  const totalSteps = config.steps.length;

  // Update target rect on step change and on scroll/resize
  const updateRect = useCallback(() => {
    if (completed || !step) return;
    const rect = getTargetRect(step.target);
    setTargetRect(rect);
  }, [step, completed]);

  useEffect(() => {
    updateRect();
    const interval = setInterval(updateRect, 200);
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [updateRect]);

  // Auto-advance for "wait" and "observe" steps
  useEffect(() => {
    if (!step || completed) return;
    if (step.action === "wait" || step.action === "observe") {
      const timer = setTimeout(() => advance(), step.waitMs || 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, step, completed]);

  const advance = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  }, [currentStep, totalSteps]);

  const skip = useCallback(() => {
    advance();
  }, [advance]);

  const replay = useCallback(() => {
    setCurrentStep(0);
    setCompleted(false);
  }, []);

  // Spotlight SVG clip path
  const spotlightPadding = 8;
  const sr = targetRect
    ? {
        x: targetRect.left - spotlightPadding,
        y: targetRect.top - spotlightPadding,
        w: targetRect.width + spotlightPadding * 2,
        h: targetRect.height + spotlightPadding * 2,
        rx: 12,
      }
    : null;

  // Tooltip positioning
  const tooltipWidth = 320;
  const tooltipHeight = 160;
  const tooltipPos =
    targetRect && step
      ? getTooltipPosition(targetRect, step.placement, tooltipWidth, tooltipHeight)
      : { top: (typeof window !== "undefined" ? window.innerHeight : 900) / 2 - 80, left: (typeof window !== "undefined" ? window.innerWidth : 1440) / 2 - 160 };

  if (completed) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            padding: "48px 40px",
            background: "var(--surface)",
            border: "1px solid var(--overlay-medium)",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.15)",
              border: "1px solid rgba(59,130,246,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <ChevronRight size={24} style={{ color: "#3b82f6" }} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            You just ran your first analysis.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 15,
              color: "var(--text-tertiary)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Endall can also build financial models, project estimates, proposals,
            competitive analysis, and more. All with live formulas you can edit.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/demo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "var(--surface-inverse)",
                color: "var(--text-inverse)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Book a Demo Call
            </a>
            <button
              onClick={replay}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "transparent",
                color: "var(--text-primary)",
                border: "1px solid var(--overlay-strong)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={14} /> Replay Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Spotlight overlay */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <mask id="demo-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {sr && (
              <rect
                x={sr.x}
                y={sr.y}
                width={sr.w}
                height={sr.h}
                rx={sr.rx}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#demo-spotlight-mask)"
        />
      </svg>

      {/* Pulse ring around target */}
      {sr && (
        <div
          className="demo-pulse-ring"
          style={{
            position: "fixed",
            top: sr.y - 4,
            left: sr.x - 4,
            width: sr.w + 8,
            height: sr.h + 8,
            borderRadius: sr.rx + 4,
            border: "2px solid rgba(59,130,246,0.5)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Click-through zone on target */}
      {sr && step && (step.action === "click" || step.action === "type") && (
        <div
          style={{
            position: "fixed",
            top: sr.y,
            left: sr.x,
            width: sr.w,
            height: sr.h,
            zIndex: 9999,
            cursor: "pointer",
          }}
          onClick={() => {
            if (step.action === "click") advance();
          }}
        />
      )}

      {/* Coach mark tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: tooltipWidth,
          zIndex: 10001,
          background: "var(--surface-hover)",
          border: "1px solid var(--overlay-medium)",
          borderRadius: 12,
          padding: "20px",
          boxShadow: "0 16px 48px var(--backdrop)",
        }}
      >
        {/* Progress indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {config.steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i <= currentStep ? "#3b82f6" : "var(--overlay-medium)",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: "var(--text-muted)",
              letterSpacing: 1,
            }}
          >
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        <h3
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          {step?.title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontSize: 13,
            color: "var(--text-tertiary)",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          {step?.description}
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={skip}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 12,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
            }}
          >
            <SkipForward size={12} /> Skip
          </button>
          <button
            onClick={onExit}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 12,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Exit demo
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes demo-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .demo-pulse-ring {
          animation: demo-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
