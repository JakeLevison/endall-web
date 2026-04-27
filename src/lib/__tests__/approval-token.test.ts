import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "node:crypto";

const {
  maybeSingleMock,
  limitMock,
  eqMock,
  selectMock,
  fromMock,
  createClientMock,
} = vi.hoisted(() => {
  const maybeSingleMock = vi.fn();
  const limitMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }));
  const eqMock = vi.fn(() => ({ limit: limitMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));
  const createClientMock = vi.fn(() => ({ from: fromMock }));
  return {
    maybeSingleMock,
    limitMock,
    eqMock,
    selectMock,
    fromMock,
    createClientMock,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import {
  hashApprovalToken,
  lookupApprovalByToken,
} from "../approval-token";

function sha256hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function futureIso(offsetMs = 60_000): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
  createClientMock.mockClear();
  maybeSingleMock.mockReset();
});

// ---------------------------------------------------------------------------
// hashApprovalToken -- pure, deterministic
// ---------------------------------------------------------------------------
describe("hashApprovalToken", () => {
  it("is deterministic: same input always yields the same hex string", () => {
    const token = "some-token-value";
    expect(hashApprovalToken(token)).toBe(hashApprovalToken(token));
  });

  it("matches a manual SHA-256 hex digest", () => {
    const token = "abc123xyz";
    expect(hashApprovalToken(token)).toBe(sha256hex(token));
  });

  it("produces different hashes for different tokens (collision resistance smoke-test)", () => {
    expect(hashApprovalToken("aaaa")).not.toBe(hashApprovalToken("bbbb"));
  });
});

// ---------------------------------------------------------------------------
// lookupApprovalByToken -- Supabase integration, TTL, guard clauses
// ---------------------------------------------------------------------------
describe("lookupApprovalByToken", () => {
  it("returns null for an empty string without hitting Supabase", async () => {
    const result = await lookupApprovalByToken("");
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("returns null for a token shorter than 16 characters", async () => {
    const result = await lookupApprovalByToken("short");
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("returns null when SUPABASE_SERVICE_ROLE_KEY is absent", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const result = await lookupApprovalByToken("a".repeat(40));
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("returns null when NEXT_PUBLIC_SUPABASE_URL is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const result = await lookupApprovalByToken("a".repeat(40));
    expect(createClientMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("returns null when the DB returns no row (token not found)", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    const result = await lookupApprovalByToken("a".repeat(40));
    expect(result).toBeNull();
  });

  it("returns null when the DB returns an error", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "connection refused" },
    });
    const result = await lookupApprovalByToken("a".repeat(40));
    expect(result).toBeNull();
  });

  it("returns null for a token whose expiry is in the past (expired)", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        estimate_id: "est-1",
        tenant_id: "ten-1",
        token_used_at: null,
        token_expires_at: past,
      },
      error: null,
    });
    const result = await lookupApprovalByToken("a".repeat(40));
    expect(result).toBeNull();
  });

  it("returns null for a token with a malformed expiry date", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        estimate_id: "est-1",
        tenant_id: "ten-1",
        token_used_at: null,
        token_expires_at: "not-a-date",
      },
      error: null,
    });
    const result = await lookupApprovalByToken("a".repeat(40));
    expect(result).toBeNull();
  });

  it("returns the summary when the token is valid and not expired", async () => {
    const expires = futureIso(3600_000);
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        estimate_id: "est-999",
        tenant_id: "ten-abc",
        token_used_at: null,
        token_expires_at: expires,
      },
      error: null,
    });
    const result = await lookupApprovalByToken("a".repeat(40));
    expect(result).toEqual({
      estimate_id: "est-999",
      tenant_id: "ten-abc",
      token_used_at: null,
      token_expires_at: expires,
    });
  });

  it("passes the SHA-256 hash of the token (not the raw token) to the .eq() filter", async () => {
    const token = "b".repeat(40);
    const expectedHash = sha256hex(token);
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        estimate_id: "est-1",
        tenant_id: "ten-1",
        token_used_at: null,
        token_expires_at: futureIso(),
      },
      error: null,
    });
    await lookupApprovalByToken(token);
    expect(eqMock).toHaveBeenCalledWith("token_hash", expectedHash);
  });

  it("preserves token_used_at when it is set (already-used token path)", async () => {
    const usedAt = "2026-04-20T10:00:00Z";
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        estimate_id: "est-2",
        tenant_id: "ten-2",
        token_used_at: usedAt,
        token_expires_at: futureIso(),
      },
      error: null,
    });
    const result = await lookupApprovalByToken("c".repeat(40));
    expect(result?.token_used_at).toBe(usedAt);
  });
});
