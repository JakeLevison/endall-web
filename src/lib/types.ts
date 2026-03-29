// =============================================================================
// Core CRM Objects
// =============================================================================

export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: string | null;
  lifecycle_stage: string;
  lead_score: number | null;
  merged_into: string | null;
  owner: string;
  created_at: string;
  updated_at: string;
  companies?: { name: string } | null;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  merged_into: string | null;
  owner: string;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: string;
  name: string;
  amount: number;
  stage: string;
  close_date: string;
  company_id: string | null;
  contact_id: string | null;
  owner: string;
  created_at: string;
  updated_at: string;
  companies?: { name: string } | null;
  contacts?: { first_name: string; last_name: string } | null;
};

export type Activity = {
  id: string;
  type: "email" | "call" | "meeting" | "note" | "task";
  subject: string;
  body: string;
  contact_id: string | null;
  company_id: string | null;
  deal_id: string | null;
  owner: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "todo" | "in_progress" | "done" | "cancelled";
  priority: "none" | "low" | "medium" | "high" | "urgent";
  assignee: string | null;
  project: string | null;
  labels: string[] | null;
  due_date: string | null;
  contact_id: string | null;
  deal_id: string | null;
  created_at: string;
  updated_at: string;
};

// =============================================================================
// Lifecycle Stages (Migration 004)
// =============================================================================

export type LifecycleStage = {
  id: string;
  name: string;
  label: string;
  sort_order: number;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type LifecycleRule = {
  id: string;
  from_stage_id: string;
  to_stage_id: string;
  conditions: Record<string, unknown>[];
  is_active: boolean;
  created_at: string;
};

export type LifecycleHistory = {
  id: string;
  contact_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
};

// =============================================================================
// Lead Scoring (Migration 005)
// =============================================================================

export type LeadScoringRule = {
  id: string;
  name: string;
  signal_type: "engagement" | "fit" | "decay" | "completeness";
  conditions: Record<string, unknown>;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadScore = {
  id: string;
  contact_id: string;
  total_score: number;
  engagement_score: number;
  fit_score: number;
  decay_score: number;
  completeness_score: number;
  last_calculated: string;
};

export type LeadScoreThreshold = {
  id: string;
  name: string;
  threshold: number;
  direction: "above" | "below";
  action_type: "change_lifecycle" | "enroll_sequence" | "create_task" | "notify" | "webhook";
  action_config: Record<string, unknown>;
  is_active: boolean;
};

// =============================================================================
// Associations (Migration 006)
// =============================================================================

export type AssociationType = {
  id: string;
  name: string;
  from_object: "contact" | "company" | "deal";
  to_object: "contact" | "company" | "deal";
  label_from: string | null;
  label_to: string | null;
  is_system: boolean;
  created_at: string;
};

export type Association = {
  id: string;
  association_type_id: string;
  from_record_id: string;
  to_record_id: string;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

// =============================================================================
// Dedup & Merge (Migration 007)
// =============================================================================

export type DuplicatePair = {
  id: string;
  object_type: "contact" | "company";
  record_a_id: string;
  record_b_id: string;
  confidence: number;
  match_reasons: { field: string; type: string; similarity?: number }[];
  status: "pending" | "confirmed" | "rejected" | "merged";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type MergeLog = {
  id: string;
  object_type: "contact" | "company";
  winner_id: string;
  loser_id: string;
  field_decisions: Record<string, string>;
  merged_by: string | null;
  created_at: string;
};

// =============================================================================
// List Views (Migration 008)
// =============================================================================

export type ListView = {
  id: string;
  owner_id: string | null;
  object_type: "contact" | "company" | "deal" | "task" | "sequence" | "workflow";
  name: string;
  is_default: boolean;
  is_shared: boolean;
  filters: { field: string; op: string; value: unknown }[];
  sorts: { field: string; direction: "asc" | "desc" }[];
  columns: string[];
  group_by: string | null;
  created_at: string;
  updated_at: string;
};

// =============================================================================
// Email Events (Migration 009)
// =============================================================================

export type EmailEvent = {
  id: string;
  contact_id: string | null;
  sequence_id: string | null;
  step_id: string | null;
  template_id: string | null;
  event_type: "sent" | "delivered" | "opened" | "clicked" | "replied" | "bounced" | "unsubscribed" | "spam_report";
  metadata: Record<string, unknown>;
  message_id: string | null;
  occurred_at: string;
  created_at: string;
};

export type SequenceStats = {
  id: string;
  sequence_id: string;
  step_id: string | null;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  replied_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  last_updated: string;
};

// =============================================================================
// Sequences & Workflows (from Migration 003)
// =============================================================================

export type Sequence = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "archived";
  steps_count: number;
  enrolled_count: number;
  reply_rate: number | null;
  created_at: string;
  updated_at: string;
};

export type SequenceStep = {
  id: string;
  sequence_id: string;
  step_order: number;
  step_type: "email" | "delay" | "task" | "linkedin_task";
  delay_days: number | null;
  subject: string | null;
  body: string | null;
  created_at: string;
};

export type SequenceVariant = {
  id: string;
  step_id: string;
  variant_label: string;
  subject: string;
  body: string | null;
  weight: number;
  sent_count: number;
  opened_count: number;
  replied_count: number;
  is_winner: boolean;
  created_at: string;
};

export type Workflow = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused";
  trigger_type: string | null;
  trigger_config: Record<string, unknown> | null;
  enrolled_count: number;
  created_at: string;
  updated_at: string;
};

// =============================================================================
// Projects & Sprints (Migration 011)
// =============================================================================

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "completed" | "archived";
  color: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Sprint = {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "completed";
  created_at: string;
};
