export type TechAssignment = {
  tech_id: string;
  tech_name?: string;
  job_ids: string[];
  sequence_order?: string[];
  travel_minutes_estimated?: number;
};

export type JobSummary = {
  title: string;
  address: string;
  customer_name: string;
};

export type DayPlanStatus = "proposed" | "approved" | "expired" | "overridden";

export type DayPlan = {
  id: string;
  tenant_id: string;
  plan_date: string;
  status: DayPlanStatus;
  tech_assignments: TechAssignment[];
  job_summaries?: Record<string, JobSummary>;
  approved_at?: string | null;
  expand_partial?: boolean;
};

export type OverrideRequest = {
  tech_assignments: TechAssignment[];
  notes?: string;
};
