-- =====================================================
-- OCCASIONS
-- =====================================================

-- Occasions
CREATE TABLE IF NOT EXISTS occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  image_url TEXT,
  
  -- Display
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active occasions"
  ON occasions FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage occasions"
  ON occasions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_occasions_slug ON occasions(slug);
CREATE INDEX IF NOT EXISTS idx_occasions_position ON occasions(position);
CREATE INDEX IF NOT EXISTS idx_occasions_is_featured ON occasions(is_featured);

-- Trigger for updated_at
CREATE TRIGGER update_occasions_updated_at
  BEFORE UPDATE ON occasions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE occasions IS 'Gift occasions. Created 2025-01-28.';

