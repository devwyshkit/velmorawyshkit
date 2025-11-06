-- Promotional Offers Management
-- Supports both admin-created platform offers and partner-created offers requiring approval

CREATE TABLE IF NOT EXISTS promotional_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_type TEXT NOT NULL CHECK (created_by_type IN ('admin', 'partner')),
  created_by_id UUID NOT NULL, -- admin_users.id or stores.owner_id
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE, -- NULL for platform-wide offers
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value INTEGER NOT NULL CHECK (discount_value >= 0), -- percentage (0-100) or amount in paise
  min_order_value_paise INTEGER DEFAULT 0 CHECK (min_order_value_paise >= 0),
  max_discount_paise INTEGER, -- Maximum discount cap for percentage discounts
  applicable_to TEXT NOT NULL CHECK (applicable_to IN ('all_stores', 'specific_stores', 'specific_categories', 'specific_products')),
  applicable_store_ids UUID[], -- Array of store IDs if applicable_to = 'specific_stores'
  applicable_category_ids UUID[], -- Array of category IDs if applicable_to = 'specific_categories'
  applicable_product_ids UUID[], -- Array of product IDs if applicable_to = 'specific_products'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  banner_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired', 'cancelled')),
  admin_notes TEXT, -- Admin rejection/approval notes
  reviewed_by UUID REFERENCES admin_users(id), -- Admin who approved/rejected
  reviewed_at TIMESTAMPTZ,
  usage_limit INTEGER, -- Maximum number of times this offer can be used (NULL = unlimited)
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_discount_value CHECK (
    (discount_type = 'percentage' AND discount_value <= 100) OR
    (discount_type IN ('fixed', 'free_delivery'))
  ),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT partner_offer_requires_store CHECK (
    (created_by_type = 'partner' AND store_id IS NOT NULL) OR
    (created_by_type = 'admin')
  )
);

-- Indexes for performance
CREATE INDEX idx_promotional_offers_status ON promotional_offers(status);
CREATE INDEX idx_promotional_offers_store_id ON promotional_offers(store_id);
CREATE INDEX idx_promotional_offers_dates ON promotional_offers(start_date, end_date);
CREATE INDEX idx_promotional_offers_created_by ON promotional_offers(created_by_type, created_by_id);
CREATE INDEX idx_promotional_offers_active ON promotional_offers(is_active, status, start_date, end_date) 
  WHERE is_active = true AND status = 'active';

-- Update timestamp trigger
CREATE TRIGGER update_promotional_offers_updated_at
  BEFORE UPDATE ON promotional_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set status to 'active' or 'expired' based on dates
CREATE OR REPLACE FUNCTION update_promotional_offer_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status is approved
  IF NEW.status = 'approved' THEN
    IF NOW() >= NEW.start_date AND NOW() <= NEW.end_date THEN
      NEW.status := 'active';
    ELSIF NOW() > NEW.end_date THEN
      NEW.status := 'expired';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_promotional_offer_status
  BEFORE INSERT OR UPDATE ON promotional_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_offer_status();

-- RLS Policies
ALTER TABLE promotional_offers ENABLE ROW LEVEL SECURITY;

-- Partners can view their own offers
CREATE POLICY partners_view_own_offers ON promotional_offers
  FOR SELECT
  USING (
    created_by_type = 'partner' AND 
    created_by_id = auth.uid()
  );

-- Partners can create offers for their store
CREATE POLICY partners_create_offers ON promotional_offers
  FOR INSERT
  WITH CHECK (
    created_by_type = 'partner' AND
    created_by_id = auth.uid() AND
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Partners can update pending offers
CREATE POLICY partners_update_pending_offers ON promotional_offers
  FOR UPDATE
  USING (
    created_by_type = 'partner' AND
    created_by_id = auth.uid() AND
    status = 'pending'
  );

-- Admins can view all offers
CREATE POLICY admins_view_all_offers ON promotional_offers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Admins can create, update, and delete all offers
CREATE POLICY admins_manage_offers ON promotional_offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );
