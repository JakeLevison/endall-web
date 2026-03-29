-- =============================================================================
-- Endall CRM — Phase 6: Projects & Sprints
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    description text,
    status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    color       text DEFAULT '#3b82f6',
    owner_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_tenant_isolation ON projects
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Add project_id FK to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

-- Sprints / cycles
CREATE TABLE IF NOT EXISTS sprints (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        text NOT NULL,
    start_date  date NOT NULL,
    end_date    date NOT NULL,
    status      text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sprints_tenant ON sprints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project ON sprints(project_id);

ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY sprints_tenant_isolation ON sprints
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Add sprint_id FK to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES sprints(id) ON DELETE SET NULL;

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
