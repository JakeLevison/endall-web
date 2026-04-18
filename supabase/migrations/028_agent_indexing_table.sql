-- Migration 028: Agent Indexing + Contact Attribution
-- Single source of truth for contact state across all agents.

CREATE TABLE IF NOT EXISTS agent_indexing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID UNIQUE NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  front_desk_touched BOOLEAN DEFAULT FALSE,
  sdr_touched BOOLEAN DEFAULT FALSE,
  research_touched BOOLEAN DEFAULT FALSE,
  email_touched BOOLEAN DEFAULT FALSE,
  lead_score_fr VARCHAR(20),
  lead_score_research VARCHAR(20),
  lead_score_composite FLOAT,
  current_stage VARCHAR(100),
  last_agent_action VARCHAR(50),
  last_action_timestamp TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT agent_indexing_stage_check CHECK (
    current_stage IN ('new', 'qualified', 'researched', 'emailed', 'warm', 'deal', 'dead')
  ),
  CONSTRAINT agent_indexing_score_fr_check CHECK (
    lead_score_fr IS NULL OR lead_score_fr IN ('hot', 'warm', 'cold')
  ),
  CONSTRAINT agent_indexing_score_research_check CHECK (
    lead_score_research IS NULL OR lead_score_research IN ('hot', 'warm', 'cold')
  ),
  CONSTRAINT agent_indexing_composite_range CHECK (
    lead_score_composite IS NULL OR (lead_score_composite >= 0.0 AND lead_score_composite <= 1.0)
  )
);

CREATE INDEX IF NOT EXISTS idx_agent_indexing_composite_score
  ON agent_indexing(lead_score_composite DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_agent_indexing_stage
  ON agent_indexing(current_stage);
CREATE INDEX IF NOT EXISTS idx_agent_indexing_tenant_updated
  ON agent_indexing(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_indexing_active
  ON agent_indexing(tenant_id, is_active)
  WHERE is_active = TRUE;

ALTER TABLE agent_indexing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view indexing for their tenant"
  ON agent_indexing FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage indexing"
  ON agent_indexing FOR ALL
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_agent_indexing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_indexing_updated_at
  BEFORE UPDATE ON agent_indexing
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_indexing_updated_at();

-- Attribution columns on existing contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by_agent VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS agent_touch_count INT DEFAULT 0;
