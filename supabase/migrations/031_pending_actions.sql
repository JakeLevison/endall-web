CREATE TABLE IF NOT EXISTS pending_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT NOT NULL,
  source_id TEXT,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);
CREATE INDEX idx_pending_actions_tenant ON pending_actions(tenant_id);
CREATE INDEX idx_pending_actions_status ON pending_actions(tenant_id, status);
