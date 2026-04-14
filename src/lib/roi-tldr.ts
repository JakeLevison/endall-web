// Single source of truth for the on-page ROI TLDR math. Mirrors the
// backend `compute_rows` in chief-of-staff's templates/roi_tldr.py exactly
// so the XLSX download matches the table on the page to the penny.

export const AVG_JOB_VALUE = 2500;
export const CLOSE_RATE = 0.15;
export const WEEKS_PER_MONTH = 4.3;

export type RoiInputs = {
  staff: number;
  monthly_cost: number;
  missed_calls_per_week: number;
};

export type RoiRow = { label: string; monthly: number; annual: number };
export type RoiTotals = { monthly: number; annual: number };

export function computeRoiRows(inputs: RoiInputs): {
  rows: RoiRow[];
  totals: RoiTotals;
} {
  const staff = Number.isFinite(inputs.staff) ? inputs.staff : 0;
  const monthlyCost = Number.isFinite(inputs.monthly_cost) ? inputs.monthly_cost : 0;
  const missedCalls = Number.isFinite(inputs.missed_calls_per_week)
    ? inputs.missed_calls_per_week
    : 0;

  const adminCost = staff > 0 ? monthlyCost : 0;
  const lostRevenue = missedCalls * WEEKS_PER_MONTH * AVG_JOB_VALUE * CLOSE_RATE;

  const rows: RoiRow[] = [
    { label: "Current admin cost", monthly: adminCost, annual: adminCost * 12 },
    {
      label: "Lost revenue from missed calls",
      monthly: lostRevenue,
      annual: lostRevenue * 12,
    },
  ];
  const totals: RoiTotals = {
    monthly: rows.reduce((s, r) => s + r.monthly, 0),
    annual: rows.reduce((s, r) => s + r.annual, 0),
  };
  return { rows, totals };
}
