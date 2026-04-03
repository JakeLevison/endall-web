-- Contact form submissions from /contact page
CREATE TABLE IF NOT EXISTS contact_submissions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    email       text NOT NULL,
    message     text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Same RLS pattern as demo_requests — service role only
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY contact_submissions_service_role ON contact_submissions
    FOR ALL USING (auth.role() = 'service_role');
