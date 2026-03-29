"use client";

import { useState, useEffect } from "react";
import { Mail, Send, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmailMessage = {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
};

interface EmailPanelProps {
  contactEmail: string;
}

export default function EmailPanel({ contactEmail }: EmailPanelProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [sendTo, setSendTo] = useState(contactEmail);
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const syncEmails = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", max_results: 50 }),
      });
      const data = await resp.json();

      if (data.messages) {
        // Filter to emails involving this contact
        const filtered = data.messages.filter(
          (m: EmailMessage) =>
            m.from?.toLowerCase().includes(contactEmail.toLowerCase()) ||
            m.to?.toLowerCase().includes(contactEmail.toLowerCase())
        );
        setEmails(filtered);
        setSynced(true);
      }
    } catch {
      // API unavailable
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!sendTo || !sendSubject || !sendBody) return;
    setSending(true);
    setSendResult(null);

    try {
      const resp = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          to: sendTo,
          subject: sendSubject,
          body: sendBody,
        }),
      });
      const data = await resp.json();

      if (data.sent) {
        setSendResult("Email sent");
        setSendSubject("");
        setSendBody("");
        setComposeOpen(false);
        // Re-sync to show the sent email
        setTimeout(syncEmails, 2000);
      } else {
        setSendResult(data.error || "Failed to send");
      }
    } catch {
      setSendResult("Failed to connect to email service");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-white/[0.04] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Mail className="size-4 text-zinc-500" />
          <h3 className="text-[13px] font-medium text-white">Emails</h3>
          {emails.length > 0 && (
            <span className="text-[11px] text-zinc-600">{emails.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[12px] text-zinc-400 border-white/[0.06] bg-white/[0.02]"
            onClick={syncEmails}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            <span className="ml-1">{synced ? "Refresh" : "Sync"}</span>
          </Button>
          <Button
            size="sm"
            className="h-7 text-[12px] bg-white text-black hover:bg-zinc-100"
            onClick={() => setComposeOpen(!composeOpen)}
          >
            <Send className="size-3 mr-1" />
            Compose
          </Button>
        </div>
      </div>

      {/* Compose form */}
      {composeOpen && (
        <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.01] space-y-2">
          <input
            type="email"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            placeholder="To"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <input
            type="text"
            value={sendSubject}
            onChange={(e) => setSendSubject(e.target.value)}
            placeholder="Subject"
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <textarea
            value={sendBody}
            onChange={(e) => setSendBody(e.target.value)}
            placeholder="Write your email..."
            rows={4}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded px-3 py-1.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between">
            <div>
              {sendResult && (
                <span className={`text-[12px] ${sendResult === "Email sent" ? "text-emerald-400" : "text-red-400"}`}>
                  {sendResult}
                </span>
              )}
            </div>
            <Button
              size="sm"
              className="h-7 text-[12px] bg-white text-black hover:bg-zinc-100"
              onClick={handleSend}
              disabled={sending || !sendSubject || !sendBody}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      )}

      {/* Email list */}
      <div className="max-h-[400px] overflow-y-auto">
        {!synced ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-zinc-600">Click Sync to load emails for this contact</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-zinc-600">No emails found with {contactEmail}</p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              className="px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
              onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px] text-zinc-400 truncate max-w-[200px]">
                  {email.from?.split("<")[0]?.trim() || email.from}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-zinc-600">{email.date?.split(",")[0]}</span>
                  {expandedId === email.id ? <ChevronUp className="size-3 text-zinc-600" /> : <ChevronDown className="size-3 text-zinc-600" />}
                </div>
              </div>
              <p className="text-[13px] text-white truncate">{email.subject}</p>
              {expandedId === email.id && (
                <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed">{email.snippet}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
