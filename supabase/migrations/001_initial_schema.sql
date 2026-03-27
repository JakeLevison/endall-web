-- =============================================================================
-- Endall CRM — Phase 1: Initial Schema
-- Supabase PostgreSQL Migration
-- =============================================================================
-- Multi-tenant CRM with custom fields (EAV), activity tracking, tagging,
-- and Row Level Security on every table.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Tenants
-- =============================================================================

CREATE TABLE tenants (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants policy: users can only see their own tenant
CREATE POLICY tenants_select ON tenants
    FOR SELECT USING (id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Profiles (tied to Supabase Auth)
-- =============================================================================

CREATE TABLE profiles (
    id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name   text,
    avatar_url  text,
    role        text NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_tenant_isolation ON profiles
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Companies
-- =============================================================================

CREATE TABLE companies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    domain      text,
    industry    text,
    size        text,
    website     text,
    city        text,
    state       text,
    country     text,
    owner       uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, domain)
);

CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_companies_domain ON companies(tenant_id, domain);
CREATE INDEX idx_companies_owner ON companies(owner);
CREATE INDEX idx_companies_name ON companies(tenant_id, name);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_tenant_isolation ON companies
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Contacts
-- =============================================================================

CREATE TABLE contacts (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name      text,
    last_name       text,
    email           text,
    phone           text,
    company_id      uuid REFERENCES companies(id) ON DELETE SET NULL,
    lifecycle_stage text NOT NULL DEFAULT 'subscriber'
                    CHECK (lifecycle_stage IN (
                        'subscriber', 'lead', 'mql', 'sql',
                        'opportunity', 'customer', 'evangelist', 'other'
                    )),
    lead_score      integer NOT NULL DEFAULT 0,
    owner           uuid REFERENCES profiles(id) ON DELETE SET NULL,
    avatar_url      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(tenant_id, email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_owner ON contacts(owner);
CREATE INDEX idx_contacts_lifecycle ON contacts(tenant_id, lifecycle_stage);
CREATE INDEX idx_contacts_lead_score ON contacts(tenant_id, lead_score DESC);
CREATE INDEX idx_contacts_name ON contacts(tenant_id, last_name, first_name);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_tenant_isolation ON contacts
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Deals
-- =============================================================================

CREATE TABLE deals (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    amount      numeric(15, 2),
    stage       text NOT NULL DEFAULT 'New'
                CHECK (stage IN (
                    'New', 'Qualified', 'Proposal Sent',
                    'Negotiation', 'Closed Won', 'Closed Lost'
                )),
    close_date  date,
    company_id  uuid REFERENCES companies(id) ON DELETE SET NULL,
    contact_id  uuid REFERENCES contacts(id) ON DELETE SET NULL,
    owner       uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_tenant ON deals(tenant_id);
CREATE INDEX idx_deals_stage ON deals(tenant_id, stage);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_owner ON deals(owner);
CREATE INDEX idx_deals_close_date ON deals(tenant_id, close_date);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY deals_tenant_isolation ON deals
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Activities
-- =============================================================================

CREATE TABLE activities (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type        text NOT NULL
                CHECK (type IN ('email', 'call', 'meeting', 'note', 'task')),
    subject     text,
    body        text,
    contact_id  uuid REFERENCES contacts(id) ON DELETE CASCADE,
    company_id  uuid REFERENCES companies(id) ON DELETE CASCADE,
    deal_id     uuid REFERENCES deals(id) ON DELETE CASCADE,
    owner       uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_tenant ON activities(tenant_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_type ON activities(tenant_id, type);
CREATE INDEX idx_activities_created ON activities(tenant_id, created_at DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_tenant_isolation ON activities
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Notes
-- =============================================================================

CREATE TABLE notes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    body        text NOT NULL,
    contact_id  uuid REFERENCES contacts(id) ON DELETE CASCADE,
    company_id  uuid REFERENCES companies(id) ON DELETE CASCADE,
    deal_id     uuid REFERENCES deals(id) ON DELETE CASCADE,
    author      uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_tenant ON notes(tenant_id);
CREATE INDEX idx_notes_contact ON notes(contact_id);
CREATE INDEX idx_notes_company ON notes(company_id);
CREATE INDEX idx_notes_deal ON notes(deal_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_tenant_isolation ON notes
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Tags
-- =============================================================================

CREATE TABLE tags (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        text NOT NULL,
    color       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

CREATE INDEX idx_tags_tenant ON tags(tenant_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_tenant_isolation ON tags
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Record Tags (polymorphic join)
-- =============================================================================

CREATE TABLE record_tags (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id   uuid NOT NULL,
    record_type text NOT NULL
                CHECK (record_type IN ('contact', 'company', 'deal')),
    tag_id      uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, record_id, tag_id)
);

CREATE INDEX idx_record_tags_tenant ON record_tags(tenant_id);
CREATE INDEX idx_record_tags_record ON record_tags(record_id, record_type);
CREATE INDEX idx_record_tags_tag ON record_tags(tag_id);

ALTER TABLE record_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY record_tags_tenant_isolation ON record_tags
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Custom Field Definitions (EAV schema registry)
-- =============================================================================
-- Supports 14 field types per the MASTER_BUILD_BLUEPRINT spec.
-- Users create custom properties on any object type without schema changes.
-- =============================================================================

CREATE TABLE custom_field_definitions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    object_type     text NOT NULL,
    field_name      text NOT NULL,
    field_label     text NOT NULL,
    field_type      text NOT NULL
                    CHECK (field_type IN (
                        'text', 'number', 'date', 'datetime', 'select',
                        'multi_select', 'currency', 'email', 'phone',
                        'url', 'boolean', 'formula', 'relation', 'rich_text'
                    )),
    field_group     text NOT NULL DEFAULT 'default',
    is_required     boolean NOT NULL DEFAULT false,
    is_unique       boolean NOT NULL DEFAULT false,
    default_value   jsonb,
    options         jsonb,              -- for select / multi_select
    validation      jsonb,              -- {"min": 0, "max": 1000000, "max_length": 255, "currency_code": "USD", "pattern": "regex"}
    formula_expr    text,               -- for formula type
    relation_target text,               -- for relation type: target object_type
    sort_order      integer NOT NULL DEFAULT 0,
    is_system       boolean NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, object_type, field_name)
);

CREATE INDEX idx_cfd_tenant_obj ON custom_field_definitions(tenant_id, object_type);

ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cfd_tenant_isolation ON custom_field_definitions
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Custom Field Values (EAV value store)
-- =============================================================================
-- Each value row stores data in exactly one typed column based on the
-- corresponding field_type in custom_field_definitions.
-- =============================================================================

CREATE TABLE custom_field_values (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id       uuid NOT NULL,
    field_def_id    uuid NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    value_text      text,               -- text, select, email, phone, url, rich_text, multi_select (JSON), formula
    value_number    numeric,            -- number, currency, boolean (0/1)
    value_date      timestamptz,        -- date, datetime
    value_ref       uuid,               -- relation (target record_id)
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, record_id, field_def_id)
);

CREATE INDEX idx_cfv_record ON custom_field_values(tenant_id, record_id);
CREATE INDEX idx_cfv_field ON custom_field_values(field_def_id);
CREATE INDEX idx_cfv_text ON custom_field_values(field_def_id, value_text);
CREATE INDEX idx_cfv_number ON custom_field_values(field_def_id, value_number);
CREATE INDEX idx_cfv_date ON custom_field_values(field_def_id, value_date);

ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY cfv_tenant_isolation ON custom_field_values
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- =============================================================================
-- Trigger: auto-update updated_at columns
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cfd_updated_at
    BEFORE UPDATE ON custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cfv_updated_at
    BEFORE UPDATE ON custom_field_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- Done. All tables have:
--   - uuid PKs with gen_random_uuid()
--   - tenant_id NOT NULL with FK to tenants
--   - RLS enabled with tenant isolation policies
--   - timestamptz for all temporal columns
--   - CHECK constraints on enum-like columns
--   - Indexes on FKs and commonly filtered columns
--   - Auto-updating updated_at triggers where applicable
-- =============================================================================
