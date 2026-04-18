import { describe, it, expect } from "vitest";
import { agentDisplayName, isSuccessStatus } from "@/lib/command-center";

describe("agentDisplayName", () => {
  it("maps hyphenated bridge IDs to display names", () => {
    expect(agentDisplayName("fr-001")).toBe("Front Desk");
    expect(agentDisplayName("sdr-001")).toBe("SDR");
    expect(agentDisplayName("research-001")).toBe("Research");
    expect(agentDisplayName("email-001")).toBe("Email");
  });

  it("maps snake_case ops IDs to display names", () => {
    expect(agentDisplayName("front_desk")).toBe("Front Desk");
    expect(agentDisplayName("sdr")).toBe("SDR");
    expect(agentDisplayName("research")).toBe("Research");
    expect(agentDisplayName("email")).toBe("Email");
  });

  it("falls back to the raw id for unknown agents", () => {
    expect(agentDisplayName("mystery-007")).toBe("mystery-007");
  });

  it("handles null and undefined", () => {
    expect(agentDisplayName(null)).toBe("Unknown");
    expect(agentDisplayName(undefined)).toBe("Unknown");
  });
});

describe("isSuccessStatus", () => {
  it("treats success-like statuses as success", () => {
    expect(isSuccessStatus("success")).toBe(true);
    expect(isSuccessStatus("SUCCESS")).toBe(true);
    expect(isSuccessStatus("ok")).toBe(true);
    expect(isSuccessStatus("completed")).toBe(true);
    expect(isSuccessStatus("done")).toBe(true);
  });

  it("treats everything else as non-success", () => {
    expect(isSuccessStatus("error")).toBe(false);
    expect(isSuccessStatus("failed")).toBe(false);
    expect(isSuccessStatus("")).toBe(false);
    expect(isSuccessStatus(null)).toBe(false);
  });
});
