-- Demo request submissions from /demo page
CREATE TABLE IF NOT EXISTS demo_requests (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    work_email  text NOT NULL,
    company     text NOT NULL,
    trade       text NOT NULL,
    team_size   text NOT NULL,
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- No RLS — this is a public-facing form, inserted via service role key
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (anon has no access)
CREATE POLICY demo_requests_service_role ON demo_requests
    FOR ALL USING (auth.role() = 'service_role');
