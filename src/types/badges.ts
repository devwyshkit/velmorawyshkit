/**
 * Loyalty Badges Types
 * Partner achievement system (Zomato Gold: 10-15% conversion, 30% retention)
 */

export interface BadgeCriteria {
  orders?: number;
  revenue?: number;
  rating?: number;
  onTimePercent?: number;
  bulkOrders?: number;
  customOrders?: number;
}

export interface Badge {
  type: string;
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
  badge_type: string;
  earned_at: string;
  criteria_met: Record<string, number>;
}

// Badge Definitions (7 types from PROMPT 6)
export const badgeDefinitions: Badge[] = [
  {
    type: 'premium_partner',
    name: 'Premium Partner',
    description: '50+ orders, ₹5L+ revenue, 4.8+ rating',
    icon: 'Trophy',
    color: '#FFD700',
    criteria: { orders: 50, revenue: 500000, rating: 4.8 },
    benefits: ['15% commission', 'Priority support', 'Featured placement']
  },
  {
    type: 'five_star',
    name: '5-Star Partner',
    description: '100+ orders, 4.9+ rating',
    icon: 'Star',
    color: '#3B82F6',
    criteria: { orders: 100, rating: 4.9 },
    benefits: ['Top Partners carousel', 'Trust badge on listings']
  },
  {
    type: 'fast_fulfillment',
    name: 'Fast Fulfillment',
    description: '95%+ on-time delivery',
    icon: 'Zap',
    color: '#10B981',
    criteria: { onTimePercent: 95 },
    benefits: ['Lightning Fast badge on listings']
  },
  {
    type: 'corporate_expert',
    name: 'Corporate Expert',
    description: '20+ bulk orders (50+ units each)',
    icon: 'Briefcase',
    color: '#8B5CF6',
    criteria: { bulkOrders: 20 },
    benefits: ['B2B dashboard access', 'Bulk pricing tools']
  },
  {
    type: 'customization_pro',
    name: 'Customization Pro',
    description: '50+ custom orders with branding',
    icon: 'Palette',
    color: '#F59E0B',
    criteria: { customOrders: 50 },
    benefits: ['Featured in Custom Gifts category']
  },
  {
    type: 'verified_seller',
    name: 'Verified Seller',
    description: 'All KYC complete, 30+ days active',
    icon: 'CheckCircle',
    color: '#06B6D4',
    criteria: {},  // Special criteria (KYC + time)
    benefits: ['Trust badge']
  }
];

