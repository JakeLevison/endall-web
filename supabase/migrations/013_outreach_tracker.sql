-- =============================================================================
-- Endall — Outreach Tracker
-- Tracks prospects, outreach stages, and follow-up scheduling
-- =============================================================================

CREATE TABLE IF NOT EXISTS outreach_prospects (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_name    text NOT NULL,
    contact_name    text,
    contact_title   text,
    email           text,
    phone           text,
    website         text,
    city            text,
    state           text,
    employee_count  text,
    industry        text DEFAULT 'HVAC',
    source          text, -- 'linkedin', 'apollo', 'directory', 'referral', 'inbound'
    priority        text DEFAULT 'B' CHECK (priority IN ('A', 'B', 'C')),
    qualifying_signal text, -- why they're a good fit
    status          text DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'replied', 'meeting_scheduled',
        'demo_completed', 'proposal_sent', 'won', 'lost', 'deferred'
    )),
    last_contacted  timestamptz,
    next_follow_up  date,
    sequence_id     uuid REFERENCES sequences(id) ON DELETE SET NULL,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_tenant ON outreach_prospects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_prospects(status);
CREATE INDEX IF NOT EXISTS idx_outreach_priority ON outreach_prospects(priority);
CREATE INDEX IF NOT EXISTS idx_outreach_followup ON outreach_prospects(next_follow_up);

ALTER TABLE outreach_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY outreach_tenant_isolation ON outreach_prospects
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

CREATE TRIGGER outreach_updated_at
    BEFORE UPDATE ON outreach_prospects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
