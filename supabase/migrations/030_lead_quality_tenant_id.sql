-- Migration 030: Lead quality tagging + tenant scoping for demo_requests
-- Adds lead_quality, turnstile_score, and tenant_id columns.
-- agent_logs and activities already have tenant_id.

ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS lead_quality TEXT DEFAULT 'unknown';
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS turnstile_score FLOAT;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS tenant_id UUID;

CREATE INDEX IF NOT EXISTS idx_demo_requests_tenant ON demo_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_demo_requests_quality ON demo_requests(lead_quality);
