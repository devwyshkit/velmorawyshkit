/**
 * Badge Definitions and Types
 * Loyalty badge system for partner gamification
 */

export type BadgeType = 
  | 'new_star'
  | 'rising_seller'
  | 'top_performer'
  | 'quick_shipper'
  | 'trusted_partner';

export interface BadgeCriteria {
  min_orders?: number;
  min_rating?: number;
  min_on_time_rate?: number;
}

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  description: string;
  icon: string; // Emoji
  color: string; // Tailwind color class
  criteria: BadgeCriteria;
  benefits?: string[];
}

export interface PartnerBadge {
  id: string;
  partner_id: string;
  badge_type: BadgeType;
  earned_at: string;
  created_at: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: 'new_star',
    name: 'New Star',
    description: 'Complete your first 5 orders with a 4.5+ rating',
    icon: '🥉',
    color: 'amber',
    criteria: {
      min_orders: 5,
      min_rating: 4.5,
    },
    benefits: [
      'Visibility boost in search results',
      'Early access to new features',
    ],
  },
  {
    type: 'rising_seller',
    name: 'Rising Seller',
    description: 'Complete 50+ orders with a 4.7+ rating',
    icon: '🥈',
    color: 'gray',
    criteria: {
      min_orders: 50,
      min_rating: 4.7,
    },
    benefits: [
      'Featured in "Trending Sellers" section',
      'Priority support from Wyshkit team',
      'Lower commission rate (18% vs 20%)',
    ],
  },
  {
    type: 'top_performer',
    name: 'Top Performer',
    description: 'Complete 200+ orders with a 4.8+ rating',
    icon: '🥇',
    color: 'yellow',
    criteria: {
      min_orders: 200,
      min_rating: 4.8,
    },
    benefits: [
      'Homepage featured seller spot',
      'Dedicated account manager',
      'Even lower commission rate (15%)',
      'Early access to corporate deals',
    ],
  },
  {
    type: 'quick_shipper',
    name: 'Quick Shipper',
    description: '95%+ on-time delivery rate over 30+ orders',
    icon: '⚡',
    color: 'blue',
    criteria: {
      min_orders: 30,
      min_on_time_rate: 95,
    },
    benefits: [
      '"Fast Delivery" badge on all products',
      'Priority in same-day delivery orders',
      'Featured in "Quick Delivery" filter',
    ],
  },
  {
    type: 'trusted_partner',
    name: 'Trusted Partner',
    description: '1000+ orders with a 4.9+ rating and 98%+ on-time rate',
    icon: '💎',
    color: 'purple',
    criteria: {
      min_orders: 1000,
      min_rating: 4.9,
      min_on_time_rate: 98,
    },
    benefits: [
      'Exclusive "Wyshkit Verified" badge',
      'Featured on homepage and marketing',
      'VIP commission rate (12%)',
      'Invitation to exclusive partner events',
      'Priority for bulk corporate orders',
    ],
  },
];

/**
 * Check if a partner meets the criteria for a specific badge
 */
export const checkBadgeCriteria = (
  badge: BadgeDefinition,
  metrics: {
    total_orders: number;
    rating: number;
    on_time_delivery_rate: number;
  }
): boolean => {
  const { criteria } = badge;

  if (criteria.min_orders && metrics.total_orders < criteria.min_orders) {
    return false;
  }

  if (criteria.min_rating && metrics.rating < criteria.min_rating) {
    return false;
  }

  if (criteria.min_on_time_rate && metrics.on_time_delivery_rate < criteria.min_on_time_rate) {
    return false;
  }

  return true;
};

/**
 * Get all badges a partner is eligible for but hasn't earned yet
 */
export const getEligibleBadges = (
  metrics: {
    total_orders: number;
    rating: number;
    on_time_delivery_rate: number;
  },
  earnedBadges: BadgeType[]
): BadgeDefinition[] => {
  return BADGE_DEFINITIONS.filter(badge => {
    if (earnedBadges.includes(badge.type)) {
      return false; // Already earned
    }
    return checkBadgeCriteria(badge, metrics);
  });
};
