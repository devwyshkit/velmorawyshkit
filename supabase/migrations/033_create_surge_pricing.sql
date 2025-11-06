-- Surge Pricing Management
-- Time-based, location-based, weather-based, and demand-based surge multipliers

CREATE TABLE IF NOT EXISTS surge_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('time_based', 'location_based', 'weather_based', 'event_based', 'demand_based')),
  zone_id UUID REFERENCES delivery_zones(id), -- NULL for global rules
  time_slots JSONB, -- [{start: "18:00", end: "22:00", multiplier: 1.5}] for time-based
  weather_conditions TEXT[], -- ['rain', 'extreme_heat'] for weather-based
  special_dates DATE[], -- ['2025-12-25', '2025-01-01'] for event-based
  multiplier DECIMAL(4,2) NOT NULL CHECK (multiplier >= 1.0 AND multiplier <= 5.0), -- 1.0x to 5.0x
  priority INTEGER DEFAULT 0, -- Higher priority rules apply first
  is_active BOOLEAN DEFAULT true,
  manual_override BOOLEAN DEFAULT false, -- If true, this is a manual override
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS current_surge_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES delivery_zones(id) NOT NULL,
  current_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0 CHECK (current_multiplier >= 1.0),
  active_rules UUID[] DEFAULT ARRAY[]::UUID[], -- Array of surge_pricing_rules.id
  reason TEXT, -- Human-readable reason (e.g., "Peak hours + Rain")
  is_manual_override BOOLEAN DEFAULT false,
  override_expires_at TIMESTAMPTZ, -- For temporary manual overrides
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_surge_rules_active ON surge_pricing_rules(is_active, rule_type);
CREATE INDEX idx_surge_rules_zone ON surge_pricing_rules(zone_id);
CREATE INDEX idx_surge_status_zone ON current_surge_status(zone_id);

-- Update timestamp triggers
CREATE TRIGGER update_surge_rules_updated_at
  BEFORE UPDATE ON surge_pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE surge_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_surge_status ENABLE ROW LEVEL SECURITY;

-- Admins can manage surge pricing rules
CREATE POLICY admins_manage_surge_rules ON surge_pricing_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Everyone can view current surge status (partners need this for pricing)
CREATE POLICY public_view_surge_status ON current_surge_status
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update surge status
CREATE POLICY admins_update_surge_status ON current_surge_status
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );
