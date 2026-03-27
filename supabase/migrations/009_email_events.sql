-- =============================================================================
-- Endall CRM — Phase 1: Email Events & Tracking
-- Open/click/bounce/reply tracking for sequences and individual sends
-- =============================================================================

CREATE TABLE email_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,
    sequence_id     uuid REFERENCES sequences(id) ON DELETE SET NULL,
    step_id         uuid REFERENCES sequence_steps(id) ON DELETE SET NULL,
    template_id     uuid REFERENCES email_templates(id) ON DELETE SET NULL,
    event_type      text NOT NULL CHECK (event_type IN (
        'sent', 'delivered', 'opened', 'clicked', 'replied',
        'bounced', 'unsubscribed', 'spam_report'
    )),
    metadata        jsonb DEFAULT '{}',
    -- For 'clicked': {"url": "https://...", "user_agent": "..."}
    -- For 'bounced': {"bounce_type": "hard", "reason": "..."}
    -- For 'opened': {"user_agent": "...", "ip": "..."}
    message_id      text, -- email provider message ID (Brevo, Resend, etc.)
    occurred_at     timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_events_tenant ON email_events(tenant_id);
CREATE INDEX idx_email_events_contact ON email_events(contact_id);
CREATE INDEX idx_email_events_sequence ON email_events(sequence_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_occurred ON email_events(occurred_at);
CREATE INDEX idx_email_events_message ON email_events(message_id);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_events_tenant_isolation ON email_events
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Aggregate stats per sequence (materialized for fast dashboard queries)
-- Updated by trigger or cron after email_events insert
CREATE TABLE sequence_stats (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_id   uuid NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
    step_id       uuid REFERENCES sequence_steps(id) ON DELETE CASCADE,
    sent_count    int NOT NULL DEFAULT 0,
    delivered_count int NOT NULL DEFAULT 0,
    opened_count  int NOT NULL DEFAULT 0,
    clicked_count int NOT NULL DEFAULT 0,
    replied_count int NOT NULL DEFAULT 0,
    bounced_count int NOT NULL DEFAULT 0,
    unsubscribed_count int NOT NULL DEFAULT 0,
    last_updated  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, sequence_id, step_id)
);

CREATE INDEX idx_sequence_stats_tenant ON sequence_stats(tenant_id);
CREATE INDEX idx_sequence_stats_sequence ON sequence_stats(sequence_id);

ALTER TABLE sequence_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY sequence_stats_tenant_isolation ON sequence_stats
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);
