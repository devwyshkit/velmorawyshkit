-- Migration: Tiered Pricing Schema for Wyshkit
-- Description: Add support for tiered pricing, add-ons with MOQ, and delivery fee structure

-- 1. Update partner_products table to support tiered pricing
ALTER TABLE partner_products 
ADD COLUMN IF NOT EXISTS listing_type VARCHAR(20) DEFAULT 'individual' CHECK (listing_type IN ('individual', 'hamper', 'service')),
ADD COLUMN IF NOT EXISTS tiered_pricing JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_made_to_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_time_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preview_required BOOLEAN DEFAULT false;

-- 2. Create add_ons table for MOQ-based add-ons
CREATE TABLE IF NOT EXISTS product_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES partner_products(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_paise INTEGER NOT NULL, -- Price in paise (₹1 = 100 paise)
    minimum_order_quantity INTEGER DEFAULT 1,
    requires_proof BOOLEAN DEFAULT false, -- For branding/customization
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create delivery fee configuration table
CREATE TABLE IF NOT EXISTS delivery_fee_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    free_delivery_threshold_paise INTEGER DEFAULT 500000, -- ₹5000 in paise
    order_value_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    distance_multiplier JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create commission rules table for admin management
CREATE TABLE IF NOT EXISTS commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('default', 'vendor', 'category', 'volume')),
    vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50),
    order_value_min_paise INTEGER DEFAULT 0,
    order_value_max_paise INTEGER,
    commission_percent DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create platform fee configuration
CREATE TABLE IF NOT EXISTS platform_fee_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    fixed_fee_paise INTEGER DEFAULT 1000, -- ₹10 in paise
    percentage_fee DECIMAL(5,2) DEFAULT 0,
    category_variations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Update orders table to support new pricing structure
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_fee_paise INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee_paise INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_paise INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS applied_commission_rule_id UUID REFERENCES commission_rules(id);

-- 7. Create order items table to support add-ons
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES partner_products(id),
    quantity INTEGER NOT NULL,
    unit_price_paise INTEGER NOT NULL,
    total_price_paise INTEGER NOT NULL,
    selected_add_ons JSONB DEFAULT '[]'::jsonb,
    customization_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_add_ons_product_id ON product_add_ons(product_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_vendor_id ON commission_rules(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_category ON commission_rules(category);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_fee ON orders(delivery_fee_paise);

-- 9. Insert default delivery fee configuration
INSERT INTO delivery_fee_config (name, free_delivery_threshold_paise, order_value_tiers) VALUES
('Default Delivery Fee Structure', 500000, 
'[
    {"min_value_paise": 0, "max_value_paise": 99900, "fee_paise": 8000},
    {"min_value_paise": 100000, "max_value_paise": 249900, "fee_paise": 5000},
    {"min_value_paise": 250000, "max_value_paise": 499900, "fee_paise": 3000},
    {"min_value_paise": 500000, "max_value_paise": null, "fee_paise": 0}
]'::jsonb);

-- 10. Insert default commission rules
INSERT INTO commission_rules (rule_type, commission_percent, order_value_min_paise, order_value_max_paise) VALUES
('default', 18.00, 0, null),
('volume', 15.00, 500000, 4999000),
('volume', 12.00, 5000000, null);

-- 11. Insert default platform fee configuration
INSERT INTO platform_fee_config (name, fixed_fee_paise, percentage_fee) VALUES
('Default Platform Fee', 1000, 0);

-- 12. Create RLS policies for new tables
ALTER TABLE product_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Product add-ons policies
CREATE POLICY "Partners can manage their product add-ons" ON product_add_ons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM partner_products 
            WHERE partner_products.id = product_add_ons.product_id 
            AND partner_products.partner_id = auth.uid()
        )
    );

-- Delivery fee config policies (admin only)
CREATE POLICY "Admins can manage delivery fee config" ON delivery_fee_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Commission rules policies (admin only)
CREATE POLICY "Admins can manage commission rules" ON commission_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Platform fee config policies (admin only)
CREATE POLICY "Admins can manage platform fee config" ON platform_fee_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Order items policies
CREATE POLICY "Users can view their order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN partner_products ON partner_products.id = order_items.product_id
            WHERE orders.id = order_items.order_id 
            AND partner_products.partner_id = auth.uid()
        )
    );

-- 13. Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_add_ons_updated_at BEFORE UPDATE ON product_add_ons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_fee_config_updated_at BEFORE UPDATE ON delivery_fee_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON commission_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_fee_config_updated_at BEFORE UPDATE ON platform_fee_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
