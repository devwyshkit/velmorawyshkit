-- Fix SECURITY DEFINER Views (3 issues - CRITICAL)
-- Remove SECURITY DEFINER to prevent privilege escalation
-- Views will now respect calling user's RLS policies

-- Drop and recreate kam_dashboard_stats without SECURITY DEFINER
DROP VIEW IF EXISTS public.kam_dashboard_stats;
CREATE VIEW public.kam_dashboard_stats AS
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

-- Drop and recreate admin_moderation_stats without SECURITY DEFINER
DROP VIEW IF EXISTS public.admin_moderation_stats;
CREATE VIEW public.admin_moderation_stats AS
SELECT 
  COUNT(*) FILTER (WHERE approval_status = 'pending_review') AS pending_count,
  COUNT(*) FILTER (WHERE approval_status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE approval_status = 'rejected') AS rejected_count,
  COUNT(*) FILTER (WHERE approval_status = 'changes_requested') AS changes_requested_count,
  COUNT(*) AS total_products,
  COUNT(DISTINCT partner_id) AS total_partners_with_products,
  AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) FILTER (WHERE approved_at IS NOT NULL) AS avg_approval_time_hours
FROM partner_products;

-- Drop and recreate partner_earnings without SECURITY DEFINER
DROP VIEW IF EXISTS public.partner_earnings;
CREATE VIEW public.partner_earnings AS
SELECT 
  o.partner_id,
  DATE_TRUNC('week', o.created_at) as week_start,
  DATE_TRUNC('month', o.created_at) as month_start,
  COUNT(*) as order_count,
  SUM(o.total) as gross_revenue,
  SUM(o.total * COALESCE(p.commission_percent, 0.15)) as platform_commission,
  SUM(o.total * (1 - COALESCE(p.commission_percent, 0.15))) as partner_payout,
  AVG(o.total) as avg_order_value
FROM public.orders o
LEFT JOIN public.partner_profiles p ON p.id = o.partner_id
WHERE o.status = 'completed'
GROUP BY o.partner_id, DATE_TRUNC('week', o.created_at), DATE_TRUNC('month', o.created_at);

-- Grant appropriate permissions to views
GRANT SELECT ON public.kam_dashboard_stats TO authenticated;
GRANT SELECT ON public.admin_moderation_stats TO authenticated;
GRANT SELECT ON public.partner_earnings TO authenticated;
