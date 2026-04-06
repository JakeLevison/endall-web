"use client";

import { useState } from "react";
import { Send, Loader2, FileText } from "lucide-react";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
}

export default function ComposeDialog({ open, onOpenChange, defaultTo }: ComposeDialogProps) {
  const [to, setTo] = useState(defaultTo || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!to || !subject || !body) return;
    setSending(true);
    setResult(null);

    try {
      const resp = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", to, subject, body }),
      });
      const data = await resp.json();

      if (data.sent) {
        setResult({ ok: true, message: "Email sent" });
        setTimeout(() => {
          setTo(defaultTo || "");
          setSubject("");
          setBody("");
          setResult(null);
          onOpenChange(false);
        }, 1500);
      } else {
        setResult({ ok: false, message: data.error || "Failed to send" });
      }
    } catch {
      setResult({ ok: false, message: "Failed to connect to email service" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--surface)] border-[var(--border)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[15px] text-[var(--text-primary)]">Compose email</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Template selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <FileText className="size-3.5 text-[var(--text-muted)] shrink-0" />
            {EMAIL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setSubject(t.subject); setBody(t.body); }}
                className="text-[11px] text-[var(--text-muted)] bg-[var(--overlay-soft)] border border-[var(--border)] rounded-full px-2.5 py-1 hover:bg-[var(--overlay-medium)] hover:text-[var(--text-secondary)] transition-colors whitespace-nowrap shrink-0"
              >
                {t.name}
              </button>
            ))}
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">To</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@company.com"
              className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email..."
              rows={6}
              className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none"
              style={{ fontSize: 16 }}
            />
          </div>

          {result && (
            <p className={`text-[13px] ${result.ok ? "text-emerald-400" : "text-red-400"}`}>
              {result.message}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="text-[13px] h-8 text-[var(--text-tertiary)] border-[var(--border)] bg-[var(--overlay-weak)]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:opacity-90 text-[13px] h-8"
            onClick={handleSend}
            disabled={sending || !to || !subject || !body}
          >
            {sending ? <Loader2 className="size-4 animate-spin mr-1" /> : <Send className="size-4 mr-1" />}
            {sending ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
