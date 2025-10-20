/**
 * Loyalty Badges Definitions
 * Feature 6: PROMPT 6
 * Defines all partner achievement badges and their criteria
 * Follows Zomato Gold's trust signal pattern
 */

export interface Badge {
  type: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex color for styling
  criteria: {
    orders?: number;
    revenue?: number; // in paise
    rating?: number;
    onTimePercent?: number;
    bulkOrders?: number; // Orders with 50+ units
    customOrders?: number; // Orders with customization
  };
  benefits: string[];
}

/**
 * All badge definitions
 * Criteria checked daily by Supabase cron job
 */
export const badgeDefinitions: Badge[] = [
  {
    type: 'verified_seller',
    name: 'Verified Seller',
    description: 'All KYC complete, 30+ days active',
    icon: 'Shield',
    color: '#10B981', // Green
    criteria: {
      // No numeric criteria - checked manually during onboarding
    },
    benefits: ['Trust badge on listings', 'Platform verification']
  },
  {
    type: 'premium_partner',
    name: 'Premium Partner',
    description: '50+ orders, ₹5L+ revenue, 4.8+ rating',
    icon: 'Trophy',
    color: '#FFD700', // Gold
    criteria: {
      orders: 50,
      revenue: 50000000, // ₹5L in paise
      rating: 4.8
    },
    benefits: [
      '15% commission (vs 20% default)',
      'Priority support',
      'Featured placement in customer UI'
    ]
  },
  {
    type: 'five_star',
    name: '5-Star Partner',
    description: '100+ orders, 4.9+ rating',
    icon: 'Star',
    color: '#3B82F6', // Blue
    criteria: {
      orders: 100,
      rating: 4.9
    },
    benefits: [
      'Top Partners carousel in customer home',
      'Trust badge on all listings'
    ]
  },
  {
    type: 'fast_fulfillment',
    name: 'Fast Fulfillment',
    description: '95%+ on-time delivery (last 100 orders)',
    icon: 'Zap',
    color: '#F59E0B', // Amber
    criteria: {
      orders: 100,
      onTimePercent: 95
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
    color: '#8B5CF6', // Purple
    criteria: {
      bulkOrders: 20
    },
    benefits: [
      'B2B dashboard access',
      'Bulk pricing tools',
      'Corporate buyer visibility'
    ]
  },
  {
    type: 'customization_pro',
    name: 'Customization Pro',
    description: '50+ custom orders with branding',
    icon: 'Palette',
    color: '#EC4899', // Pink
    criteria: {
      customOrders: 50
    },
    benefits: [
      'Featured in "Custom Gifts" category',
      'Custom order boost in search',
      'Design consultation badge'
    ]
  },
  {
    type: 'top_seller',
    name: 'Top Seller',
    description: 'Top 10% revenue in category (monthly)',
    icon: 'Award',
    color: '#EF4444', // Red
    criteria: {
      // Calculated dynamically - top 10% in category
      revenue: 10000000 // ₹1L+ minimum to qualify
    },
    benefits: [
      'Featured in category homepage',
      'Marketing support',
      '"Top Seller" badge'
    ]
  }
];

/**
 * Get badge definition by type
 */
export const getBadgeDefinition = (type: string): Badge | undefined => {
  return badgeDefinitions.find(badge => badge.type === type);
};

/**
 * Get badge icon by type (for rendering)
 */
export const getBadgeIcon = (type: string): string => {
  const badge = getBadgeDefinition(type);
  return badge?.icon || 'Shield';
};

/**
 * Get badge color by type
 */
export const getBadgeColor = (type: string): string => {
  const badge = getBadgeDefinition(type);
  return badge?.color || '#10B981';
};

/**
 * Calculate progress towards a badge
 */
export const calculateBadgeProgress = (
  badge: Badge,
  partnerStats: {
    orders?: number;
    revenue?: number;
    rating?: number;
    onTimePercent?: number;
    bulkOrders?: number;
    customOrders?: number;
  }
): {
  percentage: number;
  missing: string[];
  canEarn: boolean;
} => {
  const missing: string[] = [];
  let totalCriteria = 0;
  let metCriteria = 0;

  // Check each criterion
  Object.entries(badge.criteria).forEach(([key, requiredValue]) => {
    totalCriteria++;
    const partnerValue = partnerStats[key as keyof typeof partnerStats] || 0;
    
    if (partnerValue >= requiredValue) {
      metCriteria++;
    } else {
      const diff = requiredValue - partnerValue;
      switch (key) {
        case 'orders':
          missing.push(`${diff} more orders`);
          break;
        case 'revenue':
          missing.push(`₹${(diff / 100 / 100000).toFixed(1)}L more revenue`);
          break;
        case 'rating':
          missing.push(`${diff.toFixed(1)} rating points`);
          break;
        case 'onTimePercent':
          missing.push(`${diff}% better on-time delivery`);
          break;
        case 'bulkOrders':
          missing.push(`${diff} more bulk orders`);
          break;
        case 'customOrders':
          missing.push(`${diff} more custom orders`);
          break;
      }
    }
  });

  return {
    percentage: totalCriteria > 0 ? Math.round((metCriteria / totalCriteria) * 100) : 0,
    missing,
    canEarn: metCriteria === totalCriteria
  };
};
