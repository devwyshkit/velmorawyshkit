-- Notification Campaigns Management
-- Admin sends targeted notifications to users/partners

CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('promotional', 'informational', 'alert')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all_users', 'all_partners', 'specific_users', 'specific_partners', 'location_based')),
  target_user_ids UUID[], -- For specific_users
  target_partner_ids UUID[], -- For specific_partners
  target_location TEXT, -- City or zone for location_based
  scheduled_send_at TIMESTAMPTZ, -- NULL for immediate send
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  delivery_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification delivery log
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'partner')),
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  delivery_status TEXT NOT NULL DEFAULT 'delivered' CHECK (delivery_status IN ('delivered', 'failed', 'pending'))
);

-- Indexes
CREATE INDEX idx_notification_campaigns_status ON notification_campaigns(status, scheduled_send_at);
CREATE INDEX idx_notification_campaigns_created_by ON notification_campaigns(created_by);
CREATE INDEX idx_notification_deliveries_campaign ON notification_deliveries(campaign_id);
CREATE INDEX idx_notification_deliveries_user ON notification_deliveries(user_id, user_type);

-- Update timestamp trigger
CREATE TRIGGER update_notification_campaigns_updated_at
  BEFORE UPDATE ON notification_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Admins can manage notification campaigns
CREATE POLICY admins_manage_campaigns ON notification_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Users can view their own notification deliveries
CREATE POLICY users_view_own_deliveries ON notification_deliveries
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all deliveries
CREATE POLICY admins_view_all_deliveries ON notification_deliveries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );
