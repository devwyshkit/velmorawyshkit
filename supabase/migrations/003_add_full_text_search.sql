-- Add Full-Text Search to Wyshkit Database
-- This enables fast, typo-tolerant search for items and partners

-- ============================================
-- 1. ADD SEARCH VECTOR COLUMNS
-- ============================================

-- Add search vector column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Add search vector column to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================
-- 2. CREATE GIN INDEXES FOR FAST SEARCH
-- ============================================

-- GIN index on items search_vector (typically 3x faster than GiST)
CREATE INDEX IF NOT EXISTS items_search_idx ON items USING GIN(search_vector);

-- GIN index on partners search_vector
CREATE INDEX IF NOT EXISTS partners_search_idx ON partners USING GIN(search_vector);

-- ============================================
-- 3. CREATE TRIGGER FUNCTIONS
-- ============================================

-- Function to update search vector for items
CREATE OR REPLACE FUNCTION items_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_desc, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Function to update search vector for partners
CREATE OR REPLACE FUNCTION partners_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE TRIGGERS
-- ============================================

-- Trigger for items table
DROP TRIGGER IF EXISTS items_search_update ON items;
CREATE TRIGGER items_search_update
  BEFORE INSERT OR UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION items_search_trigger();

-- Trigger for partners table
DROP TRIGGER IF EXISTS partners_search_update ON partners;
CREATE TRIGGER partners_search_update
  BEFORE INSERT OR UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION partners_search_trigger();

-- ============================================
-- 5. UPDATE EXISTING ROWS
-- ============================================

-- Update search vectors for existing items
UPDATE items SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(short_desc, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'D');

-- Update search vectors for existing partners
UPDATE partners SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C');

-- ============================================
-- 6. CREATE SEARCH FUNCTIONS
-- ============================================

-- Function to search items with ranking
CREATE OR REPLACE FUNCTION search_items(search_query text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  short_desc text,
  image text,
  price numeric,
  rating numeric,
  partner_id uuid,
  badge text,
  sponsored boolean,
  rating_count integer,
  is_customizable boolean,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.description,
    i.short_desc,
    i.image,
    i.price,
    i.rating,
    i.partner_id,
    i.badge,
    i.sponsored,
    i.rating_count,
    i.is_customizable,
    ts_rank(i.search_vector, to_tsquery('english', search_query)) AS rank
  FROM items i
  WHERE i.search_vector @@ to_tsquery('english', search_query)
  ORDER BY rank DESC, i.rating DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to search partners with ranking
CREATE OR REPLACE FUNCTION search_partners(search_query text)
RETURNS TABLE (
  id uuid,
  name text,
  image text,
  rating numeric,
  delivery text,
  category text,
  tagline text,
  badge text,
  sponsored boolean,
  rating_count integer,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.image,
    p.rating,
    p.delivery,
    p.category,
    p.tagline,
    p.badge,
    p.sponsored,
    p.rating_count,
    ts_rank(p.search_vector, to_tsquery('english', search_query)) AS rank
  FROM partners p
  WHERE p.search_vector @@ to_tsquery('english', search_query)
  ORDER BY rank DESC, p.rating DESC
  LIMIT 30;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

-- Allow authenticated users to use search functions
GRANT EXECUTE ON FUNCTION search_items(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION search_partners(text) TO authenticated, anon;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Full-text search is now enabled with:
-- - Weighted search (name > description > tags)
-- - GIN indexes for fast lookups
-- - Automatic updates via triggers
-- - Search functions with ranking
--============================================

