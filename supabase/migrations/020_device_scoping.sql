-- Migration 020: Device-level scoping for Ask Endall
--
-- Until real user auth ships, each browser generates a random device_id
-- (localStorage UUID) and sends it as X-Device-Id. Conversations and
-- generated files are filtered by device_id so every visitor sees only
-- their own history — not the shared tenant firehose.
--
-- Existing rows keep device_id = NULL, which means they will not appear
-- in any device-scoped query (intentional — pre-migration data is orphaned).

ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS device_id text;

ALTER TABLE generated_files
    ADD COLUMN IF NOT EXISTS device_id text;

CREATE INDEX IF NOT EXISTS idx_conversations_device
    ON conversations (device_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_files_device
    ON generated_files (device_id, created_at DESC);
