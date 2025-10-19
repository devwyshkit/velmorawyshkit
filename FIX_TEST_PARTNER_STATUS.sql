-- Fix Test Partner Store - Should be APPROVED not PENDING
-- Quick SQL to run in Supabase

UPDATE public.partner_profiles
SET 
  status = 'approved',
  approved_at = NOW()
WHERE business_name = 'Test Partner Store';

-- Verify
SELECT business_name, status, approved_at
FROM public.partner_profiles
WHERE business_name = 'Test Partner Store';

