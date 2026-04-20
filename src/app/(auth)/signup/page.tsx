import Link from "next/link";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
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

        <SignupForm />

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
