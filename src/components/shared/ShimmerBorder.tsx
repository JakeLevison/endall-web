"use client";

import React from "react";

interface ShimmerBorderProps {
  children: React.ReactNode;
  className?: string;
}

export default function ShimmerBorder({ children, className }: ShimmerBorderProps) {
  return (
    <div className={`shimmer-border-wrapper ${className ?? ""}`} style={{ position: "relative", overflow: "hidden", borderRadius: 12 }}>
      {children}
      <style jsx>{`
        .shimmer-border-wrapper::before,
        .shimmer-border-wrapper::after {
          content: "";
          position: absolute;
          left: -200px;
          width: 200px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--overlay-strong) 50%,
            transparent 100%
          );
          animation: shimmer-slide 4s ease-in-out infinite;
          pointer-events: none;
        }

        .shimmer-border-wrapper::before {
          top: 0;
        }

        .shimmer-border-wrapper::after {
          bottom: 0;
        }

        @keyframes shimmer-slide {
          0% {
            left: -200px;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
