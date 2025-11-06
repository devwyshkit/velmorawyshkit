-- Product Categories Management
-- Admin creates and manages product categories (not hardcoded)

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- For category hierarchy
  display_order INTEGER DEFAULT 0,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT true,
  commission_rate DECIMAL(5,2), -- Optional: Category-specific commission (0-100)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active, display_order);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Update timestamp trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view active categories (needed for product creation/display)
CREATE POLICY public_view_active_categories ON categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage all categories
CREATE POLICY admins_manage_categories ON categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );
