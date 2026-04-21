"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dispatch";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(urlError || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="border border-[var(--border)] rounded-lg px-4 py-4">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Check your email for a sign-in link.
        </p>
        <p className="text-[13px] text-[var(--text-muted)] mt-2">
          We sent a link to{" "}
          <strong className="text-[var(--text-primary)]">{email}</strong>.
          Click it to sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--overlay-strong)]"
          placeholder="you@company.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--surface-inverse)] text-black font-medium text-[13px] rounded-lg py-2.5 hover:opacity-90 transition-colors disabled:opacity-50"
      >
        {loading ? "Sending link..." : "Send sign-in link"}
      </button>
    </form>
  );
}
