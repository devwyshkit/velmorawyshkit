/**
 * Campaign Management Types
 * Feature 5: PROMPT 4
 */

export type CampaignType = 'discount' | 'free_addon' | 'bundle';

export type DiscountType = 'percentage' | 'flat';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'ended';

export interface Campaign {
  id: string;
  partner_id: string;
  name: string;
  type: CampaignType;
  discount_type?: DiscountType;
  discount_value?: number;
  products: string[]; // Product IDs
  start_date: string;
  end_date: string;
  featured: boolean;
  banner_url?: string;
  terms?: string;
  status: CampaignStatus;
  impressions: number;
  orders: number;
  revenue: number;
  created_at: string;
}

export interface CampaignAnalytics {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  ctr: number; // Click-through rate
}

export interface CampaignFormData {
  name: string;
  type: CampaignType;
  discount_type?: DiscountType;
  discount_value?: number;
  products: string[];
  start_date: Date;
  end_date: Date;
  featured: boolean;
  banner_url?: string;
  terms?: string;
}

export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
  roi: number;
  uplift_percent: number;
}

