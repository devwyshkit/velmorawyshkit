-- Delivery Zones / Location Management
-- Admin manages serviceable areas and delivery zones

CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  coverage_area JSONB, -- Polygon coordinates or city boundaries (for future map integration)
  base_delivery_fee_paise INTEGER DEFAULT 5000 CHECK (base_delivery_fee_paise >= 0), -- Base ₹50
  free_delivery_threshold_paise INTEGER DEFAULT 500000 CHECK (free_delivery_threshold_paise >= 0), -- ₹5000
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store-zone assignments (which partners serve which zones)
CREATE TABLE IF NOT EXISTS store_zone_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES delivery_zones(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, zone_id)
);

-- Indexes
CREATE INDEX idx_delivery_zones_city ON delivery_zones(city, state);
CREATE INDEX idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX idx_store_zone_assignments_store ON store_zone_assignments(store_id);
CREATE INDEX idx_store_zone_assignments_zone ON store_zone_assignments(zone_id);

-- Update timestamp trigger
CREATE TRIGGER update_delivery_zones_updated_at
  BEFORE UPDATE ON delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_zone_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can view active zones (needed for delivery fee calculation)
CREATE POLICY public_view_active_zones ON delivery_zones
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage all zones
CREATE POLICY admins_manage_zones ON delivery_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Partners can view their assigned zones
CREATE POLICY partners_view_own_zones ON store_zone_assignments
  FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Admins can manage all assignments
CREATE POLICY admins_manage_assignments ON store_zone_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );
