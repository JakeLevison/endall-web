-- =============================================================================
-- Endall CRM — Phase 1: Lifecycle Stages
-- Registry of stages, auto-advance rules, and stage change history
-- =============================================================================

-- Stage registry (configurable per tenant)
CREATE TABLE lifecycle_stages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    label       text NOT NULL,
    sort_order  int NOT NULL DEFAULT 0,
    color       text DEFAULT '#888888',
    description text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

CREATE INDEX idx_lifecycle_stages_tenant ON lifecycle_stages(tenant_id);

ALTER TABLE lifecycle_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY lifecycle_stages_tenant_isolation ON lifecycle_stages
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Auto-advance rules: conditions that move a contact to the next stage
CREATE TABLE lifecycle_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_stage_id   uuid NOT NULL REFERENCES lifecycle_stages(id) ON DELETE CASCADE,
    to_stage_id     uuid NOT NULL REFERENCES lifecycle_stages(id) ON DELETE CASCADE,
    conditions      jsonb NOT NULL DEFAULT '[]',
    -- conditions: [{"field": "lead_score", "op": ">=", "value": 50}]
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifecycle_rules_tenant ON lifecycle_rules(tenant_id);
CREATE INDEX idx_lifecycle_rules_from ON lifecycle_rules(from_stage_id);

ALTER TABLE lifecycle_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY lifecycle_rules_tenant_isolation ON lifecycle_rules
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Audit log of every stage change
CREATE TABLE lifecycle_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id  uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    from_stage  text,
    to_stage    text NOT NULL,
    changed_by  uuid REFERENCES profiles(id),
    reason      text, -- 'manual', 'rule:uuid', 'import', 'api'
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifecycle_history_tenant ON lifecycle_history(tenant_id);
CREATE INDEX idx_lifecycle_history_contact ON lifecycle_history(contact_id);
CREATE INDEX idx_lifecycle_history_created ON lifecycle_history(created_at);

ALTER TABLE lifecycle_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY lifecycle_history_tenant_isolation ON lifecycle_history
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Seed default stages for new tenants (call via function or trigger)
-- subscriber → lead → mql → sql → opportunity → customer → evangelist

-- Updated_at trigger
CREATE TRIGGER lifecycle_stages_updated_at
    BEFORE UPDATE ON lifecycle_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
