-- =============================================================================
-- Endall CRM — Phase 2/5/6: Sequences, Workflows, Tasks, Email Templates
-- Supabase PostgreSQL Migration
-- =============================================================================
-- Adds sales sequences (multi-step outreach), visual workflow automation,
-- task management, and reusable email templates.
-- =============================================================================

-- =============================================================================
-- Sequences
-- =============================================================================

CREATE TABLE sequences (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            text NOT NULL,
    status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    steps_count     int NOT NULL DEFAULT 0,
    enrolled_count  int NOT NULL DEFAULT 0,
    reply_rate      numeric(5, 2) NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sequences_tenant ON sequences(tenant_id);
CREATE INDEX idx_sequences_status ON sequences(tenant_id, status);

ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY sequences_tenant_isolation ON sequences
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Sequence Steps
-- =============================================================================

CREATE TABLE sequence_steps (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_id     uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    step_order      int NOT NULL,
    step_type       text NOT NULL
                    CHECK (step_type IN ('email', 'delay', 'task', 'linkedin_task')),
    delay_days      int NOT NULL DEFAULT 0,
    subject         text,
    body            text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sequence_steps_tenant ON sequence_steps(tenant_id);
CREATE INDEX idx_sequence_steps_sequence ON sequence_steps(sequence_id);
CREATE INDEX idx_sequence_steps_order ON sequence_steps(sequence_id, step_order);

ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY sequence_steps_tenant_isolation ON sequence_steps
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Sequence Enrollments
-- =============================================================================

CREATE TABLE sequence_enrollments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_id     uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    contact_id      uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'replied', 'bounced', 'unenrolled')),
    current_step    int NOT NULL DEFAULT 0,
    enrolled_at     timestamptz NOT NULL DEFAULT now(),
    completed_at    timestamptz
);

CREATE INDEX idx_sequence_enrollments_tenant ON sequence_enrollments(tenant_id);
CREATE INDEX idx_sequence_enrollments_sequence ON sequence_enrollments(sequence_id);
CREATE INDEX idx_sequence_enrollments_contact ON sequence_enrollments(contact_id);
CREATE INDEX idx_sequence_enrollments_status ON sequence_enrollments(tenant_id, status);

ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY sequence_enrollments_tenant_isolation ON sequence_enrollments
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Workflows
-- =============================================================================

CREATE TABLE workflows (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            text NOT NULL,
    status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'paused')),
    trigger_type    text,
    trigger_config  jsonb,
    enrolled_count  int NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);
CREATE INDEX idx_workflows_status ON workflows(tenant_id, status);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_tenant_isolation ON workflows
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Workflow Nodes
-- =============================================================================

CREATE TABLE workflow_nodes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id     uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_type       text NOT NULL
                    CHECK (node_type IN ('trigger', 'condition', 'action', 'delay')),
    config          jsonb,
    position_x      int NOT NULL DEFAULT 0,
    position_y      int NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_nodes_tenant ON workflow_nodes(tenant_id);
CREATE INDEX idx_workflow_nodes_workflow ON workflow_nodes(workflow_id);

ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_nodes_tenant_isolation ON workflow_nodes
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Workflow Edges
-- =============================================================================

CREATE TABLE workflow_edges (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workflow_id     uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_node_id  uuid NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    target_node_id  uuid NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    label           text
);

CREATE INDEX idx_workflow_edges_tenant ON workflow_edges(tenant_id);
CREATE INDEX idx_workflow_edges_workflow ON workflow_edges(workflow_id);
CREATE INDEX idx_workflow_edges_source ON workflow_edges(source_node_id);
CREATE INDEX idx_workflow_edges_target ON workflow_edges(target_node_id);

ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_edges_tenant_isolation ON workflow_edges
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Tasks
-- =============================================================================

CREATE TABLE tasks (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title           text NOT NULL,
    description     text,
    status          text NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('backlog', 'todo', 'in_progress', 'done', 'cancelled')),
    priority        text NOT NULL DEFAULT 'none'
                    CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
    assignee        uuid REFERENCES profiles(id) ON DELETE SET NULL,
    project         text,
    labels          jsonb,
    due_date        date,
    contact_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id         uuid REFERENCES deals(id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_tasks_status ON tasks(tenant_id, status);
CREATE INDEX idx_tasks_priority ON tasks(tenant_id, priority);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_due_date ON tasks(tenant_id, due_date);
CREATE INDEX idx_tasks_project ON tasks(tenant_id, project);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_tenant_isolation ON tasks
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Email Templates
-- =============================================================================

CREATE TABLE email_templates (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            text NOT NULL,
    subject         text,
    body            text,
    category        text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);
CREATE INDEX idx_email_templates_category ON email_templates(tenant_id, category);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_tenant_isolation ON email_templates
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Dev anon access policies (same pattern as 002_dev_rls_policies.sql)
-- =============================================================================

DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'sequences', 'sequence_steps', 'sequence_enrollments',
        'workflows', 'workflow_nodes', 'workflow_edges',
        'tasks', 'email_templates'
    ]
    LOOP
        EXECUTE format('CREATE POLICY dev_anon_access ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END;
$$;

-- =============================================================================
-- Triggers: auto-update updated_at columns
-- =============================================================================

CREATE TRIGGER trg_sequences_updated_at
    BEFORE UPDATE ON sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Done. New tables:
--   sequences, sequence_steps, sequence_enrollments,
--   workflows, workflow_nodes, workflow_edges,
--   tasks, email_templates
-- All follow the same conventions as 001: uuid PKs, tenant_id, RLS,
-- timestamptz, CHECK constraints, indexes, updated_at triggers.
-- =============================================================================
