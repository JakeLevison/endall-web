CREATE TABLE tenant_members (
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  uuid        NOT NULL REFERENCES tenants(id)    ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id)
);

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memberships"
  ON tenant_members
  FOR SELECT
  USING (auth.uid() = user_id);
