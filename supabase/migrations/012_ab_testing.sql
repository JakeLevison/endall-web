-- =============================================================================
-- Endall CRM — Phase 4: Sequence A/B Testing
-- Variant tracking for email subject lines with automatic winner selection
-- =============================================================================

CREATE TABLE IF NOT EXISTS sequence_variants (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    step_id         uuid NOT NULL REFERENCES sequence_steps(id) ON DELETE CASCADE,
    variant_label   text NOT NULL DEFAULT 'A', -- 'A', 'B', 'C'
    subject         text NOT NULL,
    body            text,
    weight          int NOT NULL DEFAULT 50, -- percentage of sends (A=50, B=50)
    sent_count      int NOT NULL DEFAULT 0,
    opened_count    int NOT NULL DEFAULT 0,
    replied_count   int NOT NULL DEFAULT 0,
    is_winner       boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_tenant ON sequence_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variants_step ON sequence_variants(step_id);

ALTER TABLE sequence_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY variants_tenant_isolation ON sequence_variants
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Add variant_id to email_events for tracking which variant was sent
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES sequence_variants(id) ON DELETE SET NULL;
