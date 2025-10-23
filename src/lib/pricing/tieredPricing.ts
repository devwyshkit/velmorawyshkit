/**
 * Tiered Pricing Calculator
 * Swiggy/Zomato pattern: Price automatically updates based on quantity
 * Battle-tested e-commerce pricing logic
 */

import { PricingTier, CalculatedPrice } from '@/types/product';

/**
 * Calculate price based on quantity and pricing tiers
 * Returns the applicable tier and calculated values
 */
export function calculateTieredPrice(
  quantity: number,
  tiers: PricingTier[]
): CalculatedPrice {
  if (!tiers || tiers.length === 0) {
    throw new Error('No pricing tiers defined for product');
  }
  
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }
  
  // Find the applicable tier
  // Tiers are expected to be ordered by minQty ascending
  const appliedTier = findApplicableTier(quantity, tiers);
  
  if (!appliedTier) {
    // Fallback to first tier if no match (shouldn't happen with proper data)
    const firstTier = tiers[0];
    return {
      quantity,
      pricePerItem: firstTier.pricePerItem,
      subtotal: firstTier.pricePerItem * quantity,
      discountPercent: firstTier.discountPercent,
      appliedTier: firstTier,
      savings: 0,
    };
  }
  
  const pricePerItem = appliedTier.pricePerItem;
  const subtotal = pricePerItem * quantity;
  
  // Calculate savings compared to highest tier (base price)
  const baseTier = tiers[0]; // First tier is usually the base price
  const basePriceTotal = baseTier.pricePerItem * quantity;
  const savings = basePriceTotal - subtotal;
  
  return {
    quantity,
    pricePerItem,
    subtotal,
    discountPercent: appliedTier.discountPercent,
    appliedTier,
    savings: Math.max(0, savings),
  };
}

/**
 * Find the applicable pricing tier for a given quantity
 */
function findApplicableTier(
  quantity: number,
  tiers: PricingTier[]
): PricingTier | null {
  // Find the tier where quantity falls within range
  for (const tier of tiers) {
    const isAboveMin = quantity >= tier.minQty;
    const isBelowMax = tier.maxQty === null || quantity <= tier.maxQty;
    
    if (isAboveMin && isBelowMax) {
      return tier;
    }
  }
  
  return null;
}

/**
 * Get all tiers with their breakpoints for display
 * Used for showing "Save X% when you order Y+" messages
 */
export function getTierBreakpoints(tiers: PricingTier[]): Array<{
  minQty: number;
  maxQty: number | null;
  pricePerItem: number;
  discountPercent: number;
  savingsMessage: string;
}> {
  return tiers.map((tier, index) => {
    const baseTier = tiers[0];
    const savings = baseTier.pricePerItem - tier.pricePerItem;
    const savingsPercent = tier.discountPercent;
    
    let savingsMessage = '';
    if (savingsPercent > 0) {
      savingsMessage = `Save ${savingsPercent}% on orders of ${tier.minQty}+ items`;
    }
    
    return {
      minQty: tier.minQty,
      maxQty: tier.maxQty,
      pricePerItem: tier.pricePerItem,
      discountPercent: tier.discountPercent,
      savingsMessage,
    };
  });
}

/**
 * Format price in rupees (Swiggy/Zomato style)
 * @param paise Amount in paise (100 paise = 1 rupee)
 * @returns Formatted string like "₹5,000" or "₹2,52,000"
 */
export function formatPrice(paise: number): string {
  const rupees = paise / 100;
  
  // Indian number format (lakhs and crores)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Get the next tier information for "Add X more to unlock Y% discount" message
 */
export function getNextTierInfo(
  currentQuantity: number,
  tiers: PricingTier[]
): {
  hasNextTier: boolean;
  nextTier?: PricingTier;
  quantityNeeded?: number;
  message?: string;
} | null {
  const currentTier = findApplicableTier(currentQuantity, tiers);
  if (!currentTier) return null;
  
  // Find next tier
  const nextTier = tiers.find(
    (tier) => tier.minQty > currentQuantity && tier.discountPercent > currentTier.discountPercent
  );
  
  if (!nextTier) {
    return {
      hasNextTier: false,
    };
  }
  
  const quantityNeeded = nextTier.minQty - currentQuantity;
  const message = `Add ${quantityNeeded} more item${quantityNeeded > 1 ? 's' : ''} to unlock ${nextTier.discountPercent}% discount!`;
  
  return {
    hasNextTier: true,
    nextTier,
    quantityNeeded,
    message,
  };
}

/**
 * Validate pricing tiers
 * Ensures tiers are properly structured and non-overlapping
 */
export function validatePricingTiers(tiers: PricingTier[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!tiers || tiers.length === 0) {
    errors.push('At least one pricing tier is required');
    return { isValid: false, errors };
  }
  
  // Check if first tier starts at 1
  if (tiers[0].minQty !== 1) {
    errors.push('First pricing tier must start at quantity 1');
  }
  
  // Check for gaps and overlaps
  for (let i = 0; i < tiers.length - 1; i++) {
    const currentTier = tiers[i];
    const nextTier = tiers[i + 1];
    
    // Check price is positive
    if (currentTier.pricePerItem <= 0) {
      errors.push(`Tier ${i + 1}: Price must be greater than 0`);
    }
    
    // Check if maxQty is set and is greater than minQty
    if (currentTier.maxQty !== null && currentTier.maxQty < currentTier.minQty) {
      errors.push(`Tier ${i + 1}: Max quantity must be greater than min quantity`);
    }
    
    // Check for gaps between tiers
    if (currentTier.maxQty !== null && nextTier.minQty !== currentTier.maxQty + 1) {
      errors.push(`Gap between tier ${i + 1} and tier ${i + 2}`);
    }
    
    // Check price decreases as quantity increases (bulk discount pattern)
    if (nextTier.pricePerItem >= currentTier.pricePerItem) {
      errors.push(`Tier ${i + 2}: Price should be lower than previous tier for bulk discount`);
    }
  }
  
  // Check last tier
  const lastTier = tiers[tiers.length - 1];
  if (lastTier.pricePerItem <= 0) {
    errors.push(`Last tier: Price must be greater than 0`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Create default pricing tiers for a product
 * Useful for partner onboarding
 */
export function createDefaultTiers(basePrice: number): PricingTier[] {
  return [
    {
      minQty: 1,
      maxQty: 9,
      pricePerItem: basePrice,
      discountPercent: 0,
    },
    {
      minQty: 10,
      maxQty: 49,
      pricePerItem: Math.round(basePrice * 0.93), // 7% off
      discountPercent: 7,
    },
    {
      minQty: 50,
      maxQty: 99,
      pricePerItem: Math.round(basePrice * 0.87), // 13% off
      discountPercent: 13,
    },
    {
      minQty: 100,
      maxQty: null, // unlimited
      pricePerItem: Math.round(basePrice * 0.80), // 20% off
      discountPercent: 20,
    },
  ];
}

