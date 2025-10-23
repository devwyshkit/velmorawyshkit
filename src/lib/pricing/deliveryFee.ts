/**
 * Delivery Fee Calculator
 * Swiggy/Zomato pattern: "Add ₹X more for FREE delivery!"
 * Dynamic delivery fees based on order value and distance
 */

import { DeliveryFeeCalculation, DeliveryFeeConfig } from '@/types/product';
import { formatPrice } from './tieredPricing';

// Default delivery fee configuration
// Matches Swiggy/Zomato tiers
const DEFAULT_DELIVERY_TIERS: DeliveryFeeConfig[] = [
  {
    id: 'tier-1',
    rule_name: 'Tier 1: ₹0-999',
    order_value_min: 0,
    order_value_max: 99900, // ₹999 in paise
    fee_amount: 8000, // ₹80
    distance_min_km: 0,
    distance_max_km: undefined,
    distance_surcharge: 0,
    is_active: true,
    priority: 1,
  },
  {
    id: 'tier-2',
    rule_name: 'Tier 2: ₹1000-2499',
    order_value_min: 100000, // ₹1000
    order_value_max: 249900, // ₹2499
    fee_amount: 5000, // ₹50
    distance_min_km: 0,
    distance_max_km: undefined,
    distance_surcharge: 0,
    is_active: true,
    priority: 2,
  },
  {
    id: 'tier-3',
    rule_name: 'Tier 3: ₹2500-4999',
    order_value_min: 250000, // ₹2500
    order_value_max: 499900, // ₹4999
    fee_amount: 3000, // ₹30
    distance_min_km: 0,
    distance_max_km: undefined,
    distance_surcharge: 0,
    is_active: true,
    priority: 3,
  },
  {
    id: 'tier-4',
    rule_name: 'Tier 4: ₹5000+',
    order_value_min: 500000, // ₹5000
    order_value_max: undefined, // unlimited
    fee_amount: 0, // FREE
    distance_min_km: 0,
    distance_max_km: undefined,
    distance_surcharge: 0,
    is_active: true,
    priority: 4,
  },
];

// Free delivery threshold (₹5000 = 500000 paise)
const FREE_DELIVERY_THRESHOLD = 500000;

/**
 * Calculate delivery fee based on cart subtotal
 * Swiggy/Zomato style with progressive disclosure
 */
export function calculateDeliveryFee(
  cartSubtotal: number, // in paise
  deliveryConfig: DeliveryFeeConfig[] = DEFAULT_DELIVERY_TIERS,
  freeThreshold: number = FREE_DELIVERY_THRESHOLD,
  distanceKm: number = 0
): DeliveryFeeCalculation {
  // Check if cart qualifies for free delivery
  if (cartSubtotal >= freeThreshold) {
    return {
      fee: 0,
      isFree: true,
      amountNeededForFree: 0,
      message: 'FREE Delivery ✅',
    };
  }
  
  // Find applicable delivery fee tier
  const applicableTier = findApplicableDeliveryTier(cartSubtotal, deliveryConfig);
  
  if (!applicableTier) {
    // Fallback to default fee if no tier matches
    const amountNeeded = freeThreshold - cartSubtotal;
    return {
      fee: 5000, // ₹50 default
      isFree: false,
      amountNeededForFree: amountNeeded,
      message: `Add ${formatPrice(amountNeeded)} more for FREE delivery!`,
    };
  }
  
  // Calculate distance surcharge if applicable
  let distanceSurcharge = 0;
  if (
    distanceKm > 0 &&
    applicableTier.distance_min_km !== undefined &&
    applicableTier.distance_max_km !== undefined
  ) {
    if (distanceKm >= applicableTier.distance_min_km && distanceKm <= applicableTier.distance_max_km) {
      distanceSurcharge = applicableTier.distance_surcharge;
    }
  }
  
  const totalFee = applicableTier.fee_amount + distanceSurcharge;
  const amountNeeded = freeThreshold - cartSubtotal;
  
  // Create user-friendly message
  let message = '';
  if (amountNeeded > 0 && amountNeeded < freeThreshold) {
    message = `Add ${formatPrice(amountNeeded)} more for FREE delivery!`;
  } else if (totalFee === 0) {
    message = 'FREE Delivery ✅';
  } else {
    message = `Delivery: ${formatPrice(totalFee)}`;
  }
  
  return {
    fee: totalFee,
    isFree: totalFee === 0,
    amountNeededForFree: amountNeeded,
    message,
  };
}

/**
 * Find the applicable delivery fee tier for a given cart value
 */
