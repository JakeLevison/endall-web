-- Migration 027: Agent Coordination Table
-- Inter-agent message queue. Agents poll for pending work.

CREATE TABLE IF NOT EXISTS agent_coordination (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  from_agent_id VARCHAR(50) NOT NULL,
  to_agent_id VARCHAR(50) NOT NULL,
  message_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  CONSTRAINT agent_coordination_from_check CHECK (
    from_agent_id IN ('fr-001', 'sdr-001', 'research-001', 'email-001')
  ),
  CONSTRAINT agent_coordination_to_check CHECK (
    to_agent_id IN ('fr-001', 'sdr-001', 'research-001', 'email-001')
  ),
  CONSTRAINT agent_coordination_message_type_check CHECK (
    message_type IN ('lead_qualified', 'warm_prospect', 'research_complete', 'email_ready')
  ),
  CONSTRAINT agent_coordination_status_check CHECK (
    status IN ('pending', 'acknowledged', 'completed', 'failed')
  ),
  CONSTRAINT agent_coordination_no_self_send CHECK (
    from_agent_id != to_agent_id
  )
);

CREATE INDEX IF NOT EXISTS idx_agent_coordination_to_agent_status
  ON agent_coordination(to_agent_id, status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_agent_coordination_contact_id
  ON agent_coordination(contact_id);
CREATE INDEX IF NOT EXISTS idx_agent_coordination_created_at
  ON agent_coordination(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_coordination_tenant
  ON agent_coordination(tenant_id);

ALTER TABLE agent_coordination ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view coordination for their tenant"
  ON agent_coordination FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage coordination"
  ON agent_coordination FOR ALL
  WITH CHECK (true);
