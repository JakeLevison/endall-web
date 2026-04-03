-- Migration 017: Conversations + Messages for Chat Persistence
-- Stores Ask Endall chat history with durable persistence across browser refresh.

CREATE TABLE IF NOT EXISTS conversations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL,
    title       text NOT NULL DEFAULT '',
    workflow    text DEFAULT '',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_service_role ON conversations
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_conversations_tenant
    ON conversations (tenant_id, updated_at DESC);

-- ---

CREATE TABLE IF NOT EXISTS conversation_messages (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role             text NOT NULL CHECK (role IN ('user', 'assistant')),
    content          text NOT NULL DEFAULT '',
    files            jsonb DEFAULT '[]'::jsonb,
    preview_html     text DEFAULT '',
    created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_service_role ON conversation_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON conversation_messages (conversation_id, created_at);
