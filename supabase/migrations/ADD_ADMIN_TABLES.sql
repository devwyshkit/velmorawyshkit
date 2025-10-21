-- Migration: Create Admin Console Tables
-- Description: Admin users, audit logs, partner approvals, payouts

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'support', -- super_admin, finance, support, content
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Sessions (for tracking active sessions)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Audit Logs (every action logged)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- approved_partner, processed_payout, force_refund, etc.
  target_type VARCHAR(50), -- partner, order, dispute, payout, etc.
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Approvals (tracks approval workflow)
CREATE TABLE IF NOT EXISTS partner_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID UNIQUE NOT NULL,
  admin_id UUID REFERENCES admin_users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, more_info_requested
  kyc_pan_verified BOOLEAN DEFAULT FALSE,
  kyc_gst_verified BOOLEAN DEFAULT FALSE,
  kyc_bank_verified BOOLEAN DEFAULT FALSE,
  kyc_fssai_verified BOOLEAN,
  commission_tier DECIMAL(5,2) DEFAULT 20.00, -- 15%, 17%, 20%
  notes TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts Table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  earnings INTEGER NOT NULL, -- in paise
  commission INTEGER NOT NULL, -- in paise
  net_payout INTEGER NOT NULL, -- in paise
  status VARCHAR(20) DEFAULT 'pending', -- pending, scheduled, processing, completed, failed
  zoho_invoice_id VARCHAR(100),
  zoho_invoice_number VARCHAR(100),
  razorpay_transfer_id VARCHAR(100),
  processed_by UUID REFERENCES admin_users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payout Transactions (audit trail for payouts)
CREATE TABLE IF NOT EXISTS payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- invoice_generated, payment_initiated, payment_completed, payment_failed
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_partner_approvals_status ON partner_approvals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_partner ON payouts(partner_id, created_at DESC);

-- Comments
COMMENT ON TABLE admin_users IS 'Admin console users with role-based access';
COMMENT ON TABLE admin_audit_logs IS 'Audit trail of all admin actions';
COMMENT ON TABLE partner_approvals IS 'Partner onboarding approval workflow';
COMMENT ON TABLE payouts IS 'Bi-weekly partner payout records';
COMMENT ON TABLE payout_transactions IS 'Audit trail for payout processing';

-- Create default super admin (change password after first login)
INSERT INTO admin_users (email, name, role, permissions, is_active)
VALUES (
  'admin@wyshkit.com',
  'Super Admin',
  'super_admin',
  '["all"]'::jsonb,
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Note: Password will be set via Supabase Auth
-- Create admin user in Supabase Auth Dashboard:
-- Email: admin@wyshkit.com
-- Password: Admin@123 (change in production!)

