"use client";

import React from "react";

interface ShimmerBorderProps {
  children: React.ReactNode;
  className?: string;
}

export default function ShimmerBorder({ children, className }: ShimmerBorderProps) {
  return (
    <div className={`shimmer-border-wrapper ${className ?? ""}`} style={{ position: "relative", overflow: "hidden" }}>
      {children}
      <style jsx>{`
        .shimmer-border-wrapper::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100px;
          width: 100px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          animation: shimmer-slide 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes shimmer-slide {
          0% {
            left: -100px;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
