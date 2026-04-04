-- Token usage tracking for cost visibility
-- Logs every LLM request: model, tokens, feature, estimated cost

CREATE TABLE IF NOT EXISTS token_usage (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model            text NOT NULL DEFAULT '',
  input_tokens     integer NOT NULL DEFAULT 0,
  output_tokens    integer NOT NULL DEFAULT 0,
  feature          text NOT NULL DEFAULT '',
  session_id       text DEFAULT '',
  estimated_cost_usd numeric(10,6) DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY token_usage_service_role ON token_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Index for daily/weekly aggregation queries
CREATE INDEX idx_token_usage_created ON token_usage(created_at DESC);
CREATE INDEX idx_token_usage_feature ON token_usage(feature, created_at DESC);
