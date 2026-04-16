"use client";

import { createClient } from "@/lib/supabase/client";

export default function NoTenantPage() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm text-center">
        <h1
          className="text-lg font-medium mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          No account found
        </h1>
        <p
          className="text-sm mb-6"
          style={{ color: "var(--text-muted)" }}
        >
          Your email is not associated with any tenant. Contact your
          administrator to get access.
        </p>
        <button
          onClick={signOut}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-opacity"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
