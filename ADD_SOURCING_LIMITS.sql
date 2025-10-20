-- Migration: Add Sourcing Limits to partner_products
-- Feature: PROMPT 11 - Sourcing Limits
-- Description: Adds columns for monthly sourcing caps and usage tracking

-- Add sourcing limit fields to partner_products table
ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS sourcing_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sourcing_limit_monthly INTEGER,
ADD COLUMN IF NOT EXISTS sourcing_limit_enabled BOOLEAN DEFAULT FALSE;

-- Create sourcing_usage table for tracking monthly usage
CREATE TABLE IF NOT EXISTS sourcing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES partner_products(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL, -- Reseller who sourced
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  units_sourced INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, partner_id, month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_products_sourcing 
ON partner_products(sourcing_available, sourcing_limit_enabled) 
WHERE sourcing_available = TRUE;

CREATE INDEX IF NOT EXISTS idx_sourcing_usage_product_month 
ON sourcing_usage(product_id, month);

CREATE INDEX IF NOT EXISTS idx_sourcing_usage_partner_month 
ON sourcing_usage(partner_id, month);

-- Add comments for documentation
COMMENT ON COLUMN partner_products.sourcing_available IS 'Whether product is available for resellers to source';
COMMENT ON COLUMN partner_products.sourcing_limit_monthly IS 'Maximum units that can be sourced per month (NULL = unlimited)';
COMMENT ON COLUMN partner_products.sourcing_limit_enabled IS 'Whether monthly sourcing limit is active';
COMMENT ON TABLE sourcing_usage IS 'Tracks monthly sourcing usage per product per reseller';

-- Note: Auto-disable sourcing when stock = 0 is handled in application logic
-- Note: Monthly reset cron job (sourcing-reset edge function) re-enables products on 1st of month

