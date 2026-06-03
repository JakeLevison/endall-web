import { describe, it, expect } from "vitest";
import {
  mapEstimatorMetrics,
  mapRoiStrip,
  mapIntelFreshness,
  deriveNeedsAttention,
  compactCurrency,
  compactNumber,
  pct,
} from "@/lib/command-center-data";
import type { AgentLog, AgentStatusResponse } from "@/lib/ops-api";

const NOW = new Date("2026-06-02T12:00:00Z").getTime();

describe("formatters", () => {
  it("formats currency compactly", () => {
    expect(compactCurrency(164515)).toBe("$165k");
    expect(compactCurrency(316830)).toBe("$317k");
    expect(compactCurrency(338.25)).toBe("$338");
    expect(compactCurrency(2_400_000)).toBe("$2.4M");
    expect(compactCurrency(null)).toBe("—");
  });
  it("formats numbers compactly", () => {
    expect(compactNumber(10.33)).toBe("10.3");
    expect(compactNumber(98)).toBe("98");
    expect(compactNumber(1500)).toBe("1.5k");
    expect(compactNumber(undefined)).toBe("—");
  });
  it("formats percentages", () => {
    expect(pct(1)).toBe("100%");
    expect(pct(0.6875)).toBe("69%");
    expect(pct(null)).toBe("—");
  });
});

describe("mapEstimatorMetrics", () => {
  it("maps the bridge estimates envelope to KPI boxes", () => {
    const result = mapEstimatorMetrics({
      estimates: { total_estimates: 8, approval_rate: 1.0, pending_value: 164515 },
    });
    expect(result).toEqual({
      kpis: [
        { label: "Estimates", value: "8" },
        { label: "Approval", value: "100%" },
        { label: "Pipeline", value: "$165k" },
      ],
    });
  });
  it("returns null when there is no estimates envelope", () => {
    expect(mapEstimatorMetrics({})).toBeNull();
    expect(mapEstimatorMetrics(null)).toBeNull();
  });
});

describe("mapRoiStrip", () => {
  it("coerces object envelopes (total_hours/total_cost) and bare numbers", () => {
    const result = mapRoiStrip({
      labor_hours_saved: { admin_hours: 6.33, estimator_hours: 4, total_hours: 10.33 },
      fte_cost_saved: { total_cost: 338.25 },
      revenue_influenced: 316830,
      pipeline_pending: 164515,
    });
    expect(result).toEqual([
      { label: "Hours saved", value: "10.3" },
      { label: "Cost saved", value: "$338" },
      { label: "Revenue influenced", value: "$317k" },
      { label: "Pipeline pending", value: "$165k" },
    ]);
  });
  it("returns null when roi is absent", () => {
    expect(mapRoiStrip(null)).toBeNull();
  });
});

describe("mapIntelFreshness", () => {
  it("derives last-synced (max) + count from intel rows", () => {
    const result = mapIntelFreshness(
      {
        competitors: [
          { researched_at: "2026-06-01T09:11:50Z" },
          { researched_at: "2026-06-01T09:14:15Z" },
        ],
      },
      { rows: [{ data: { last_updated: "2026-06-01T09:15:29Z" } }] },
    );
    expect(result.competitive_intel.count).toBe(2);
    expect(result.competitive_intel.countLabel).toBe("competitors tracked");
    expect(result.competitive_intel.lastUpdated).toMatch(
      /^2026-06-01T09:14:15/,
    );
    expect(result.market_intel.count).toBe(1);
    expect(result.market_intel.lastUpdated).toMatch(/^2026-06-01T09:15:29/);
  });
  it("returns a no-data shape (count 0, null lastUpdated) for empty intel", () => {
    const result = mapIntelFreshness({ competitors: [] }, {});
    expect(result.competitive_intel).toEqual({
      lastUpdated: null,
      count: 0,
      countLabel: "competitors tracked",
    });
    expect(result.market_intel.count).toBe(0);
  });
});

describe("deriveNeedsAttention", () => {
  const status = (p: Partial<AgentStatusResponse>): AgentStatusResponse => ({
    agent_id: "x",
    pending_messages: 0,
    total_actions: 0,
    conversion_rate: 0,
    status: "healthy",
    ...p,
  });
  const log = (agent_id: string, iso: string): AgentLog => ({
    agent_id,
    action: "x",
    company_name: "",
    result: "",
    status: "completed",
    output_data: null,
    created_at: iso,
  });

  it("lists only health agents that need attention, with human detail", () => {
    const items = deriveNeedsAttention(
      {
        front_desk: status({ pending_messages: 0 }), // ACTIVE (recent log) -> skip
        sdr: status({ pending_messages: 2 }), // PROCESSING -> include
        research: status({ pending_messages: 0 }), // IDLE (no logs) -> skip
        email: null, // OFFLINE -> include
      },
      [log("fr-001", "2026-06-02T11:00:00Z")],
      NOW,
    );

    const byId = Object.fromEntries(items.map((i) => [i.agentId, i]));
    expect(items.map((i) => i.agentId).sort()).toEqual(["email", "sdr"]);
    expect(byId.sdr.status).toBe("PROCESSING");
    expect(byId.sdr.detail).toBe("2 messages pending");
    expect(byId.email.status).toBe("OFFLINE");
    expect(byId.email.label).toBe("Outreach"); // customer relabel
  });
});
