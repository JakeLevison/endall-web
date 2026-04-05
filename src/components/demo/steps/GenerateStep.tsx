"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, TrendingUp, CheckCircle } from "lucide-react";
import DemoCoach from "@/components/demo/DemoCoach";

interface GenerateStepProps {
  onNext: () => void;
  onFileDownloaded?: () => void;
}

type Phase = "form" | "generating" | "ready" | "error";

const LOADING_MESSAGES = [
  "Building your workbook...",
  "Running NPV and IRR calculations...",
  "Applying sensitivity analysis...",
  "Formatting with live Excel formulas...",
  "Ready.",
];

// Pre-generated NPV workbook (static asset). See public/demo-files/.
const DEMO_NPV_FILE = {
  filename: "NPV_Analysis_Demo.xlsx",
  download_url: "/demo-files/Patriot_Electric_NPV.xlsx",
};

export default function GenerateStep({ onNext, onFileDownloaded }: GenerateStepProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [companyName, setCompanyName] = useState("");
  const [contractValue, setContractValue] = useState(350000);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [error] = useState("");
  const [file, setFile] = useState<{ filename: string; download_url: string } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const generate = async () => {
    if (!companyName.trim()) return;
    setPhase("generating");

    // Serve the pre-generated NPV workbook from /public/demo-files/ with
    // staged loading messages so it still feels computed. Total time from
    // click to downloadable file: ~3.2 seconds.
    LOADING_MESSAGES.forEach((msg, i) => {
      timers.current.push(setTimeout(() => setLoadingMsg(msg), i * 650));
    });

    timers.current.push(
      setTimeout(() => {
        setFile({
          filename: `NPV_${companyName.trim().replace(/\s+/g, "_")}.xlsx`,
          download_url: DEMO_NPV_FILE.download_url,
        });
        setPhase("ready");
      }, 3200)
    );
  };

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "48px 20px 80px",
      }}
    >
      {phase === "form" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--overlay-soft)",
              border: "1px solid var(--overlay-medium)",
              marginBottom: 20,
            }}
          >
            <TrendingUp size={22} style={{ color: "var(--text-primary)" }} />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(26px, 4vw, 32px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Build something you can take with you.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 17,
              color: "var(--text-tertiary)",
              lineHeight: 1.5,
              marginBottom: 32,
            }}
          >
            We&rsquo;ll build a full NPV analysis for a contract bid. Just give us
            your company name and the contract value — we&rsquo;ll fill in the rest
            with MEP industry benchmarks.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 28 }}>
            <div>
              <label
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Your company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Dorin Mechanical"
                style={{
                  width: "100%",
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 16,
                  padding: "14px 16px",
                  background: "var(--overlay-soft)",
                  border: "1px solid var(--overlay-medium)",
                  borderRadius: 10,
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Contract value
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 16,
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  value={contractValue}
                  onChange={(e) => setContractValue(Number(e.target.value) || 0)}
                  min={10000}
                  step={10000}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: 16,
                    padding: "14px 16px 14px 28px",
                    background: "var(--overlay-soft)",
                    border: "1px solid var(--overlay-medium)",
                    borderRadius: 10,
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              background: "var(--overlay-weak)",
              border: "1px solid var(--overlay-soft)",
              borderRadius: 10,
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              Pre-filled defaults
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 14,
                color: "var(--text-tertiary)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              30% labor · 25% materials · 15% subs · 3% equipment · 6 month duration · 10% discount rate
            </p>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={!companyName.trim()}
            style={{
              width: "100%",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              fontWeight: 500,
              color: companyName.trim() ? "var(--text-inverse)" : "var(--text-muted)",
              background: companyName.trim() ? "var(--surface-inverse)" : "var(--overlay-soft)",
              border: "none",
              borderRadius: 10,
              padding: "16px 24px",
              cursor: companyName.trim() ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (companyName.trim()) e.currentTarget.style.background = "var(--surface-hover)";
            }}
            onMouseLeave={(e) => {
              if (companyName.trim()) e.currentTarget.style.background = "var(--surface-inverse)";
            }}
          >
            Build my NPV analysis
          </button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              type="button"
              onClick={onNext}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 14,
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 0",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              Skip this step →
            </button>
          </div>
        </motion.div>
      )}

      {phase === "generating" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", paddingTop: 60 }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto",
                borderRadius: "50%",
                border: "2px solid var(--overlay-medium)",
                borderTopColor: "var(--text-primary)",
                animation: "demo-spin 0.8s linear infinite",
              }}
            />
          </div>
          <h3
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 20,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 12,
              letterSpacing: "-0.01em",
            }}
          >
            {loadingMsg}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 15,
              color: "var(--text-tertiary)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            This usually takes 60–90 seconds. The file has live Excel formulas.
          </p>

          <style jsx>{`
            @keyframes demo-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      )}

      {phase === "ready" && file && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--overlay-soft)",
              border: "1px solid var(--overlay-medium)",
              marginBottom: 20,
            }}
          >
            <CheckCircle size={22} style={{ color: "var(--text-primary)" }} />
          </div>

          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "clamp(24px, 4vw, 30px)",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Your NPV analysis is ready.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 17,
              color: "var(--text-tertiary)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Open this file. Every number is a live formula — change any input
            and the whole model updates.
          </p>

          <a
            href={file.download_url}
            download={file.filename}
            onClick={() => onFileDownloaded?.()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              background: "var(--overlay-soft)",
              border: "1px solid var(--overlay-medium)",
              borderRadius: 10,
              textDecoration: "none",
              marginBottom: 32,
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--overlay-medium)";
              e.currentTarget.style.borderColor = "var(--border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--overlay-soft)";
              e.currentTarget.style.borderColor = "var(--overlay-medium)";
            }}
          >
            <Download size={20} style={{ color: "var(--text-primary)" }} />
            <span
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text-primary)",
                flex: 1,
              }}
            >
              {file.filename}
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Download
            </span>
          </a>

          <button
            type="button"
            onClick={onNext}
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              fontWeight: 500,
              color: "var(--text-inverse)",
              background: "var(--surface-inverse)",
              border: "none",
              borderRadius: 10,
              padding: "14px 24px",
              cursor: "pointer",
            }}
          >
            Next step →
          </button>
        </motion.div>
      )}

      {phase === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Something went sideways.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: 16,
              color: "var(--text-tertiary)",
              lineHeight: 1.5,
              marginBottom: 20,
            }}
          >
            {error || "The file service is temporarily unavailable."} Try again,
            or skip to the next step.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => setPhase("form")}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 15,
                fontWeight: 500,
                color: "var(--text-inverse)",
                background: "var(--surface-inverse)",
                border: "none",
                borderRadius: 10,
                padding: "12px 20px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onNext}
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 15,
                color: "var(--text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Skip to next step →
            </button>
          </div>
        </motion.div>
      )}

      {phase === "form" && (
        <DemoCoach
          title="Analyze project returns"
          description="Enter your company name and a contract value — we'll fill in the rest with MEP benchmarks."
          backdrop={false}
        />
      )}
    </div>
  );
}
