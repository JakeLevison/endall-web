-- =============================================================================
-- Endall CRM — Phase 1: Association Types
-- HubSpot-style flexible relationships between records with role labels
-- =============================================================================

-- Association type definitions (e.g., "Primary Contact", "Decision Maker")
CREATE TABLE association_types (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name          text NOT NULL,
    from_object   text NOT NULL CHECK (from_object IN ('contact', 'company', 'deal')),
    to_object     text NOT NULL CHECK (to_object IN ('contact', 'company', 'deal')),
    label_from    text, -- "is decision maker at" (from contact's perspective)
    label_to      text, -- "has decision maker" (from company's perspective)
    is_system     boolean NOT NULL DEFAULT false, -- system types can't be deleted
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

CREATE INDEX idx_association_types_tenant ON association_types(tenant_id);
CREATE INDEX idx_association_types_objects ON association_types(from_object, to_object);

ALTER TABLE association_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY association_types_tenant_isolation ON association_types
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Association instances (the actual relationships between records)
CREATE TABLE associations (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    association_type_id uuid NOT NULL REFERENCES association_types(id) ON DELETE CASCADE,
    from_record_id      uuid NOT NULL,
    to_record_id        uuid NOT NULL,
    is_primary          boolean NOT NULL DEFAULT false,
    metadata            jsonb DEFAULT '{}', -- role, notes, etc.
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, association_type_id, from_record_id, to_record_id)
);

CREATE INDEX idx_associations_tenant ON associations(tenant_id);
CREATE INDEX idx_associations_from ON associations(from_record_id);
CREATE INDEX idx_associations_to ON associations(to_record_id);
CREATE INDEX idx_associations_type ON associations(association_type_id);

ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
CREATE POLICY associations_tenant_isolation ON associations
    FOR ALL USING (tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid);

-- Seed system association types (contact↔company, contact↔deal, company↔deal)
-- Run via function after tenant creation:
--   INSERT INTO association_types (tenant_id, name, from_object, to_object, label_from, label_to, is_system) VALUES
--     (tid, 'contact_company', 'contact', 'company', 'works at', 'employs', true),
--     (tid, 'contact_deal',    'contact', 'deal',    'is involved in', 'involves', true),
--     (tid, 'company_deal',    'company', 'deal',    'is associated with', 'belongs to', true);
