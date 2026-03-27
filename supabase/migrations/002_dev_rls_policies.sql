-- =============================================================================
-- Dev-only: permissive RLS policies for anon access (no auth yet)
-- Remove these when Supabase Auth is wired up in Phase 3.
-- =============================================================================

-- Allow anon read/write on all CRM tables during development
DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'tenants', 'companies', 'contacts', 'deals',
        'activities', 'notes', 'tags', 'record_tags',
        'custom_field_definitions', 'custom_field_values'
    ]
    LOOP
        EXECUTE format('CREATE POLICY dev_anon_access ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
    END LOOP;
END;
$$;
