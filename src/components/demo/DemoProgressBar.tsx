"use client";

import { useEffect, useRef, useState } from "react";

// Determinate, staged progress bar for the interactive demo.
//
// Stages:
//  0-10%   "Connecting..."           0.5s
//  10-40%  "Reading your data..."    1.5s
//  40-70%  "Generating response..."  slow fill over 3-5s
//  70-90%  "Formatting..."           holds here until `done`
//  90-100% "Done"                    snaps when `done` is true
//
// Rules:
//  - if `done` fires early, jump to 100% and call onDone
//  - if the real response is slow, hold at 85% forever (never go backward)

type Stage = {
  label: string;
  from: number;
  to: number;
  duration: number; // ms to reach `to`
};

const STAGES: Stage[] = [
  { label: "Connecting...", from: 0, to: 10, duration: 500 },
  { label: "Reading your data...", from: 10, to: 40, duration: 1500 },
  { label: "Generating response...", from: 40, to: 70, duration: 4000 },
  { label: "Formatting...", from: 70, to: 85, duration: 2500 },
];

export default function DemoProgressBar({
  done,
  onFinished,
}: {
  done: boolean;
  onFinished?: () => void;
}) {
  const [pct, setPct] = useState(0);
  const [label, setLabel] = useState(STAGES[0].label);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(performance.now());
  const finishedRef = useRef(false);

  useEffect(() => {
    startedAtRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startedAtRef.current;
      let acc = 0;
      let nextPct = 0;
      let nextLabel = STAGES[0].label;
      for (const stage of STAGES) {
        if (elapsed <= acc + stage.duration) {
          const t = Math.max(0, (elapsed - acc) / stage.duration);
          nextPct = stage.from + (stage.to - stage.from) * t;
          nextLabel = stage.label;
          break;
        }
        acc += stage.duration;
        nextPct = stage.to;
        nextLabel = stage.label;
      }
      // never exceed 85 while not done (hold)
      nextPct = Math.min(nextPct, 85);
      setPct((prev) => Math.max(prev, nextPct));
      setLabel(nextLabel);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (done && !finishedRef.current) {
      finishedRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPct(100);
      setLabel("Done");
      const timer = setTimeout(() => onFinished?.(), 250);
      return () => clearTimeout(timer);
    }
  }, [done, onFinished]);

  return (
    <div
      data-demo="progress-bar"
      style={{
        padding: "10px 14px",
        borderRadius: "12px 12px 12px 2px",
        background: "var(--overlay-weak)",
        border: "1px solid var(--overlay-soft)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 240,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.4 }}>{label}</div>
      <div
        style={{
          height: 3,
          background: "var(--overlay-medium)",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, var(--surface-inverse) 0%, var(--surface-inverse) 60%, rgba(96,165,250,0.9) 100%)",
            borderRadius: 2,
            transition: "width 120ms cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 0 6px rgba(96,165,250,0.4)",
          }}
        />
      </div>
    </div>
  );
}
