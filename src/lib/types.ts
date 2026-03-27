export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_id: string | null;
  lifecycle_stage: string;
  lead_score: number | null;
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

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  project: string | null;
  labels: string[] | null;
  due_date: string | null;
  contact_id: string | null;
  deal_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  type: string;
  subject: string;
  body: string;
  contact_id: string | null;
  company_id: string | null;
  deal_id: string | null;
  owner: string;
  created_at: string;
};
