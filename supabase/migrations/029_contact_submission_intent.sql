-- Extend contact_submissions for the conversion-oriented contact page rebuild.
-- Adds intent tab, sales-qualifying fields, email-domain tracking + competitor
-- flag, and a source column for attribution.

ALTER TABLE contact_submissions
    ADD COLUMN IF NOT EXISTS intent         text,
    ADD COLUMN IF NOT EXISTS company        text,
    ADD COLUMN IF NOT EXISTS phone          text,
    ADD COLUMN IF NOT EXISTS role           text,
    ADD COLUMN IF NOT EXISTS crew_size      text,
    ADD COLUMN IF NOT EXISTS challenge      text,
    ADD COLUMN IF NOT EXISTS source         text,
    ADD COLUMN IF NOT EXISTS email_domain   text,
    ADD COLUMN IF NOT EXISTS is_competitor  boolean DEFAULT false;

-- Make the original NOT NULL columns nullable where the new form may skip them.
-- `message` is now optional (replaced by `challenge` in the new form).
ALTER TABLE contact_submissions
    ALTER COLUMN message DROP NOT NULL;

-- Demo gate submissions — lightweight table for the 4-field gate between
-- demo steps 2 and 3. Separate from contact_submissions because the intent
-- (unlock demo) and fields are distinct, and it will be queried differently.
CREATE TABLE IF NOT EXISTS demo_gate_submissions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text NOT NULL,
    email         text NOT NULL,
    company       text NOT NULL,
    crew_size     text NOT NULL,
    email_domain  text,
    is_competitor boolean DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE demo_gate_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo_gate_submissions_service_role ON demo_gate_submissions
    FOR ALL USING (auth.role() = 'service_role');
