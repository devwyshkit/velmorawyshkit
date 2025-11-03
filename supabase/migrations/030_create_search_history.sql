-- =====================================================
-- SEARCH HISTORY - Swiggy 2025 Pattern
-- Sync search history across devices
-- =====================================================

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type VARCHAR(20) DEFAULT 'item' CHECK (search_type IN ('item', 'store', 'category', 'general')),
  
  -- Metadata for personalization
  location TEXT, -- User's location when searching
  result_count INTEGER DEFAULT 0, -- Number of results shown
  clicked_result_id UUID, -- If user clicked a result
  session_id TEXT, -- For anonymous users
  
  -- Analytics
  search_source VARCHAR(20) DEFAULT 'search_bar' CHECK (search_source IN ('search_bar', 'voice', 'autocomplete', 'trending', 'recent')),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_session_id ON search_history(session_id) WHERE session_id IS NOT NULL;

-- Function to get recent searches for a user
CREATE OR REPLACE FUNCTION get_recent_searches(
  p_user_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  query TEXT,
  searched_at TIMESTAMP WITH TIME ZONE,
  search_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.query,
    MAX(sh.searched_at) as searched_at,
    COUNT(*)::INTEGER as search_count
  FROM search_history sh
  WHERE (p_user_id IS NOT NULL AND sh.user_id = p_user_id)
     OR (p_user_id IS NULL AND sh.session_id = p_session_id)
  GROUP BY sh.query
  ORDER BY MAX(sh.searched_at) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending searches (from real data)
CREATE OR REPLACE FUNCTION get_trending_searches(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  query TEXT,
  search_count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.query,
    COUNT(*)::BIGINT as search_count,
    COUNT(DISTINCT COALESCE(sh.user_id::TEXT, sh.session_id))::BIGINT as unique_users
  FROM search_history sh
  WHERE sh.searched_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY sh.query
  HAVING COUNT(*) >= 2 -- At least 2 searches to be trending
  ORDER BY search_count DESC, unique_users DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE search_history IS 'User search history synced across devices (Swiggy 2025 pattern)';
COMMENT ON FUNCTION get_recent_searches IS 'Get recent searches for a user (synced across devices)';
COMMENT ON FUNCTION get_trending_searches IS 'Get trending searches from real analytics data';



