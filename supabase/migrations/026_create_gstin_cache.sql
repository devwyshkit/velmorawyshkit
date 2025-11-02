-- =====================================================
-- GSTIN VERIFICATION CACHE
-- Cache IDfy verification results to avoid repeat charges
-- =====================================================

CREATE TABLE IF NOT EXISTS gstin_verification_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- GSTIN
  gstin VARCHAR(15) UNIQUE NOT NULL,
  
  -- Verification result from IDfy
  verification_id VARCHAR(200) NOT NULL,
  verified BOOLEAN NOT NULL,
  business_name VARCHAR(255),
  status VARCHAR(50), -- 'Active', 'Cancelled', etc.
  address TEXT,
  
  -- Raw response from IDfy
  raw_response JSONB,
  
  -- Caching
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 30 days from verification
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gstin_cache_gstin ON gstin_verification_cache(gstin);
CREATE INDEX IF NOT EXISTS idx_gstin_cache_expires ON gstin_verification_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_gstin_cache_verified ON gstin_verification_cache(verified);

-- RLS
ALTER TABLE gstin_verification_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active verifications"
  ON gstin_verification_cache FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Admins can manage all verifications"
  ON gstin_verification_cache FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin')
    )
  );

-- Trigger
CREATE TRIGGER update_gstin_cache_updated_at
  BEFORE UPDATE ON gstin_verification_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_gstin_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM gstin_verification_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE gstin_verification_cache IS 'Cached GSTIN verification results from IDfy API (30-day TTL to avoid repeat charges)';

