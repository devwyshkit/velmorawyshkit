-- =====================================================
-- SEARCH SUGGESTIONS RPC - Swiggy 2025 Pattern
-- Real-time autocomplete from backend
-- =====================================================

-- Function to get search suggestions (autocomplete)
CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_query TEXT,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  text TEXT,
  type TEXT,
  count INTEGER,
  relevance_score NUMERIC
) AS $$
DECLARE
  v_query_lower TEXT;
  v_limit_recent INTEGER := 3;
  v_limit_trending INTEGER := 3;
  v_limit_products INTEGER := 4;
BEGIN
  v_query_lower := LOWER(TRIM(p_query));

  -- If no query or very short, return recent + trending
  IF LENGTH(v_query_lower) < 1 THEN
    -- Recent searches
    RETURN QUERY
    SELECT 
      'recent-' || row_number() OVER ()::TEXT as id,
      rs.query as text,
      'recent'::TEXT as type,
      rs.search_count::INTEGER as count,
      1.0::NUMERIC as relevance_score
    FROM get_recent_searches(p_user_id, p_session_id, v_limit_recent) rs
    ORDER BY rs.searched_at DESC
    LIMIT v_limit_recent;

    -- Trending searches
    RETURN QUERY
    SELECT 
      'trending-' || row_number() OVER ()::TEXT as id,
      ts.query as text,
      'trending'::TEXT as type,
      ts.search_count::INTEGER as count,
      0.9::NUMERIC as relevance_score
    FROM get_trending_searches(v_limit_trending, 7) ts
    LIMIT v_limit_trending;

    RETURN;
  END IF;

  -- Query provided - return matching suggestions
  -- Priority order: recent searches (exact match) > product names > category matches > trending

  -- 1. Recent searches matching query (highest relevance)
  RETURN QUERY
  SELECT 
    'recent-' || row_number() OVER ()::TEXT as id,
    rs.query as text,
    'recent'::TEXT as type,
    rs.search_count::INTEGER as count,
    CASE 
      WHEN LOWER(rs.query) = v_query_lower THEN 1.0
      WHEN LOWER(rs.query) LIKE v_query_lower || '%' THEN 0.9
      ELSE 0.8
    END::NUMERIC as relevance_score
  FROM get_recent_searches(p_user_id, p_session_id, 20) rs
  WHERE LOWER(rs.query) LIKE '%' || v_query_lower || '%'
  ORDER BY 
    CASE 
      WHEN LOWER(rs.query) = v_query_lower THEN 1
      WHEN LOWER(rs.query) LIKE v_query_lower || '%' THEN 2
      ELSE 3
    END,
    rs.searched_at DESC
  LIMIT 2;

  -- 2. Product names matching query
  RETURN QUERY
  SELECT DISTINCT
    'product-' || si.id::TEXT as id,
    si.name as text,
    'product'::TEXT as type,
    COALESCE(oi.order_count, 0)::INTEGER as count,
    CASE
      WHEN LOWER(si.name) = v_query_lower THEN 0.95
      WHEN LOWER(si.name) LIKE v_query_lower || '%' THEN 0.85
      WHEN LOWER(si.name) LIKE '%' || v_query_lower || '%' THEN 0.75
      ELSE 0.65
    END::NUMERIC as relevance_score
  FROM store_items si
  LEFT JOIN (
    SELECT item_id, COUNT(*) as order_count
    FROM order_items
    GROUP BY item_id
  ) oi ON si.id = oi.item_id
  WHERE LOWER(si.name) LIKE '%' || v_query_lower || '%'
    AND si.is_active = TRUE
  ORDER BY 
    CASE
      WHEN LOWER(si.name) = v_query_lower THEN 1
      WHEN LOWER(si.name) LIKE v_query_lower || '%' THEN 2
      ELSE 3
    END,
    oi.order_count DESC NULLS LAST,
    si.name
  LIMIT v_limit_products;

  -- 3. Category matches (from occasions or store categories)
  RETURN QUERY
  SELECT DISTINCT
    'category-' || row_number() OVER ()::TEXT as id,
    s.category as text,
    'category'::TEXT as type,
    COUNT(DISTINCT s.id)::INTEGER as count,
    0.7::NUMERIC as relevance_score
  FROM stores s
  WHERE LOWER(s.category) LIKE '%' || v_query_lower || '%'
    AND s.is_active = TRUE
    AND s.status = 'approved'
  GROUP BY s.category
  HAVING COUNT(DISTINCT s.id) > 0
  ORDER BY count DESC
  LIMIT 2;

  -- 4. Trending searches matching query (lowest relevance)
  RETURN QUERY
  SELECT 
    'trending-' || row_number() OVER ()::TEXT as id,
    ts.query as text,
    'trending'::TEXT as type,
    ts.search_count::INTEGER as count,
    CASE
      WHEN LOWER(ts.query) LIKE v_query_lower || '%' THEN 0.6
      ELSE 0.5
    END::NUMERIC as relevance_score
  FROM get_trending_searches(20, 7) ts
  WHERE LOWER(ts.query) LIKE '%' || v_query_lower || '%'
  ORDER BY ts.search_count DESC
  LIMIT 2;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION get_search_suggestions IS 'Get real-time search suggestions (Swiggy 2025 pattern: backend autocomplete)';



