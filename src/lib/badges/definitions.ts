/**
 * Badge Definitions
 * Feature 7: PROMPT 6
 * Vendor-earned achievement badges
 */

import type { Badge } from '@/types/badges';

export const BADGE_DEFINITIONS: Badge[] = [
  {
    type: 'premium_partner',
    name: 'Premium Partner',
    description: '50+ orders, ₹5L+ revenue, 4.8+ rating',
    icon: 'Trophy',
    color: '#FFD700',
    criteria: {
      orders: 50,
      revenue: 50000000, // ₹5L in paise
      rating: 4.8,
    },
    benefits: [
      '15% commission (vs 20% default)',
      'Priority support',
      'Featured placement'
    ]
  },
  {
    type: 'five_star',
    name: '5-Star Partner',
    description: '100+ orders, 4.9+ rating',
    icon: 'Star',
    color: '#3B82F6',
    criteria: {
      orders: 100,
      rating: 4.9,
    },
    benefits: [
      'Top Partners carousel',
      'Trust badge on listings'
    ]
  },
  {
    type: 'fast_fulfillment',
    name: 'Fast Fulfillment',
    description: '95%+ on-time delivery (last 100 orders)',
    icon: 'Zap',
    color: '#10B981',
    criteria: {
      onTimePercent: 95,
      orders: 100,
    },
    benefits: [
      '"Lightning Fast" badge on products',
      'Priority in search results'
    ]
  },
  {
    type: 'corporate_expert',
    name: 'Corporate Expert',
    description: '20+ bulk orders (50+ units each)',
    icon: 'Briefcase',
    color: '#8B5CF6',
    criteria: {
      bulkOrders: 20,
    },
    benefits: [
      'B2B dashboard access',
      'Bulk pricing tools',
      'Corporate client leads'
    ]
  },
  {
    type: 'customization_pro',
    name: 'Customization Pro',
    description: '50+ custom orders with branding',
    icon: 'Palette',
    color: '#F59E0B',
    criteria: {
      customOrders: 50,
    },
    benefits: [
      'Featured in "Custom Gifts" category',
      'Custom design tools'
    ]
  },
  {
    type: 'top_seller',
    name: 'Top Seller',
    description: 'Top 10% revenue in category (monthly)',
    icon: 'Award',
    color: '#EF4444',
    criteria: {
      // Calculated dynamically based on category
    },
    benefits: [
      'Featured in category',
      'Special promotions'
    ]
  },
  {
    type: 'verified_seller',
    name: 'Verified Seller',
    description: 'All KYC complete, 30+ days active',
    icon: 'CheckCircle',
    color: '#06B6D4',
    criteria: {
      activeDays: 30,
    },
    benefits: [
      'Trust badge',
      'Higher search ranking'
    ]
  },
];

/**
 * Get badge by type
 */
export const getBadgeDefinition = (type: string): Badge | undefined => {
  return BADGE_DEFINITIONS.find(b => b.type === type);
};

/**
 * Check if criteria is met
 */
export const checkBadgeCriteria = (
  badge: Badge,
  partnerMetrics: Record<string, number>
): boolean => {
  const criteria = badge.criteria;
  
  return (
    (!criteria.orders || partnerMetrics.orders >= criteria.orders) &&
    (!criteria.revenue || partnerMetrics.revenue >= criteria.revenue) &&
    (!criteria.rating || partnerMetrics.rating >= criteria.rating) &&
    (!criteria.onTimePercent || partnerMetrics.onTimePercent >= criteria.onTimePercent) &&
    (!criteria.bulkOrders || partnerMetrics.bulkOrders >= criteria.bulkOrders) &&
    (!criteria.customOrders || partnerMetrics.customOrders >= criteria.customOrders) &&
    (!criteria.activeDays || partnerMetrics.activeDays >= criteria.activeDays)
  );
};

