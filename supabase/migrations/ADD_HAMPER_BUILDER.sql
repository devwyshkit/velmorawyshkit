-- Hamper Builder Database Schema
-- Allows partners to create combo products from components

-- Table: hamper_components (links components to hampers)
CREATE TABLE IF NOT EXISTS hamper_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hamper_product_id UUID REFERENCES partner_products(id) ON DELETE CASCADE,
  component_product_id UUID REFERENCES partner_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  wholesale_price INTEGER, -- Price paid to component supplier (in paise)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: assembly_instructions (step-by-step hamper assembly)
CREATE TABLE IF NOT EXISTS assembly_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hamper_product_id UUID REFERENCES partner_products(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction_text TEXT,
  instruction_image TEXT, -- Cloudinary URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add hamper fields to partner_products
ALTER TABLE partner_products 
ADD COLUMN IF NOT EXISTS is_hamper BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_order_components BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS suggested_retail_price INTEGER, -- Auto-calculated based on margin (in paise)
ADD COLUMN IF NOT EXISTS total_component_cost INTEGER; -- Auto-calculated (in paise)

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hamper_components_hamper ON hamper_components(hamper_product_id);
CREATE INDEX IF NOT EXISTS idx_hamper_components_component ON hamper_components(component_product_id);
CREATE INDEX IF NOT EXISTS idx_assembly_instructions_hamper ON assembly_instructions(hamper_product_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_is_hamper ON partner_products(is_hamper) WHERE is_hamper = true;

-- RLS Policies for hamper_components
ALTER TABLE hamper_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own hamper components"
  ON hamper_components FOR SELECT
  USING (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can insert their own hamper components"
  ON hamper_components FOR INSERT
  WITH CHECK (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update their own hamper components"
  ON hamper_components FOR UPDATE
  USING (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can delete their own hamper components"
  ON hamper_components FOR DELETE
  USING (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

-- RLS Policies for assembly_instructions
ALTER TABLE assembly_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own assembly instructions"
  ON assembly_instructions FOR SELECT
  USING (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can insert their own assembly instructions"
  ON assembly_instructions FOR INSERT
  WITH CHECK (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update their own assembly instructions"
  ON assembly_instructions FOR UPDATE
  USING (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can delete their own assembly instructions"
  ON assembly_instructions FOR DELETE
  USING (
    hamper_product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

-- Admin policies (view all for moderation)
CREATE POLICY "Admins can view all hamper components"
  ON hamper_components FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all assembly instructions"
  ON assembly_instructions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

COMMENT ON TABLE hamper_components IS 'Links component products to hamper products for wholesale sourcing';
COMMENT ON TABLE assembly_instructions IS 'Step-by-step assembly instructions for hamper products';
COMMENT ON COLUMN partner_products.is_hamper IS 'True if this product is a hamper/combo made from components';
COMMENT ON COLUMN partner_products.auto_order_components IS 'Auto-order components from suppliers when hamper is ordered';
COMMENT ON COLUMN partner_products.suggested_retail_price IS 'Auto-calculated retail price based on 3x margin';
COMMENT ON COLUMN partner_products.total_component_cost IS 'Sum of all component wholesale prices';

