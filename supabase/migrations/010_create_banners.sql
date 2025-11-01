-- =====================================================
-- BANNERS
-- =====================================================

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  
  -- CTA
  cta_text VARCHAR(100),
  cta_url TEXT,
  store_id UUID REFERENCES stores(id),
  
  -- Display
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Scheduling
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  USING (
    is_active = TRUE AND
    (start_date IS NULL OR start_date <= NOW()) AND
    (end_date IS NULL OR end_date >= NOW())
  );

CREATE POLICY "Admins can manage banners"
  ON banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, end_date);

-- Trigger for updated_at
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE banners IS 'Marketing banners. Created 2025-01-28.';

