import { describe, it, expect } from "vitest";
import { computeRoiRows, AVG_JOB_VALUE, CLOSE_RATE, WEEKS_PER_MONTH } from "@/lib/roi-tldr";
import fixture from "@/components/sections/__tests__/roi_sample_inputs.json";

// Math-parity test: this fixture is the same one the chief-of-staff backend
// consumes in deploy/ask-endall-bridge/tests/test_roi_tldr.py. If this drifts,
// the on-page table will disagree with the downloaded XLSX.
describe("computeRoiRows — math parity fixture", () => {
  it("matches the backend fixture rows and totals", () => {
    const { rows, totals } = computeRoiRows({
      staff: fixture.inputs.staff,
      monthly_cost: fixture.inputs.monthly_cost,
      missed_calls_per_week: fixture.inputs.missed_calls_per_week,
    });

    expect(rows[0].label).toBe(fixture.expected.rows[0].label);
    expect(rows[0].monthly).toBeCloseTo(fixture.expected.rows[0].monthly, 5);
    expect(rows[0].annual).toBeCloseTo(fixture.expected.rows[0].annual, 5);

    expect(rows[1].label).toBe(fixture.expected.rows[1].label);
    expect(rows[1].monthly).toBeCloseTo(fixture.expected.rows[1].monthly, 5);
    expect(rows[1].annual).toBeCloseTo(fixture.expected.rows[1].annual, 5);

    expect(totals.monthly).toBeCloseTo(fixture.expected.totals.monthly, 5);
    expect(totals.annual).toBeCloseTo(fixture.expected.totals.annual, 5);
  });

  it("zeroes admin cost when staff is 0", () => {
    const { rows } = computeRoiRows({
      staff: 0,
      monthly_cost: 8000,
      missed_calls_per_week: 0,
    });
    expect(rows[0].monthly).toBe(0);
    expect(rows[0].annual).toBe(0);
  });

  it("uses the canonical lost-revenue formula", () => {
    const missed = 5;
    const { rows } = computeRoiRows({
      staff: 0,
      monthly_cost: 0,
      missed_calls_per_week: missed,
    });
    const expected = missed * WEEKS_PER_MONTH * AVG_JOB_VALUE * CLOSE_RATE;
    expect(rows[1].monthly).toBeCloseTo(expected, 5);
  });
});
