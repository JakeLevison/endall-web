-- Migration 018: Durable file storage via Supabase Storage
-- Files survive Railway redeploy. Bucket is private (service_role access only).

-- Create storage bucket for generated files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('generated-files', 'generated-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: service_role can do everything
CREATE POLICY storage_generated_files_service_role ON storage.objects
    FOR ALL USING (bucket_id = 'generated-files' AND auth.role() = 'service_role');

-- Add columns to generated_files for storage integration
ALTER TABLE generated_files ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE generated_files ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE generated_files ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT 0;
