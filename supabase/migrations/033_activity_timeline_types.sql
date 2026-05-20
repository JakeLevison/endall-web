-- Expand the activities table to support the richer timeline shown on the
-- contact detail page: voice call summaries, sent emails, estimate created /
-- approved events, notes, and lifecycle stage changes. Legacy values stay
-- valid so existing rows continue to read cleanly.

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

ALTER TABLE activities
    ADD CONSTRAINT activities_type_check CHECK (
        type IN (
            'email',
            'call',
            'meeting',
            'note',
            'task',
            'voice_call_summary',
            'email_sent',
            'estimate_created',
            'estimate_approved',
            'stage_change'
        )
    );

ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
