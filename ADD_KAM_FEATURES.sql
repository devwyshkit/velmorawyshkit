-- Migration: KAM (Key Account Manager) Features
-- Description: Integrate KAM functionality into admin panel
-- KAMs manage high-value partners, contracts, and relationship

-- ============================================================================
-- 1. ADD KAM FIELDS TO ADMIN_USERS
-- ============================================================================

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS is_kam BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kam_monthly_target JSONB DEFAULT '{"partners": 10, "revenue": 5000000}'::jsonb,
ADD COLUMN IF NOT EXISTS kam_specialization VARCHAR(100); -- 'corporate', 'electronics', 'food', 'premium'

COMMENT ON COLUMN admin_users.is_kam IS 'True if admin user has KAM (Key Account Manager) responsibilities';
COMMENT ON COLUMN admin_users.kam_monthly_target IS 'Monthly targets: {partners: number, revenue: paise}';
COMMENT ON COLUMN admin_users.kam_specialization IS 'KAM specialization area for partner matching';

-- ============================================================================
-- 2. KAM PARTNER ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS kam_partner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kam_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES admin_users(id), -- Who assigned this KAM
  priority VARCHAR(20) DEFAULT 'normal', -- 'high', 'normal', 'low'
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kam_id, partner_id)
);

COMMENT ON TABLE kam_partner_assignments IS 'KAM-to-Partner assignments for relationship management';

-- ============================================================================
-- 3. KAM ACTIVITY LOG (Calls, Meetings, Contracts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kam_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kam_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'contract_sent', 'contract_signed', 'escalation'
  subject VARCHAR(255),
  notes TEXT,
  outcome VARCHAR(20), -- 'successful', 'follow_up_needed', 'closed'
  next_followup DATE,
  attachment_url TEXT, -- For contracts, meeting notes, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

COMMENT ON TABLE kam_activities IS 'Activity log for KAM-partner interactions';

-- ============================================================================
-- 4. KAM TARGETS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS kam_monthly_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kam_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- First day of month
  partners_onboarded INTEGER DEFAULT 0,
  revenue_generated INTEGER DEFAULT 0, -- in paise
  target_partners INTEGER,
  target_revenue INTEGER, -- in paise
  achievement_percent DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kam_id, month)
);

COMMENT ON TABLE kam_monthly_performance IS 'Monthly KAM performance tracking against targets';

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_kam_assignments_kam ON kam_partner_assignments(kam_id, is_active);
CREATE INDEX IF NOT EXISTS idx_kam_assignments_partner ON kam_partner_assignments(partner_id);
CREATE INDEX IF NOT EXISTS idx_kam_activities_kam ON kam_activities(kam_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kam_activities_partner ON kam_activities(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kam_performance ON kam_monthly_performance(kam_id, month DESC);

-- ============================================================================
-- 6. HELPER VIEW: KAM DASHBOARD STATS
-- ============================================================================

CREATE OR REPLACE VIEW kam_dashboard_stats AS
SELECT 
  ka.kam_id,
  COUNT(DISTINCT ka.partner_id) AS assigned_partners,
  COUNT(ka.id) FILTER (WHERE ka.activity_type = 'call' AND DATE(ka.created_at) >= CURRENT_DATE - INTERVAL '7 days') AS calls_this_week,
  COUNT(ka.id) FILTER (WHERE ka.activity_type = 'meeting') AS total_meetings,
  COUNT(ka.id) FILTER (WHERE ka.next_followup IS NOT NULL AND ka.next_followup >= CURRENT_DATE) AS upcoming_followups,
  SUM(p.total_revenue) AS total_partner_revenue
FROM kam_partner_assignments kpa
LEFT JOIN kam_activities ka ON ka.kam_id = kpa.kam_id AND ka.partner_id = kpa.partner_id
LEFT JOIN partner_profiles p ON p.id = kpa.partner_id
WHERE kpa.is_active = TRUE
GROUP BY ka.kam_id;

-- ============================================================================
-- 7. INSERT SAMPLE KAM USER (FOR TESTING)
-- ============================================================================

-- Mark existing admin as KAM
UPDATE admin_users
SET is_kam = TRUE,
    kam_specialization = 'premium',
    kam_monthly_target = '{"partners": 15, "revenue": 10000000}'::jsonb
WHERE email = 'admin@wyshkit.com';

-- ============================================================================
-- 8. FUNCTION: AUTO-ASSIGN KAM BASED ON SPECIALIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_assign_kam_on_partner_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_kam_id UUID;
BEGIN
  -- Only auto-assign when partner is approved and doesn't have KAM
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Find KAM with matching specialization and lowest partner count
    SELECT au.id INTO v_kam_id
    FROM admin_users au
    LEFT JOIN kam_partner_assignments kpa ON kpa.kam_id = au.id AND kpa.is_active = TRUE
    WHERE au.is_kam = TRUE 
      AND au.is_active = TRUE
      AND (au.kam_specialization = NEW.category OR au.kam_specialization IS NULL)
    GROUP BY au.id
    ORDER BY COUNT(kpa.id) ASC
    LIMIT 1;

    -- Assign KAM if found
    IF v_kam_id IS NOT NULL THEN
      INSERT INTO kam_partner_assignments (kam_id, partner_id, priority, notes)
      VALUES (
        v_kam_id,
        NEW.id,
        'normal',
        'Auto-assigned based on specialization: ' || NEW.category
      )
      ON CONFLICT (kam_id, partner_id) DO NOTHING;
      
      RAISE NOTICE 'Auto-assigned KAM % to partner %', v_kam_id, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_assign_kam ON partner_profiles;
CREATE TRIGGER auto_assign_kam
  AFTER UPDATE ON partner_profiles
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION auto_assign_kam_on_partner_approval();

-- Success message
SELECT 
  'KAM features created!' AS status,
  COUNT(*) FILTER (WHERE is_kam = TRUE) AS kam_users_count
FROM admin_users;

