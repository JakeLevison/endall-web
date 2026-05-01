import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

let exchangeResult: { error: unknown } = { error: null };

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => {
    const jar = new Map<string, string>();
    return {
      getAll: () => Array.from(jar.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => jar.set(name, value),
    };
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession: vi.fn(async () => exchangeResult),
    },
  }),
}));

import { GET } from "../route";

beforeEach(() => {
  exchangeResult = { error: null };
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

describe("auth callback route", () => {
  it("valid code exchanges session and redirects to /dashboard", async () => {
    const req = new NextRequest(
      new URL("/auth/callback?code=valid-code&next=/dashboard", "https://endall.ai")
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/dashboard");
  });

  it("missing code redirects to /login with error", async () => {
    const req = new NextRequest(
      new URL("/auth/callback", "https://endall.ai")
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
    expect(location).toContain("error=missing_code");
  });

  it("invalid code redirects to /login with auth_failed error", async () => {
    exchangeResult = { error: { message: "invalid" } };
    const req = new NextRequest(
      new URL("/auth/callback?code=bad-code", "https://endall.ai")
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") || "";
    expect(location).toContain("/login");
    expect(location).toContain("error=auth_failed");
  });
});
