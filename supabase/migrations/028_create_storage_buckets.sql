-- =====================================================
-- SUPABASE STORAGE BUCKETS
-- Create storage buckets with RLS policies
-- =====================================================

-- Note: Storage buckets are created via Supabase API, not SQL
-- This migration documents the bucket structure

-- Bucket: design-files
-- Purpose: Store customer-uploaded design files for custom orders
-- Access: Customers can upload, vendors can read

-- Bucket: product-images
-- Purpose: Store product images
-- Access: Vendors can upload, public read

-- Bucket: vendor-documents
-- Purpose: Store vendor KYC documents
-- Access: Vendors can upload, admins can read

-- Bucket: previews
-- Purpose: Store vendor-created design previews
-- Access: Vendors can upload, customers can read

-- Note: RLS policies for storage buckets are set via Supabase Dashboard
-- or using Storage API

COMMENT ON SCHEMA storage IS 'Supabase Storage buckets for file uploads';

