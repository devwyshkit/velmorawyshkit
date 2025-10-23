/**
 * Delivery Fee Calculator - Swiggy/Zomato Style
 * Dynamic delivery fees with FREE delivery thresholds
 */

export interface DeliveryFeeConfig {
  orderValueTiers: {
    minValue: number;
    maxValue: number | null;
    feeAmount: number;
  }[];
  distanceTiers?: {
    minKm: number;
    maxKm: number | null;
    surcharge: number;
  }[];
  freeDeliveryThreshold: number;
  baseFee: number;
}

export interface DeliveryFeeResult {
  fee: number;
  isFree: boolean;
  amountNeededForFree: number;
  message: string;
  breakdown: {
    baseFee: number;
    distanceSurcharge: number;
    totalFee: number;
  };
}

/**
 * Calculate delivery fee based on order value and distance
 * Follows Swiggy pattern: progressive disclosure, FREE delivery messaging
 */
export function calculateDeliveryFee(
  cartSubtotal: number,
  distanceKm: number = 0,
  config: DeliveryFeeConfig
): DeliveryFeeResult {
  let baseFee = config.baseFee;
  let distanceSurcharge = 0;

  // Check if order qualifies for free delivery
  if (cartSubtotal >= config.freeDeliveryThreshold) {
    return {
      fee: 0,
      isFree: true,
      amountNeededForFree: 0,
      message: 'FREE delivery!',
      breakdown: {
        baseFee: 0,
        distanceSurcharge: 0,
        totalFee: 0
      }
    };
  }

  // Find applicable order value tier
  const applicableTier = config.orderValueTiers.find(tier => {
    const meetsMin = cartSubtotal >= tier.minValue;
    const meetsMax = tier.maxValue === null || cartSubtotal <= tier.maxValue;
    return meetsMin && meetsMax;
  });

  if (applicableTier) {
    baseFee = applicableTier.feeAmount;
  }

  // Apply distance surcharge if applicable
  if (config.distanceTiers && distanceKm > 0) {
    const applicableDistanceTier = config.distanceTiers.find(tier => {
      const meetsMin = distanceKm >= tier.minKm;
      const meetsMax = tier.maxKm === null || distanceKm <= tier.maxKm;
      return meetsMin && meetsMax;
    });

    if (applicableDistanceTier) {
      distanceSurcharge = applicableDistanceTier.surcharge;
    }
  }

  const totalFee = baseFee + distanceSurcharge;
  const amountNeededForFree = config.freeDeliveryThreshold - cartSubtotal;

  // Generate appropriate message
  let message = '';
  if (totalFee === 0) {
    message = 'FREE delivery!';
  } else if (amountNeededForFree > 0) {
    message = `Add ₹${Math.ceil(amountNeededForFree)} more to get FREE delivery!`;
  } else {
    message = `Delivery fee: ₹${totalFee}`;
  }

  return {
    fee: totalFee,
    isFree: totalFee === 0,
    amountNeededForFree: Math.max(0, amountNeededForFree),
    message,
    breakdown: {
      baseFee,
      distanceSurcharge,
      totalFee
    }
  };
}

/**
 * Create default delivery fee configuration
 * Based on Swiggy/Zomato patterns
 */
export function createDefaultDeliveryFeeConfig(): DeliveryFeeConfig {
  return {
    orderValueTiers: [
      {
        minValue: 0,
        maxValue: 999,
        feeAmount: 80
      },
      {
        minValue: 1000,
        maxValue: 2499,
        feeAmount: 50
      },
      {
        minValue: 2500,
        maxValue: 4999,
        feeAmount: 30
      },
      {
        minValue: 5000,
        maxValue: null,
        feeAmount: 0
      }
    ],
    distanceTiers: [
      {
        minKm: 0,
        maxKm: 5,
        surcharge: 0
      },
      {
        minKm: 5,
        maxKm: 10,
        surcharge: 30
      },
      {
        minKm: 10,
        maxKm: 20,
        surcharge: 70
      },
      {
        minKm: 20,
        maxKm: null,
        surcharge: 100
      }
    ],
    freeDeliveryThreshold: 5000,
    baseFee: 80
  };
}

/**
 * Format delivery fee for display
 */
export function formatDeliveryFee(fee: number): string {
  if (fee === 0) {
    return 'FREE';
  }
  return `₹${fee}`;
}

/**
 * Get delivery fee message for cart/checkout
 */
export function getDeliveryFeeMessage(result: DeliveryFeeResult): string {
  if (result.isFree) {
    return '🎉 FREE delivery!';
  }
  
  if (result.amountNeededForFree > 0) {
    return `Add ₹${Math.ceil(result.amountNeededForFree)} more for FREE delivery!`;
  }
  
  return `Delivery fee: ${formatDeliveryFee(result.fee)}`;
}

/**
 * Calculate delivery fee for multiple items
 */
export function calculateBulkDeliveryFee(
  items: Array<{ subtotal: number; weight?: number }>,
  distanceKm: number = 0,
  config: DeliveryFeeConfig
): DeliveryFeeResult {
  const totalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  // For bulk orders, apply additional logic if needed
  // This could include weight-based fees, special bulk rates, etc.
  
  return calculateDeliveryFee(totalSubtotal, distanceKm, config);
}

/**
 * Validate delivery fee configuration
 */
export function validateDeliveryFeeConfig(config: DeliveryFeeConfig): string[] {
  const errors: string[] = [];

  if (!config.orderValueTiers || config.orderValueTiers.length === 0) {
    errors.push('Order value tiers are required');
    return errors;
  }

  // Check for gaps and overlaps in order value tiers
  const sortedTiers = [...config.orderValueTiers].sort((a, b) => a.minValue - b.minValue);
  
  for (let i = 0; i < sortedTiers.length; i++) {
    const current = sortedTiers[i];
    const next = sortedTiers[i + 1];

    if (current.minValue < 0) {
      errors.push(`Order value tier ${i + 1}: Minimum value cannot be negative`);
    }

    if (current.maxValue !== null && current.maxValue < current.minValue) {
      errors.push(`Order value tier ${i + 1}: Maximum value cannot be less than minimum value`);
    }

    if (current.feeAmount < 0) {
      errors.push(`Order value tier ${i + 1}: Fee amount cannot be negative`);
    }

    // Check for gaps with next tier
    if (next) {
      const currentMax = current.maxValue || Infinity;
      const nextMin = next.minValue;
      
      if (currentMax < nextMin - 1) {
        errors.push(`Gap between order value tiers ${i + 1} and ${i + 2}: values ${currentMax + 1} to ${nextMin - 1} are not covered`);
      }
    }
  }

  if (config.freeDeliveryThreshold <= 0) {
    errors.push('Free delivery threshold must be greater than 0');
  }

  return errors;
}

/**
 * Get delivery fee breakdown for admin display
 */
export function getDeliveryFeeBreakdown(result: DeliveryFeeResult) {
  return {
    isFree: result.isFree,
    totalFee: result.fee,
    baseFee: result.breakdown.baseFee,
    distanceSurcharge: result.breakdown.distanceSurcharge,
    message: result.message,
    amountNeededForFree: result.amountNeededForFree
  };
}