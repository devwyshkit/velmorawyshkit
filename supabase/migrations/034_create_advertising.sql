-- Advertising Management
-- Banner promotions and priority listing requests from partners

CREATE TABLE IF NOT EXISTS advertising_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('banner_promotion', 'priority_listing')),
  partner_id UUID NOT NULL REFERENCES stores(owner_id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Banner promotion fields
  banner_image_url TEXT, -- Required for banner_promotion
  placement_zone TEXT CHECK (placement_zone IN ('homepage', 'category_page', 'search_results', 'product_page')),
  banner_link_url TEXT, -- Where banner should link to
  
  -- Priority listing fields
  boost_level DECIMAL(3,2) CHECK (boost_level >= 1.0 AND boost_level <= 5.0), -- 1.5x, 2x, etc.
  duration_days INTEGER CHECK (duration_days > 0), -- For priority_listing
  
  -- Common fields
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired')),
  admin_notes TEXT,
  pricing_paise INTEGER, -- Set by admin after approval
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (
    (start_date IS NULL AND end_date IS NULL) OR
    (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date > start_date)
  ),
  CONSTRAINT banner_requires_image CHECK (
    (request_type = 'banner_promotion' AND banner_image_url IS NOT NULL) OR
    (request_type = 'priority_listing')
  )
);

-- Indexes
CREATE INDEX idx_advertising_requests_status ON advertising_requests(status);
CREATE INDEX idx_advertising_requests_partner ON advertising_requests(partner_id);
CREATE INDEX idx_advertising_requests_type ON advertising_requests(request_type, status);
CREATE INDEX idx_advertising_requests_dates ON advertising_requests(start_date, end_date) 
  WHERE status = 'active';

-- Update timestamp trigger
CREATE TRIGGER update_advertising_requests_updated_at
  BEFORE UPDATE ON advertising_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set status to 'active' or 'expired'
CREATE OR REPLACE FUNCTION update_advertising_request_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND NEW.start_date IS NOT NULL THEN
    IF NOW() >= NEW.start_date AND NOW() <= NEW.end_date THEN
      NEW.status := 'active';
    ELSIF NOW() > NEW.end_date THEN
      NEW.status := 'expired';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_advertising_request_status
  BEFORE INSERT OR UPDATE ON advertising_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_advertising_request_status();

-- RLS Policies
ALTER TABLE advertising_requests ENABLE ROW LEVEL SECURITY;

-- Partners can view their own requests
CREATE POLICY partners_view_own_requests ON advertising_requests
  FOR SELECT
  USING (partner_id = auth.uid());

-- Partners can create requests for their store
CREATE POLICY partners_create_requests ON advertising_requests
  FOR INSERT
  WITH CHECK (
    partner_id = auth.uid() AND
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Partners can update pending requests
CREATE POLICY partners_update_pending_requests ON advertising_requests
  FOR UPDATE
  USING (
    partner_id = auth.uid() AND
    status = 'pending'
  );

-- Admins can view and manage all requests
CREATE POLICY admins_manage_requests ON advertising_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );
