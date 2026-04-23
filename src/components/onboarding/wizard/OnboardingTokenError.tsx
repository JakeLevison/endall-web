import Link from "next/link";

type ErrorKind = "invalid" | "expired" | "used" | "missing";

const COPY: Record<ErrorKind, { title: string; body: string }> = {
  invalid: {
    title: "This invite link is not valid",
    body:
      "The link you clicked is malformed or was truncated by an email client. Ask your account manager for a fresh invite.",
  },
  expired: {
    title: "This invite link has expired",
    body:
      "Invite links are valid for 7 days. Contact your account manager to send a new one.",
  },
  used: {
    title: "This invite has already been redeemed",
    body:
      "A session for this tenant has already completed setup. Sign in with your email to continue.",
  },
  missing: {
    title: "No invite token found",
    body:
      "This page is reached from a magic-link invite email. If you are already set up, sign in to continue.",
  },
};

export function OnboardingTokenError({ kind }: { kind: ErrorKind }) {
  const copy = COPY[kind];
  return (
    <main className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
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
        </div>
        <div className="border border-[var(--border)] rounded-lg p-5 bg-[var(--overlay-weak)]">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">
            {copy.title}
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mb-4">{copy.body}</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="text-center w-full bg-[var(--surface-inverse)] text-black font-medium text-[13px] rounded-lg py-2.5 hover:opacity-90 transition-colors"
            >
              Sign in instead
            </Link>
            <Link
              href="/contact"
              className="text-center w-full border border-[var(--border)] text-[var(--text-primary)] text-[13px] rounded-lg py-2.5 hover:bg-[var(--overlay-soft)] transition-colors"
            >
              Request a new invite
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
