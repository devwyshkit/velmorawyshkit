/**
 * Product Types for Partner Portal
 * Includes bulk pricing, add-ons, and all product metadata
 */

export interface BulkTier {
  minQty: number;
  maxQty?: number;  // Optional, calculated from next tier
  price: number;     // Price per unit (in paise)
  discountPercent: number;  // Auto-calculated vs. base price
}

export interface AddOn {
  id: string;
  name: string;
  price: number;      // in paise
  moq: number;        // Minimum order quantity
  requiresProof: boolean;
  description?: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
  order: number;
}

export interface Product {
  id: string;
  partner_id: string;
  name: string;
  description: string;
  short_desc?: string;
  price: number;      // Retail price in paise
  stock: number;
  stock_alert_threshold?: number;
  images?: string[];
  is_customizable: boolean;
  add_ons?: AddOn[];
  bulk_pricing?: BulkTier[];  // Tier pricing for bulk orders
  category?: string;
  tags?: string[];
  badge?: string;
  estimated_delivery_days?: string;
  is_active: boolean;
  sponsored?: boolean;
  created_at: string;
  updated_at?: string;
}

