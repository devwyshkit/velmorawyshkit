-- Migration: Add Sponsored Listing Fields to partner_products
-- Feature: PROMPT 5 - Sponsored Listings
-- Description: Adds columns for sponsored product placement with duration tracking

-- Add sponsored fields to partner_products table
ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sponsored_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sponsored_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sponsored_fee_percent DECIMAL(5,4) DEFAULT 0.05;

-- Create index for sponsored products (for faster queries in customer UI)
CREATE INDEX IF NOT EXISTS idx_partner_products_sponsored 
ON partner_products(sponsored, sponsored_start_date, sponsored_end_date) 
WHERE sponsored = TRUE;

-- Create sponsored_analytics table for tracking performance
CREATE TABLE IF NOT EXISTS sponsored_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES partner_products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0, -- in paise
  fee_charged INTEGER DEFAULT 0, -- in paise
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
  roi DECIMAL(5,2) DEFAULT 0, -- Return on investment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_sponsored_analytics_product_date 
ON sponsored_analytics(product_id, date DESC);

-- Add comment for documentation
COMMENT ON COLUMN partner_products.sponsored IS 'Whether product is currently sponsored';
COMMENT ON COLUMN partner_products.sponsored_start_date IS 'Start date of sponsorship period';
COMMENT ON COLUMN partner_products.sponsored_end_date IS 'End date of sponsorship period';
COMMENT ON COLUMN partner_products.sponsored_fee_percent IS 'Fee percentage charged per sale (default 5%)';
COMMENT ON TABLE sponsored_analytics IS 'Tracks daily performance metrics for sponsored products';

-- Sample data for testing (optional - remove for production)
-- Update a test product to be sponsored
-- UPDATE partner_products 
-- SET sponsored = TRUE,
--     sponsored_start_date = NOW(),
--     sponsored_end_date = NOW() + INTERVAL '7 days'
-- WHERE id = (SELECT id FROM partner_products LIMIT 1);

