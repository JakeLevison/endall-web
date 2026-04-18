-- Migration 025: Reconcile outreach_prospects table collision
-- =============================================================================
-- 013_outreach_tracker.sql (endall-web) and 022_outreach.sql (ask-endall-bridge)
-- both define outreach_prospects with DIFFERENT schemas. Whichever migration
-- ran first is currently live. This migration ensures the bridge's schema
-- (022) is what's live, since the bridge code actively uses it (outreach
-- engine endpoints: /outreach/generate-email, /outreach/approve, /outreach/send,
-- /outreach/webhook/inbound, /outreach/process-queue).
--
-- Column definitions below MUST match:
--   chief-of-staff/deploy/ask-endall-bridge/migrations/022_outreach.sql
-- =============================================================================

-- Step 1: If the OLD schema (013) is live, rename it to preserve data.
-- 013 has a "priority" column; 022 does not. 013 has no "tier"; 022 does.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outreach_prospects' AND column_name = 'priority'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outreach_prospects' AND column_name = 'tier'
  ) THEN
    ALTER TABLE outreach_prospects RENAME TO outreach_prospects_legacy_013;
    RAISE NOTICE 'Renamed old outreach_prospects (013 schema) to outreach_prospects_legacy_013';
  END IF;
END $$;

-- Step 2: Create outreach_prospects with the bridge's schema (022).
-- IF NOT EXISTS so this is a no-op when 022 already ran.
CREATE TABLE IF NOT EXISTS outreach_prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_title TEXT,
  tier INT,
  industry TEXT,
  city TEXT,
  state TEXT,
  corridor TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON outreach_prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_tier ON outreach_prospects(tier);
CREATE INDEX IF NOT EXISTS idx_prospects_email ON outreach_prospects(contact_email);
CREATE INDEX IF NOT EXISTS idx_prospects_followup ON outreach_prospects(next_followup_at);

-- Step 3: Ensure outreach_emails exists (bridge 022 schema).
CREATE TABLE IF NOT EXISTS outreach_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  prospect_id UUID REFERENCES outreach_prospects(id) ON DELETE CASCADE,
  sequence_position INT DEFAULT 1,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  resend_message_id TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emails_prospect ON outreach_emails(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON outreach_emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_resend_id ON outreach_emails(resend_message_id);

-- Step 4: Ensure outreach_sequences exists (bridge 022 schema).
CREATE TABLE IF NOT EXISTS outreach_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  tier INT,
  steps JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true
);

-- Seed the default Tier-1 DC MEP sequence if it doesn't exist.
INSERT INTO outreach_sequences (name, tier, steps) VALUES
  ('Data Center MEP - Tier 1', 1,
   '[
      {"position": 1, "delay_days": 0, "template_key": "dc_intro"},
      {"position": 2, "delay_days": 4, "template_key": "dc_value"},
      {"position": 3, "delay_days": 7, "template_key": "dc_case_study"},
      {"position": 4, "delay_days": 10, "template_key": "dc_breakup"}
   ]'::jsonb)
ON CONFLICT DO NOTHING;
