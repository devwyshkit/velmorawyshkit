/**
 * Campaign Management Types
 * Promotional campaigns with featured placement (Zomato pattern: 15-20% engagement boost)
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

