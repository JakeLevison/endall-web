"use client";

import { useEffect, useRef, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

type Props = {
  estimateId: string;
  /** Filename hint used when the bridge does not return Content-Disposition. */
  fallbackFilename?: string;
};

// Pulls a filename out of a Content-Disposition header. Returns null if the
// header is missing or unparseable so the caller can fall back. RFC 5987 form
// (filename*=UTF-8''...) is tried first; the plain form regex is anchored to
// a ;-or-start boundary so it does not greedily eat the `filename*=` token.
function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*\s*=\s*([^']*)'([^']*)'([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[3]).trim();
    } catch {
      // fall through to plain
    }
  }
  const plain = /(?:^|;)\s*filename\s*=\s*"?([^"\\;]+)"?/i.exec(header);
  if (plain) return plain[1].trim();
  return null;
}

export function DownloadEstimatePdfButton({
  estimateId,
  fallbackFilename,
}: Props) {
  const [state, setState] = useState<"idle" | "downloading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revokeTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const timers = revokeTimers.current;
    return () => {
      mounted.current = false;
      if (errorTimer.current) clearTimeout(errorTimer.current);
      for (const t of timers) clearTimeout(t);
      timers.clear();
    };
  }, []);

  const flashError = (msg: string) => {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    setState("error");
    setErrorMsg(msg);
    errorTimer.current = setTimeout(() => {
      if (!mounted.current) return;
      setState("idle");
      setErrorMsg(null);
    }, 4000);
  };

  const onClick = async () => {
    if (state === "downloading") return;
    setState("downloading");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/estimates/${encodeURIComponent(estimateId)}/pdf`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        flashError(
          res.status === 404
            ? "PDF not available for this estimate yet."
            : "Could not download PDF. Try again.",
        );
        return;
      }
      const blob = await res.blob();
      const filename =
        parseContentDispositionFilename(res.headers.get("content-disposition")) ||
        fallbackFilename ||
        `estimate-${estimateId}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Give Safari a tick before revoking so the download actually starts.
      const t = setTimeout(() => {
        URL.revokeObjectURL(url);
        revokeTimers.current.delete(t);
      }, 1000);
      revokeTimers.current.add(t);
      if (mounted.current) setState("idle");
    } catch {
      flashError("Could not download PDF. Try again.");
    }
  };

  const downloading = state === "downloading";
  const label = downloading
    ? "Preparing PDF..."
    : state === "error"
      ? errorMsg || "Download failed"
      : "Download PDF";

  return (
    <button
      type="button"
      data-testid="download-estimate-pdf"
      onClick={onClick}
      disabled={downloading}
      aria-busy={downloading}
      title="Download a PDF copy of this estimate"
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--overlay-soft)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--overlay-medium)] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {downloading ? (
        <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-3.5" aria-hidden="true" />
      )}
      <span>{label}</span>
    </button>
  );
}
