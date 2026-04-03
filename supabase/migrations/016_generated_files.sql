-- Generated files metadata for My Files tab (Ask Endall)
CREATE TABLE IF NOT EXISTS generated_files (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL,
    file_name   text NOT NULL,
    file_type   text NOT NULL DEFAULT 'xlsx',
    description text DEFAULT '',
    file_path   text NOT NULL,
    workflow    text DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: service role only (bridge writes, frontend reads via bridge)
ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY generated_files_service_role ON generated_files
    FOR ALL USING (auth.role() = 'service_role');

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_generated_files_tenant
    ON generated_files (tenant_id, created_at DESC);
