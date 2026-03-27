-- =============================================================================
-- Endall CRM — Phase 1: Saved List Views
-- Per-user saved filters, sorts, and column configurations for CRM lists
-- =============================================================================

CREATE TABLE list_views (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
    object_type   text NOT NULL CHECK (object_type IN (
        'contact', 'company', 'deal', 'task', 'sequence', 'workflow'
    )),
    name          text NOT NULL,
    is_default    boolean NOT NULL DEFAULT false,
    is_shared     boolean NOT NULL DEFAULT false, -- visible to all tenant members
    filters       jsonb NOT NULL DEFAULT '[]',
    -- [{"field": "lifecycle_stage", "op": "eq", "value": "mql"}, {"field": "lead_score", "op": "gte", "value": 50}]
    sorts         jsonb NOT NULL DEFAULT '[]',
    -- [{"field": "created_at", "direction": "desc"}]
    columns       jsonb NOT NULL DEFAULT '[]',
    -- ["name", "email", "company", "lifecycle_stage", "lead_score", "owner"]
    group_by      text, -- optional grouping column
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_list_views_tenant ON list_views(tenant_id);
CREATE INDEX idx_list_views_owner ON list_views(owner_id);
CREATE INDEX idx_list_views_object ON list_views(object_type);

ALTER TABLE list_views ENABLE ROW LEVEL SECURITY;

-- Users can see their own views + shared views in their tenant
CREATE POLICY list_views_select ON list_views
    FOR SELECT USING (
        tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
        AND (
            owner_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
            OR is_shared = true
        )
    );

-- Users can only modify their own views
CREATE POLICY list_views_modify ON list_views
    FOR ALL USING (
        tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
        AND owner_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
    );

CREATE TRIGGER list_views_updated_at
    BEFORE UPDATE ON list_views
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
