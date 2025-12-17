-- Add llm_runs table for logging LLM requests and responses
-- This table helps with debugging prompt issues and tracking performance

CREATE TABLE IF NOT EXISTS llm_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  space_id UUID REFERENCES spaces(id),
  model TEXT NOT NULL,
  temperature NUMBER NOT NULL,
  prompt_hash TEXT NOT NULL,
  raw_output TEXT,
  parse_status TEXT NOT NULL CHECK (parse_status IN ('clean', 'extracted', 'failed')),
  used_fallback BOOLEAN NOT NULL DEFAULT false,
  validation_errors TEXT[],
  warnings TEXT[],
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_llm_runs_user_id ON llm_runs(user_id);
CREATE INDEX idx_llm_runs_space_id ON llm_runs(space_id);
CREATE INDEX idx_llm_runs_created_at ON llm_runs(created_at);
CREATE INDEX idx_llm_runs_parse_status ON llm_runs(parse_status);
CREATE INDEX idx_llm_runs_prompt_hash ON llm_runs(prompt_hash);

-- Add llm_cache table for response caching
CREATE TABLE IF NOT EXISTS llm_cache (
  key TEXT PRIMARY KEY,
  response_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ttl_seconds INTEGER DEFAULT 86400,
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + (ttl_seconds || ' seconds')::INTERVAL) STORED
);

-- Index for cache cleanup
CREATE INDEX idx_llm_cache_expires_at ON llm_cache(expires_at);

-- Row Level Security
ALTER TABLE llm_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_cache ENABLE ROW LEVEL SECURITY;

-- Policies for llm_runs (users can see their own runs, space admins can see space runs)
CREATE POLICY "Users can view their own LLM runs" ON llm_runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Space admins can view space LLM runs" ON llm_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_spaces 
      WHERE user_spaces.space_id = llm_runs.space_id 
      AND user_spaces.user_id = auth.uid()
      AND user_spaces.role IN ('admin', 'editor')
    )
  );

-- Policies for llm_cache (cache is shared but access is logged)
CREATE POLICY "Allow authenticated users to access cache" ON llm_cache
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM llm_cache WHERE expires_at < NOW();
END;
$$;

-- Comment on tables
COMMENT ON TABLE llm_runs IS 'Logs all LLM API requests for debugging and analytics';
COMMENT ON TABLE llm_cache IS 'Caches LLM responses to improve performance and reduce costs';
