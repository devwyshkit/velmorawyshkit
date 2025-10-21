/**
 * Component Marketplace Database Schema
 * Enables vendor-to-vendor sourcing for hamper components
 * Wholesale pricing visible only to partners
 */

-- Drop existing tables if re-running
DROP TABLE IF EXISTS sourcing_orders CASCADE;
DROP TABLE IF EXISTS hamper_components CASCADE;
DROP TABLE IF EXISTS component_products CASCADE;

-- Component Products (products available for wholesale/sourcing)
CREATE TABLE component_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES partner_products(id) ON DELETE CASCADE,
  
  -- Wholesale pricing (visible only to partners)
  wholesale_price BIGINT NOT NULL, -- in paise
  wholesale_moq INTEGER DEFAULT 1, -- Minimum order quantity for wholesale
  
  -- Availability
  available_for_sourcing BOOLEAN DEFAULT true,
  current_stock INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 3, -- Days to fulfill order
  
  -- Supplier info
  supplier_name TEXT NOT NULL,
  supplier_location TEXT,
  supplier_rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(partner_id, product_id)
);

-- Hamper Components (components selected for each hamper product)
CREATE TABLE hamper_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hamper_product_id UUID REFERENCES partner_products(id) ON DELETE CASCADE,
  component_product_id UUID REFERENCES component_products(id) ON DELETE CASCADE,
  
  -- Component details
  quantity INTEGER NOT NULL DEFAULT 1,
  wholesale_price_at_time BIGINT NOT NULL, -- Price when hamper was created (historical)
  
  -- Sourcing
  auto_order BOOLEAN DEFAULT true, -- Automatically order when hamper is sold
  supplier_partner_id UUID REFERENCES partner_profiles(id),
  supplier_name TEXT,
  
  -- Assembly
  assembly_order INTEGER DEFAULT 1, -- Order in assembly process
  assembly_instructions TEXT,
  requires_proof BOOLEAN DEFAULT false, -- Does this component need custom proof?
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sourcing Orders (vendor-to-vendor orders for components)
CREATE TABLE sourcing_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order details
  order_number TEXT UNIQUE NOT NULL,
  buyer_partner_id UUID REFERENCES partner_profiles(id), -- Who's buying (curator)
  supplier_partner_id UUID REFERENCES partner_profiles(id), -- Who's selling (manufacturer)
  
  -- Component info
  component_product_id UUID REFERENCES component_products(id),
  quantity INTEGER NOT NULL,
  unit_price BIGINT NOT NULL, -- in paise
  total_amount BIGINT NOT NULL, -- in paise
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'shipped', 'delivered', 'cancelled')),
  
  -- Delivery
  expected_delivery_date DATE,
  actual_delivery_date TIMESTAMPTZ,
  delivery_address TEXT NOT NULL,
  tracking_number TEXT,
  
  -- Linked to main order (if part of hamper order)
  main_order_id UUID, -- Reference to customer's order
  hamper_product_id UUID REFERENCES partner_products(id),
  
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'auto_settled', 'paid')),
  settled_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_component_products_partner ON component_products(partner_id);
CREATE INDEX idx_component_products_available ON component_products(available_for_sourcing) WHERE available_for_sourcing = true;
CREATE INDEX idx_hamper_components_hamper ON hamper_components(hamper_product_id);
CREATE INDEX idx_sourcing_orders_buyer ON sourcing_orders(buyer_partner_id);
CREATE INDEX idx_sourcing_orders_supplier ON sourcing_orders(supplier_partner_id);
CREATE INDEX idx_sourcing_orders_status ON sourcing_orders(status);

-- Row Level Security Policies

-- Component Products: Partners can view all, manage their own
ALTER TABLE component_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view available components"
  ON component_products FOR SELECT
  USING (available_for_sourcing = true OR partner_id = auth.uid());

CREATE POLICY "Partners can manage their own components"
  ON component_products FOR ALL
  USING (partner_id = auth.uid());

-- Hamper Components: Partners can view all, manage their own hampers
ALTER TABLE hamper_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view hamper components"
  ON hamper_components FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_products pp
      WHERE pp.id = hamper_components.hamper_product_id
      AND pp.partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can manage their hamper components"
  ON hamper_components FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM partner_products pp
      WHERE pp.id = hamper_components.hamper_product_id
      AND pp.partner_id = auth.uid()
    )
  );

-- Sourcing Orders: Partners can view orders they're involved in
ALTER TABLE sourcing_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their sourcing orders"
  ON sourcing_orders FOR SELECT
  USING (buyer_partner_id = auth.uid() OR supplier_partner_id = auth.uid());

CREATE POLICY "Buyers can create sourcing orders"
  ON sourcing_orders FOR INSERT
  WITH CHECK (buyer_partner_id = auth.uid());

CREATE POLICY "Suppliers can update their orders"
  ON sourcing_orders FOR UPDATE
  USING (supplier_partner_id = auth.uid());

-- Admins can see everything
CREATE POLICY "Admins can view all component data"
  ON component_products FOR SELECT
  USING ((SELECT (auth.jwt()->>'role') = 'admin'));

CREATE POLICY "Admins can view all hamper components"
  ON hamper_components FOR SELECT
  USING ((SELECT (auth.jwt()->>'role') = 'admin'));

CREATE POLICY "Admins can view all sourcing orders"
  ON sourcing_orders FOR SELECT
  USING ((SELECT (auth.jwt()->>'role') = 'admin'));

-- Functions

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_component_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_component_products_updated_at ON component_products;
CREATE TRIGGER update_component_products_updated_at
  BEFORE UPDATE ON component_products
  FOR EACH ROW EXECUTE FUNCTION update_component_updated_at();

DROP TRIGGER IF EXISTS update_sourcing_orders_updated_at ON sourcing_orders;
CREATE TRIGGER update_sourcing_orders_updated_at
  BEFORE UPDATE ON sourcing_orders
  FOR EACH ROW EXECUTE FUNCTION update_component_updated_at();

-- Function to calculate hamper cost
CREATE OR REPLACE FUNCTION calculate_hamper_cost(p_hamper_id UUID)
RETURNS BIGINT AS $$
DECLARE
  total_cost BIGINT;
BEGIN
  SELECT COALESCE(SUM(quantity * wholesale_price_at_time), 0)
  INTO total_cost
  FROM hamper_components
  WHERE hamper_product_id = p_hamper_id;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE component_products IS 'Products available in component marketplace for wholesale purchasing';
COMMENT ON TABLE hamper_components IS 'Components that make up each hamper product';
COMMENT ON TABLE sourcing_orders IS 'Vendor-to-vendor orders for hamper components';

COMMENT ON COLUMN component_products.wholesale_price IS 'Wholesale price in paise (visible only to partners)';
COMMENT ON COLUMN component_products.wholesale_moq IS 'Minimum order quantity for wholesale pricing';
COMMENT ON COLUMN sourcing_orders.auto_settled IS 'Payment automatically settled after delivery';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Component Marketplace schema created successfully!';
  RAISE NOTICE 'Tables: component_products, hamper_components, sourcing_orders';
  RAISE NOTICE 'RLS policies: Enabled for partner and admin access';
  RAISE NOTICE 'Indexes: Created for performance';
  RAISE NOTICE 'Next: Run this SQL in Supabase SQL Editor';
END $$;

