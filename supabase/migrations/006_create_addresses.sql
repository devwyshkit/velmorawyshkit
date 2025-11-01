-- =====================================================
-- ADDRESSES
-- =====================================================

-- User addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL CHECK (type IN ('home', 'office', 'other')),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  landmark VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_pincode ON addresses(pincode);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);

-- Trigger for updated_at
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE addresses IS 'User delivery addresses. Created 2025-01-28.';

