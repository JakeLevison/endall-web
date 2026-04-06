"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-8">
          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            endall
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--overlay-strong)]"
              placeholder="Jake Levison"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--overlay-strong)]"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--overlay-strong)]"
              placeholder="Min 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--surface-inverse)] text-black font-medium text-[13px] rounded-lg py-2.5 hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-[13px] text-[var(--text-muted)] text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--text-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
