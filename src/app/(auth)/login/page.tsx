import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

function LoginFormFallback() {
  return (
    <form className="space-y-4" aria-hidden="true">
      <div>
        <label className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] mb-1.5 block">
          Email
        </label>
        <input
          type="email"
          disabled
          autoComplete="email"
          className="w-full bg-[var(--overlay-soft)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--overlay-strong)]"
          placeholder="you@company.com"
        />
      </div>
      <button
        type="button"
        disabled
        className="w-full bg-[var(--surface-inverse)] text-black font-medium text-[13px] rounded-lg py-2.5 opacity-50"
      >
        Send sign-in link
      </button>
    </form>
  );
}

export default function LoginPage() {
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
          <p className="text-[13px] text-[var(--text-muted)] mt-2">Sign in to your account</p>
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
