-- =============================================================================
-- Endall CRM — Phase 1: Webhook Configuration & Delivery Log
-- =============================================================================

CREATE TABLE IF NOT EXISTS webhook_configs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    url         text NOT NULL,
    secret      text, -- HMAC signing secret
    events      jsonb NOT NULL DEFAULT '[]',
    -- ["contact.created", "deal.stage_changed", "*"]
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant ON webhook_configs(tenant_id);

ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_configs_tenant_isolation ON webhook_configs
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    webhook_config_id   uuid NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
    event               text NOT NULL,
    status              text NOT NULL CHECK (status IN ('success', 'failed', 'error')),
    status_code         int,
    error_message       text,
    payload             jsonb,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant ON webhook_deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_config ON webhook_deliveries(webhook_config_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_deliveries_tenant_isolation ON webhook_deliveries
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

CREATE TRIGGER webhook_configs_updated_at
    BEFORE UPDATE ON webhook_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
