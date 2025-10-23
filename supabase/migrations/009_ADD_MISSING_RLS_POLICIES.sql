-- Add Missing RLS Policies (2 issues - INFO)
-- Create policies for tables that have RLS enabled but no policies
-- This enables proper access control for partner_hampers and partner_orders

-- ============================================================================
-- PARTNER_HAMPERS POLICIES
-- ============================================================================

-- Partners can view their own hampers
CREATE POLICY "Partners can view own hampers" ON public.partner_hampers
  FOR SELECT USING (partner_id = (select auth.uid()));

-- Partners can insert their own hampers
CREATE POLICY "Partners can insert own hampers" ON public.partner_hampers
  FOR INSERT WITH CHECK (partner_id = (select auth.uid()));

-- Partners can update their own hampers
CREATE POLICY "Partners can update own hampers" ON public.partner_hampers
  FOR UPDATE USING (partner_id = (select auth.uid()));

-- Partners can delete their own hampers
CREATE POLICY "Partners can delete own hampers" ON public.partner_hampers
  FOR DELETE USING (partner_id = (select auth.uid()));

-- Admins can view all hampers
CREATE POLICY "Admins can view all hampers" ON public.partner_hampers
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Admins can manage all hampers
CREATE POLICY "Admins can manage all hampers" ON public.partner_hampers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- PARTNER_ORDERS POLICIES
-- ============================================================================

-- Partners can view their own orders
CREATE POLICY "Partners can view own orders" ON public.partner_orders
  FOR SELECT USING (partner_id = (select auth.uid()));

-- Partners can insert their own orders
CREATE POLICY "Partners can insert own orders" ON public.partner_orders
  FOR INSERT WITH CHECK (partner_id = (select auth.uid()));

-- Partners can update their own orders
CREATE POLICY "Partners can update own orders" ON public.partner_orders
  FOR UPDATE USING (partner_id = (select auth.uid()));

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" ON public.partner_orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders" ON public.partner_orders
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- KAMs can view orders for their assigned partners
CREATE POLICY "KAMs can view assigned partner orders" ON public.partner_orders
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM kam_partner_assignments kpa
    JOIN profiles p ON p.id = (select auth.uid())
    WHERE kpa.partner_id = partner_orders.partner_id
    AND kpa.kam_id = (select auth.uid())
    AND kpa.is_active = true
    AND p.role = 'kam'
  ));

-- ============================================================================
-- VERIFY RLS IS ENABLED
-- ============================================================================

-- Ensure RLS is enabled on both tables (should already be done in previous migration)
-- This is a safety check
DO $$
BEGIN
  -- Check if RLS is enabled, if not, enable it
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'partner_hampers' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE public.partner_hampers ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'partner_orders' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE public.partner_orders ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- GRANT APPROPRIATE PERMISSIONS
-- ============================================================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_hampers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_orders TO authenticated;

-- ============================================================================
-- TESTING NOTES
-- ============================================================================

-- CRITICAL TESTING CHECKLIST:
-- 1. Verify partners can only see their own hampers/orders
-- 2. Verify partners can create hampers/orders for themselves only
-- 3. Verify partners cannot see other partners' data
-- 4. Verify admins can see all hampers/orders
-- 5. Verify KAMs can see orders for their assigned partners only
-- 6. Test all CRUD operations with different roles
-- 7. Verify no access control regressions

-- ROLE-BASED ACCESS SUMMARY:
-- - Partners: Full access to own hampers/orders only
-- - Admins: Full access to all hampers/orders
-- - KAMs: Read access to assigned partners' orders only
-- - Customers: No direct access (access through partner APIs)
