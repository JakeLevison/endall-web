-- Migration 026: Agent Logs Table
-- Real-time activity feed — every agent action logged here.
-- Contractors see these logs. Outcomes only, not mechanisms.

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id VARCHAR(50) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  result VARCHAR(100),
  company_name VARCHAR(255),
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT agent_logs_agent_id_check CHECK (
    agent_id IN ('fr-001', 'sdr-001', 'research-001', 'email-001')
  ),
  CONSTRAINT agent_logs_action_check CHECK (
    action IN (
      'inbound_call', 'outbound_call', 'research_completed',
      'email_sent', 'campaign_monitored', 'followup_triggered'
    )
  ),
  CONSTRAINT agent_logs_status_check CHECK (
    status IN ('pending', 'in_progress', 'completed', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_tenant_timestamp
  ON agent_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_contact_id
  ON agent_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id
  ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_action
  ON agent_logs(action);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent logs for their tenant"
  ON agent_logs FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can insert agent logs"
  ON agent_logs FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_agent_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_logs_updated_at
  BEFORE UPDATE ON agent_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_logs_updated_at();
