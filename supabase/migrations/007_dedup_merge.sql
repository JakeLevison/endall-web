-- =============================================================================
-- Endall CRM — Phase 1: Dedup & Merge
-- Duplicate detection pairs, merge execution log, soft-delete via merged_into
-- =============================================================================

-- Add merged_into column to contacts and companies for soft-delete on merge
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS merged_into uuid REFERENCES contacts(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS merged_into uuid REFERENCES companies(id);

CREATE INDEX idx_contacts_merged ON contacts(merged_into) WHERE merged_into IS NOT NULL;
CREATE INDEX idx_companies_merged ON companies(merged_into) WHERE merged_into IS NOT NULL;

-- Duplicate pair candidates (found by dedup algorithm)
CREATE TABLE duplicate_pairs (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    object_type   text NOT NULL CHECK (object_type IN ('contact', 'company')),
    record_a_id   uuid NOT NULL,
    record_b_id   uuid NOT NULL,
    confidence    numeric(5,4) NOT NULL DEFAULT 0, -- 0.0000 to 1.0000
    match_reasons jsonb NOT NULL DEFAULT '[]',
    -- [{"field": "email", "type": "exact"}, {"field": "name", "type": "fuzzy", "similarity": 0.92}]
    status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'rejected', 'merged')),
    reviewed_by   uuid REFERENCES profiles(id),
    reviewed_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, record_a_id, record_b_id)
);

CREATE INDEX idx_duplicate_pairs_tenant ON duplicate_pairs(tenant_id);
CREATE INDEX idx_duplicate_pairs_status ON duplicate_pairs(status);
CREATE INDEX idx_duplicate_pairs_confidence ON duplicate_pairs(confidence DESC);

ALTER TABLE duplicate_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY duplicate_pairs_tenant_isolation ON duplicate_pairs
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Merge execution log (audit trail)
CREATE TABLE merge_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    object_type     text NOT NULL CHECK (object_type IN ('contact', 'company')),
    winner_id       uuid NOT NULL, -- the surviving record
    loser_id        uuid NOT NULL, -- the record merged into winner
    field_decisions jsonb NOT NULL DEFAULT '{}',
    -- {"first_name": "keep_winner", "phone": "keep_loser", "email": "keep_winner"}
    merged_by       uuid REFERENCES profiles(id),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_merge_log_tenant ON merge_log(tenant_id);
CREATE INDEX idx_merge_log_winner ON merge_log(winner_id);

ALTER TABLE merge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY merge_log_tenant_isolation ON merge_log
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);
