// Delivery Fee Calculation System
// Swiggy/Zomato-like dynamic delivery fees with order value thresholds

import { DeliveryFeeConfig, DeliveryFeeCalculation } from '@/types/tiered-pricing';

export interface DeliveryFeeConfig {
  id: string;
  name: string;
  isActive: boolean;
  freeDeliveryThresholdPaise: number;
  orderValueTiers: Array<{
    minValuePaise: number;
    maxValuePaise: number | null;
    feePaise: number;
  }>;
  distanceMultiplier: Array<{
    minDistance: number;
    maxDistance: number | null;
    multiplier: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create default delivery fee configuration
 */
export function createDefaultDeliveryFeeConfig(): DeliveryFeeConfig {
  return {
    id: 'default-delivery-fee',
    name: 'Default Delivery Fee Structure',
    isActive: true,
    freeDeliveryThresholdPaise: 500000, // ₹5000
    orderValueTiers: [
      { minValuePaise: 0, maxValuePaise: 99900, feePaise: 8000 }, // ₹0-999: ₹80
      { minValuePaise: 100000, maxValuePaise: 249900, feePaise: 5000 }, // ₹1000-2499: ₹50
      { minValuePaise: 250000, maxValuePaise: 499900, feePaise: 3000 }, // ₹2500-4999: ₹30
      { minValuePaise: 500000, maxValuePaise: null, feePaise: 0 } // ₹5000+: FREE
    ],
    distanceMultiplier: [
      { minDistance: 0, maxDistance: 5, multiplier: 1.0 }, // 0-5 km: No extra charge
      { minDistance: 5, maxDistance: 10, multiplier: 1.5 }, // 5-10 km: +50%
      { minDistance: 10, maxDistance: 20, multiplier: 2.0 }, // 10-20 km: +100%
      { minDistance: 20, maxDistance: null, multiplier: 3.0 } // 20+ km: +200%
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Calculate delivery fee based on order value and distance
 */
export function calculateDeliveryFee(
  orderValuePaise: number,
  distanceKm: number,
  config: DeliveryFeeConfig
): DeliveryFeeCalculation {
  // Find applicable order value tier
  let baseFee = 0;
  let applicableTier = config.orderValueTiers[0];
  
  for (const tier of config.orderValueTiers) {
    if (orderValuePaise >= tier.minValuePaise && 
        (tier.maxValuePaise === null || orderValuePaise <= tier.maxValuePaise)) {
      baseFee = tier.feePaise;
      applicableTier = tier;
      break;
    }
  }
  
  // Find distance multiplier
  let distanceMultiplier = 1.0;
  for (const multiplier of config.distanceMultiplier) {
    if (distanceKm >= multiplier.minDistance && 
        (multiplier.maxDistance === null || distanceKm <= multiplier.maxDistance)) {
      distanceMultiplier = multiplier.multiplier;
      break;
    }
  }
  
  // Calculate distance fee
  const distanceFee = Math.round(baseFee * (distanceMultiplier - 1.0));
  const totalFee = baseFee + distanceFee;
  
  // Check if free delivery applies
  const isFreeDelivery = orderValuePaise >= config.freeDeliveryThresholdPaise || totalFee === 0;
  const finalFee = isFreeDelivery ? 0 : totalFee;
  
  return {
    orderValue: orderValuePaise,
    distance: distanceKm,
    appliedConfig: config,
    baseFee,
    distanceFee,
    totalFee: finalFee,
    isFreeDelivery
  };
}

/**
 * Get delivery fee message for customer display (Swiggy-style)
 */
export function getDeliveryFeeMessage(
  orderValuePaise: number,
  distanceKm: number,
  config: DeliveryFeeConfig
): {
  message: string;
  type: 'free' | 'fee' | 'threshold';
  amount?: number;
} {
  const calculation = calculateDeliveryFee(orderValuePaise, distanceKm, config);
  
  if (calculation.isFreeDelivery) {
    return {
      message: 'FREE delivery! 🎉',
      type: 'free'
    };
  }
  
  if (orderValuePaise >= config.freeDeliveryThresholdPaise) {
    return {
      message: 'FREE delivery! 🎉',
      type: 'free'
    };
  }
  
  const amountNeeded = config.freeDeliveryThresholdPaise - orderValuePaise;
  const amountNeededRupees = Math.round(amountNeeded / 100);
  
  if (calculation.totalFee > 0) {
    // Swiggy-style messaging
    if (amountNeededRupees <= 200) {
      return {
        message: `Add ₹${amountNeededRupees} more for FREE delivery!`,
        type: 'threshold',
        amount: amountNeededRupees
      };
    } else {
      return {
        message: `Add ₹${amountNeededRupees} more to get FREE delivery!`,
        type: 'threshold',
        amount: amountNeededRupees
      };
    }
  }
  
  return {
    message: `Delivery fee: ₹${Math.round(calculation.totalFee / 100)}`,
    type: 'fee',
    amount: Math.round(calculation.totalFee / 100)
  };
}

/**
 * Get delivery time estimate based on quantity and distance
 */
export function getDeliveryTimeEstimate(
  quantity: number,
  distanceKm: number,
  isCustomizable: boolean
): {
  estimatedDays: number;
  message: string;
  isExpress: boolean;
} {
  let baseDays = 1;
  
  // Base delivery time by quantity
  if (quantity >= 50) {
    baseDays = isCustomizable ? 7 : 3; // Customization adds time
  } else if (quantity >= 10) {
    baseDays = isCustomizable ? 5 : 2;
  } else {
    baseDays = isCustomizable ? 3 : 1;
  }
  
  // Distance factor
  if (distanceKm > 20) {
    baseDays += 2;
  } else if (distanceKm > 10) {
    baseDays += 1;
  }
  
  // Express delivery option
  const isExpress = quantity < 10 && distanceKm < 10 && !isCustomizable;
  
  let message = '';
  if (isExpress) {
    message = 'Same day / Next day delivery';
  } else if (baseDays === 1) {
    message = 'Next day delivery';
  } else if (baseDays <= 3) {
    message = `${baseDays} days delivery`;
  } else {
    message = `${baseDays}-${baseDays + 1} days delivery`;
  }
  
  return {
    estimatedDays: baseDays,
    message,
    isExpress
  };
}

/**
 * Calculate express delivery surcharge
 */
export function calculateExpressDeliverySurcharge(
  baseDeliveryFee: number,
  isExpress: boolean
): number {
  if (!isExpress) return 0;
  
  // Express delivery adds ₹200
  return 20000; // ₹200 in paise
}

/**
 * Get delivery fee breakdown for display
 */
export function getDeliveryFeeBreakdown(
  orderValuePaise: number,
  distanceKm: number,
  config: DeliveryFeeConfig,
  isExpress: boolean = false
): Array<{
  item: string;
  amount: number;
  description?: string;
}> {
  const calculation = calculateDeliveryFee(orderValuePaise, distanceKm, config);
  const breakdown = [];
  
  if (calculation.baseFee > 0) {
    breakdown.push({
      item: 'Base delivery fee',
      amount: calculation.baseFee,
      description: `Order value: ₹${Math.round(orderValuePaise / 100)}`
    });
  }
  
  if (calculation.distanceFee > 0) {
    breakdown.push({
      item: 'Distance surcharge',
      amount: calculation.distanceFee,
      description: `${distanceKm} km distance`
    });
  }
  
  if (isExpress) {
    const expressSurcharge = calculateExpressDeliverySurcharge(calculation.totalFee, true);
    breakdown.push({
      item: 'Express delivery',
      amount: expressSurcharge,
      description: 'Same day / Next day delivery'
    });
  }
  
  if (calculation.isFreeDelivery) {
    breakdown.push({
      item: 'Free delivery discount',
      amount: -calculation.totalFee,
      description: `Order above ₹${Math.round(config.freeDeliveryThresholdPaise / 100)}`
    });
  }
  
  return breakdown;
}

/**
 * Validate delivery fee configuration
 */
export function validateDeliveryFeeConfig(config: DeliveryFeeConfig): string[] {
  const errors: string[] = [];
  
  if (config.orderValueTiers.length === 0) {
    errors.push('At least one order value tier is required');
    return errors;
  }
  
  // Check for gaps in order value ranges
  const sortedTiers = [...config.orderValueTiers].sort((a, b) => a.minValuePaise - b.minValuePaise);
  
  for (let i = 0; i < sortedTiers.length; i++) {
    const currentTier = sortedTiers[i];
    const nextTier = sortedTiers[i + 1];
    
    if (currentTier.minValuePaise < 0) {
      errors.push('Order value cannot be negative');
    }
    
    if (currentTier.maxValuePaise !== null && currentTier.maxValuePaise < currentTier.minValuePaise) {
      errors.push('Maximum order value cannot be less than minimum order value');
    }
    
    if (nextTier && currentTier.maxValuePaise !== null) {
      if (currentTier.maxValuePaise + 100 !== nextTier.minValuePaise) {
        errors.push('Gap in order value ranges between tiers');
      }
    }
  }
  
  // Check that the last tier doesn't have a max value (should be open-ended)
  const lastTier = sortedTiers[sortedTiers.length - 1];
  if (lastTier.maxValuePaise !== null) {
    errors.push('The highest tier should not have a maximum order value limit');
  }
  
  return errors;
}

/**
 * Get delivery fee savings message
 */
export function getDeliveryFeeSavingsMessage(
  currentOrderValuePaise: number,
  targetOrderValuePaise: number,
  currentDeliveryFee: number
): string {
  const amountNeeded = targetOrderValuePaise - currentOrderValuePaise;
  const amountNeededRupees = Math.round(amountNeeded / 100);
  const savingsRupees = Math.round(currentDeliveryFee / 100);
  
  return `Add ₹${amountNeededRupees} more to get FREE delivery! (Save ₹${savingsRupees})`;
}