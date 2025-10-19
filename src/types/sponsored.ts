/**
 * Sponsored Listings Types
 * Pay-per-sale visibility boost (Swiggy/Zomato ad platform: 5-10% revenue, 20-30% visibility)
 */

export type SponsoredStatus = 'active' | 'paused' | 'ended';

export interface SponsoredProduct {
  id: string;
  product_id: string;
  partner_id: string;
  sponsored: boolean;
  sponsored_start_date: string;
  sponsored_end_date: string;
  sponsored_fee_percent: number; // 0.05 = 5%
  status: SponsoredStatus;
}

export interface SponsoredAnalytics {
  id: string;
  product_id: string;
  date: string;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  fee_charged: number;
  ctr: number; // Click-through rate
  roi: number; // Return on investment
}

export interface SponsoredConfig {
  enabled: boolean;
  start_date: Date;
  end_date: Date;
  estimated_daily_cost: number;
}

