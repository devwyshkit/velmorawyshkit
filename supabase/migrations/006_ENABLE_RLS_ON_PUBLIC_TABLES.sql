-- Enable RLS on Public Tables (16 issues - CRITICAL)
-- Enable RLS and create appropriate policies for all public tables

-- Enable RLS on all public tables
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sourcing_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_discount_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kam_partner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kam_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kam_monthly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_hampers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ-ONLY TABLES
-- ============================================================================

-- Banners - anyone can view
CREATE POLICY "Anyone can view banners" ON public.banners
  FOR SELECT USING (true);

-- Occasions - anyone can view
CREATE POLICY "Anyone can view occasions" ON public.occasions
  FOR SELECT USING (true);

-- Category commission rates - anyone can view, admins can manage
CREATE POLICY "Anyone can view commission rates" ON public.category_commission_rates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage commission rates" ON public.category_commission_rates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Badge discount rates - anyone can view, admins can manage
CREATE POLICY "Anyone can view badge rates" ON public.badge_discount_rates
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage badge rates" ON public.badge_discount_rates
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- ADMIN-ONLY TABLES
-- ============================================================================

-- Admin users - only admins can manage
CREATE POLICY "Admins can manage admin_users" ON public.admin_users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Admin sessions - only admins can view
CREATE POLICY "Admins can view admin_sessions" ON public.admin_sessions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Admin actions - only admins can view
CREATE POLICY "Admins can view admin_actions" ON public.admin_actions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Admin audit logs - only admins can view
CREATE POLICY "Admins can view admin_audit_logs" ON public.admin_audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- PARTNER-SPECIFIC TABLES
-- ============================================================================

-- Partner sourcing vendors - partners can view own, admins can view all
CREATE POLICY "Partners can view own sourcing vendors" ON public.partner_sourcing_vendors
  FOR SELECT USING (
    partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Partners can manage own sourcing vendors" ON public.partner_sourcing_vendors
  FOR ALL USING (partner_id = (select auth.uid()));

-- Partner approvals - partners can view own, admins can manage all
CREATE POLICY "Partners can view own approvals" ON public.partner_approvals
  FOR SELECT USING (
    partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all approvals" ON public.partner_approvals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Partner hampers - partners can manage own
CREATE POLICY "Partners can view own hampers" ON public.partner_hampers
  FOR SELECT USING (partner_id = (select auth.uid()));

CREATE POLICY "Partners can manage own hampers" ON public.partner_hampers
  FOR ALL USING (partner_id = (select auth.uid()));

-- Partner orders - partners can view own, admins can view all
CREATE POLICY "Partners can view own orders" ON public.partner_orders
  FOR SELECT USING (partner_id = (select auth.uid()));

CREATE POLICY "Admins can view all orders" ON public.partner_orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- PAYOUT TABLES
-- ============================================================================

-- Payouts - partners can view own, admins can manage all
CREATE POLICY "Partners can view own payouts" ON public.payouts
  FOR SELECT USING (
    partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all payouts" ON public.payouts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Payout transactions - partners can view own, admins can manage all
CREATE POLICY "Partners can view own payout transactions" ON public.payout_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM payouts p 
      WHERE p.id = payout_transactions.payout_id 
      AND (p.partner_id = (select auth.uid()) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
      ))
    )
  );

CREATE POLICY "Admins can manage all payout transactions" ON public.payout_transactions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- KAM TABLES
-- ============================================================================

-- KAM partner assignments - KAMs and admins can view
CREATE POLICY "KAMs can view own assignments" ON public.kam_partner_assignments
  FOR SELECT USING (
    kam_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'kam')
    )
  );

CREATE POLICY "Admins can manage KAM assignments" ON public.kam_partner_assignments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- KAM activities - KAMs can view own, admins can view all
CREATE POLICY "KAMs can view own activities" ON public.kam_activities
  FOR SELECT USING (
    kam_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'kam')
    )
  );

CREATE POLICY "KAMs can manage own activities" ON public.kam_activities
  FOR ALL USING (kam_id = (select auth.uid()));

-- KAM monthly performance - KAMs can view own, admins can view all
CREATE POLICY "KAMs can view own performance" ON public.kam_monthly_performance
  FOR SELECT USING (
    kam_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'kam')
    )
  );

CREATE POLICY "Admins can manage KAM performance" ON public.kam_monthly_performance
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));
