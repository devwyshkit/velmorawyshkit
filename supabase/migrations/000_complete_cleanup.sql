-- ============================================================================
-- COMPLETE DATABASE CLEANUP
-- Removes ALL old tables, functions, triggers, and policies
-- Use this to start fresh with clean customer-only schema
-- ============================================================================

-- Drop all existing tables (if they exist from old implementations)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.sellers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.kam_users CASCADE;
DROP TABLE IF EXISTS public.business_profiles CASCADE;
DROP TABLE IF EXISTS public.seller_profiles CASCADE;
DROP TABLE IF EXISTS public.vendor_profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop old functions/triggers
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.partners_search_update() CASCADE;
DROP FUNCTION IF EXISTS public.items_search_update() CASCADE;

-- Clean up any orphaned data
VACUUM FULL;

-- ============================================================================
-- CLEANUP COMPLETE - Database is now empty and ready for fresh schema
-- ============================================================================

-- Next: Run 001_initial_schema.sql to create customer-only tables

