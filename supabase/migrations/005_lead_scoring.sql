-- =============================================================================
-- Endall CRM — Phase 1: Lead Scoring
-- Rules engine, composite scores, history, and threshold-based actions
-- =============================================================================

-- Scoring rules: define what signals add/subtract points
CREATE TABLE lead_scoring_rules (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    signal_type text NOT NULL CHECK (signal_type IN (
        'engagement', 'fit', 'decay', 'completeness'
    )),
    -- engagement: email opened, link clicked, meeting booked, form submitted
    -- fit: job title match, company size, industry, location
    -- decay: subtract points over time without activity
    -- completeness: has email, has phone, has company
    conditions  jsonb NOT NULL DEFAULT '{}',
    -- {"event": "email_opened"} or {"field": "industry", "op": "in", "value": ["SaaS","Fintech"]}
    points      int NOT NULL DEFAULT 0,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scoring_rules_tenant ON lead_scoring_rules(tenant_id);
CREATE INDEX idx_scoring_rules_type ON lead_scoring_rules(signal_type);

ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY scoring_rules_tenant_isolation ON lead_scoring_rules
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Composite score breakdown per contact
CREATE TABLE lead_scores (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id        uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    total_score       int NOT NULL DEFAULT 0,
    engagement_score  int NOT NULL DEFAULT 0,
    fit_score         int NOT NULL DEFAULT 0,
    decay_score       int NOT NULL DEFAULT 0,
    completeness_score int NOT NULL DEFAULT 0,
    last_calculated   timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, contact_id)
);

CREATE INDEX idx_lead_scores_tenant ON lead_scores(tenant_id);
CREATE INDEX idx_lead_scores_contact ON lead_scores(contact_id);
CREATE INDEX idx_lead_scores_total ON lead_scores(total_score);

ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY lead_scores_tenant_isolation ON lead_scores
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Score change history (audit trail)
CREATE TABLE lead_score_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id  uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    rule_id     uuid REFERENCES lead_scoring_rules(id) ON DELETE SET NULL,
    delta       int NOT NULL, -- positive or negative
    new_total   int NOT NULL,
    reason      text, -- 'email_opened', 'decay_7d', 'manual_adjustment'
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_history_tenant ON lead_score_history(tenant_id);
CREATE INDEX idx_score_history_contact ON lead_score_history(contact_id);
CREATE INDEX idx_score_history_created ON lead_score_history(created_at);

ALTER TABLE lead_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY score_history_tenant_isolation ON lead_score_history
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Threshold actions: trigger events when score crosses a boundary
CREATE TABLE lead_score_thresholds (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    threshold   int NOT NULL,
    direction   text NOT NULL CHECK (direction IN ('above', 'below')),
    action_type text NOT NULL CHECK (action_type IN (
        'change_lifecycle', 'enroll_sequence', 'create_task', 'notify', 'webhook'
    )),
    action_config jsonb NOT NULL DEFAULT '{}',
    -- {"stage": "mql"} or {"sequence_id": "uuid"} or {"webhook_url": "..."}
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_score_thresholds_tenant ON lead_score_thresholds(tenant_id);

ALTER TABLE lead_score_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY score_thresholds_tenant_isolation ON lead_score_thresholds
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Triggers
CREATE TRIGGER scoring_rules_updated_at
    BEFORE UPDATE ON lead_scoring_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER lead_scores_updated_at
    BEFORE UPDATE ON lead_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
