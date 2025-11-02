-- =====================================================
-- VENDOR SETTINGS
-- Store customization and catalog preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Catalog customization
  catalog_layout VARCHAR(50) DEFAULT 'grid' CHECK (catalog_layout IN ('grid', 'list', 'banner')),
  show_pricing BOOLEAN DEFAULT true,
  show_stock_status BOOLEAN DEFAULT true,
  require_moq_notification BOOLEAN DEFAULT true,
  
  -- Display preferences
  currency_symbol VARCHAR(10) DEFAULT '₹',
  tax_display VARCHAR(50) DEFAULT 'inclusive' CHECK (tax_display IN ('inclusive', 'exclusive')),
  
  -- Features
  allow_customization BOOLEAN DEFAULT false,
  allow_bulk_orders BOOLEAN DEFAULT true,
  allow_pre_order BOOLEAN DEFAULT false,
  
  -- Communication
  auto_send_emails BOOLEAN DEFAULT true,
  auto_send_sms BOOLEAN DEFAULT false,
  email_templates JSONB DEFAULT '{}'::jsonb,
  
  -- Integration settings
  integration_settings JSONB DEFAULT '{}'::jsonb, -- Razorpay, SMS, etc.
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_vendor_settings_store ON vendor_settings(store_id);

-- RLS
ALTER TABLE vendor_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor can manage own settings"
  ON vendor_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = vendor_settings.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all settings"
  ON vendor_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'kam')
    )
  );

-- Trigger
CREATE TRIGGER update_vendor_settings_updated_at
  BEFORE UPDATE ON vendor_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE vendor_settings IS 'Store catalog customization and preferences';

