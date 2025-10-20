/**
 * Loyalty Badges Types
 * Feature 7: PROMPT 6
 */

export type BadgeType = 
  | 'premium_partner'
  | 'five_star'
  | 'fast_fulfillment'
  | 'corporate_expert'
  | 'customization_pro'
  | 'top_seller'
  | 'verified_seller';

export interface BadgeCriteria {
  orders?: number;
  revenue?: number;
  rating?: number;
  onTimePercent?: number;
  bulkOrders?: number;
  customOrders?: number;
  activeDays?: number;
}

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex color
  criteria: BadgeCriteria;
  benefits: string[];
}

export interface PartnerBadge {
  id: string;
  partner_id: string;
  badge_type: BadgeType;
  earned_at: string;
  criteria_met: Record<string, number>; // Snapshot of metrics when earned
}

export interface BadgeProgress {
  badge: Badge;
  earned: boolean;
  progress: number; // 0-100
  current_values: Record<string, number>;
  missing_requirements: string[];
  estimated_days_to_earn?: number;
}

