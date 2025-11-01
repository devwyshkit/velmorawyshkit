-- =====================================================
-- STORES - Business Entities
-- =====================================================

-- Stores (formerly partners/vendors)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  tagline VARCHAR(500),
  logo_url TEXT,
  banner_url TEXT,
  category VARCHAR(100),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Business
  gstin VARCHAR(15),
  pan VARCHAR(10),
  business_type VARCHAR(50),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Ratings
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Delivery
  delivery_time VARCHAR(50), -- "1-2 days"
  min_order_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Badges
  is_sponsored BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  badge VARCHAR(50), -- 'bestseller', 'trending', 'new'
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Full-text search
  search_vector tsvector
);

-- RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stores"
  ON stores FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL AND status = 'approved');

CREATE POLICY "Store owners can view own store"
  ON stores FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Store owners can insert own store"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Store owners can update own store"
  ON stores FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all stores"
  ON stores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_rating ON stores(rating DESC);
CREATE INDEX IF NOT EXISTS idx_stores_search_vector ON stores USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_stores_deleted_at ON stores(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for search vector
CREATE OR REPLACE FUNCTION stores_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_search_vector_trigger
  BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION stores_search_vector_update();

-- Trigger for updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE stores IS 'Business entities (stores). Created 2025-01-28.';

