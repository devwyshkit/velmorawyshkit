-- =====================================================
-- STORE ITEMS - Products
-- =====================================================

-- Store items (products)
CREATE TABLE IF NOT EXISTS store_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  short_desc VARCHAR(500),
  
  -- Images
  image_url TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2), -- Maximum retail price
  cost_price DECIMAL(10, 2),
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  moq INTEGER DEFAULT 1, -- Minimum order quantity
  
  -- Product details
  sku VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  tags TEXT[],
  
  -- Customization
  is_customizable BOOLEAN DEFAULT FALSE,
  customization_options JSONB DEFAULT '{}'::jsonb,
  personalizations JSONB DEFAULT '[]'::jsonb,
  
  -- Variants
  variants JSONB DEFAULT '{}'::jsonb, -- {sizes: [], colors: []}
  
  -- Specifications
  specs JSONB DEFAULT '{}'::jsonb,
  components TEXT[], -- For hampers
  
  -- Delivery
  weight_grams INTEGER,
  dimensions JSONB, -- {length, width, height}
  preparation_time VARCHAR(50), -- "2-3 hours"
  delivery_time VARCHAR(50), -- "3-5 days"
  
  -- Ratings
  rating DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Badges
  badge VARCHAR(50), -- 'bestseller', 'trending', 'new'
  is_sponsored BOOLEAN DEFAULT FALSE,
  
  -- Campaign
  campaign_discount JSONB, -- {type: 'percentage', value: 10}
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Full-text search
  search_vector tsvector,
  
  UNIQUE(store_id, slug)
);

-- RLS
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active items"
  ON store_items FOR SELECT
  USING (is_active = TRUE AND deleted_at IS NULL AND status = 'approved');

CREATE POLICY "Store owners can manage own items"
  ON store_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_items.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all items"
  ON store_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_items_store_id ON store_items(store_id);
CREATE INDEX IF NOT EXISTS idx_store_items_slug ON store_items(store_id, slug);
CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items(category);
CREATE INDEX IF NOT EXISTS idx_store_items_price ON store_items(price);
CREATE INDEX IF NOT EXISTS idx_store_items_rating ON store_items(rating DESC);
CREATE INDEX IF NOT EXISTS idx_store_items_status ON store_items(status);
CREATE INDEX IF NOT EXISTS idx_store_items_search_vector ON store_items USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_store_items_deleted_at ON store_items(deleted_at) WHERE deleted_at IS NULL;

-- Trigger for search vector
CREATE OR REPLACE FUNCTION store_items_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_items_search_vector_trigger
  BEFORE INSERT OR UPDATE ON store_items
  FOR EACH ROW
  EXECUTE FUNCTION store_items_search_vector_update();

-- Trigger for updated_at
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON store_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE store_items IS 'Product items. Created 2025-01-28.';