function findApplicableDeliveryTier(
  cartValue: number,
  tiers: DeliveryFeeConfig[]
): DeliveryFeeConfig | null {
  // Filter active tiers
  const activeTiers = tiers.filter((tier) => tier.is_active);
  
  // Sort by priority (ascending)
  const sortedTiers = activeTiers.sort((a, b) => a.priority - b.priority);
  
  // Find first matching tier
  for (const tier of sortedTiers) {
    const isAboveMin = cartValue >= tier.order_value_min;
    const isBelowMax = tier.order_value_max === undefined || cartValue <= tier.order_value_max;
    
    if (isAboveMin && isBelowMax) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Get delivery fee breakdown for display
 * Shows all tiers and current status
 */
export function getDeliveryFeeBreakdown(
  cartSubtotal: number,
  deliveryConfig: DeliveryFeeConfig[] = DEFAULT_DELIVERY_TIERS,
  freeThreshold: number = FREE_DELIVERY_THRESHOLD
): {
  currentTier: DeliveryFeeConfig | null;
  currentFee: number;
  isFree: boolean;
  nextTier: DeliveryFeeConfig | null;
  amountToNextTier: number;
  allTiers: Array<{
    tier: DeliveryFeeConfig;
    isActive: boolean;
    isCurrent: boolean;
  }>;
} {
  const currentTier = findApplicableDeliveryTier(cartSubtotal, deliveryConfig);
  const currentFee = currentTier ? currentTier.fee_amount : 0;
  const isFree = cartSubtotal >= freeThreshold;
  
  // Find next cheaper tier
  const activeTiers = deliveryConfig.filter((t) => t.is_active).sort((a, b) => a.priority - b.priority);
  const currentIndex = currentTier ? activeTiers.findIndex((t) => t.id === currentTier.id) : -1;
  const nextTier = currentIndex >= 0 && currentIndex < activeTiers.length - 1 
    ? activeTiers[currentIndex + 1] 
    : null;
  
  const amountToNextTier = nextTier 
    ? nextTier.order_value_min - cartSubtotal 
    : freeThreshold - cartSubtotal;
  
  const allTiers = activeTiers.map((tier) => ({
    tier,
    isActive: cartSubtotal >= tier.order_value_min,
    isCurrent: tier.id === currentTier?.id,
  }));
  
  return {
    currentTier,
    currentFee,
    isFree,
    nextTier,
    amountToNextTier: Math.max(0, amountToNextTier),
    allTiers,
  };
}

/**
 * Calculate distance-based surcharge
 * Optional feature for very long distance deliveries
 */
export function calculateDistanceSurcharge(
  distanceKm: number
): number {
  // Distance tiers (optional, can be configured by admin)
  if (distanceKm <= 5) {
    return 0; // No surcharge for nearby deliveries
  } else if (distanceKm <= 10) {
    return 3000; // ₹30 for 5-10km
  } else if (distanceKm <= 20) {
    return 7000; // ₹70 for 10-20km
  } else {
    return 15000; // ₹150 for 20km+
  }
}

/**
 * Create Swiggy-style delivery fee banner message
 * Progressive disclosure: encourages users to add more to cart
 */
export function createDeliveryBannerMessage(
  cartSubtotal: number,
  deliveryCalculation: DeliveryFeeCalculation
): {
  type: 'info' | 'success' | 'warning';
  message: string;
  icon: '🚚' | '✅' | '🎁';
} {
  if (deliveryCalculation.isFree) {
    return {
      type: 'success',
      message: 'Yay! You get FREE delivery on this order 🎉',
      icon: '✅',
    };
  }
  
  if (deliveryCalculation.amountNeededForFree > 0 && deliveryCalculation.amountNeededForFree < 100000) {
    // Close to free delivery (< ₹1000 away)
    return {
      type: 'info',
      message: `Add ${formatPrice(deliveryCalculation.amountNeededForFree)} more to get FREE delivery!`,
      icon: '🚚',
    };
  }
  
  return {
    type: 'info',
    message: `Delivery fee: ${formatPrice(deliveryCalculation.fee)}`,
    icon: '🚚',
  };
}

/**
 * Validate delivery fee configuration
 */
export function validateDeliveryConfig(config: DeliveryFeeConfig[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!config || config.length === 0) {
    errors.push('At least one delivery fee tier is required');
    return { isValid: false, errors };
  }
  
  // Check for overlaps and gaps
  const sortedConfig = [...config].sort((a, b) => a.order_value_min - b.order_value_min);
  
  for (let i = 0; i < sortedConfig.length - 1; i++) {
    const current = sortedConfig[i];
    const next = sortedConfig[i + 1];
    
    if (current.fee_amount < 0) {
      errors.push(`Tier "${current.rule_name}": Fee cannot be negative`);
    }
    
    if (current.order_value_max !== undefined && current.order_value_max < current.order_value_min) {
      errors.push(`Tier "${current.rule_name}": Max value must be greater than min value`);
    }
    
    // Check for gaps
    if (current.order_value_max !== undefined && next.order_value_min > current.order_value_max + 1) {
      errors.push(`Gap between "${current.rule_name}" and "${next.rule_name}"`);
    }
    
    // Check for overlaps
    if (current.order_value_max !== undefined && next.order_value_min <= current.order_value_max) {
      errors.push(`Overlap between "${current.rule_name}" and "${next.rule_name}"`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

