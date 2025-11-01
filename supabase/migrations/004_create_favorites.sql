-- =====================================================
-- CREATE FAVORITES TABLE (Polymorphic Design)
-- Replaces wishlist_items with production-ready favorites
-- Follows Swiggy pattern: "favourites" display, "favorites" code
-- =====================================================

-- Create favorites table (polymorphic design)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Polymorphic: can favorite stores OR products
  favoritable_type VARCHAR(50) NOT NULL CHECK (favoritable_type IN ('store', 'product')),
  favoritable_id UUID NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: user can't favorite same item twice
  UNIQUE(user_id, favoritable_type, favoritable_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favoritable ON favorites(favoritable_type, favoritable_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);

-- RLS Policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create views for easier querying
CREATE OR REPLACE VIEW favorite_stores AS
SELECT 
  f.id as favorite_id,
  f.user_id,
  f.created_at as favorited_at,
  s.*
FROM favorites f
JOIN stores s ON f.favoritable_id = s.id
WHERE f.favoritable_type = 'store'
  AND s.deleted_at IS NULL;

CREATE OR REPLACE VIEW favorite_products AS
SELECT 
  f.id as favorite_id,
  f.user_id,
  f.created_at as favorited_at,
  p.*
FROM favorites f
JOIN store_items p ON f.favoritable_id = p.id
WHERE f.favoritable_type = 'product'
  AND p.deleted_at IS NULL;

-- Grant permissions
GRANT SELECT ON favorite_stores TO authenticated;
GRANT SELECT ON favorite_products TO authenticated;

-- Add comment for tracking
COMMENT ON TABLE favorites IS 'Polymorphic favorites table. Supports stores and products. Created 2025-01-28.';

