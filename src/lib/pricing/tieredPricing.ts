/**
 * Tiered Pricing Calculator - Swiggy/Zomato Style
 * Auto-updating pricing based on quantity tiers
 */

import { PricingTier } from '@/types/product';

export interface TieredPriceResult {
  pricePerItem: number;
  totalPrice: number;
  discountPercent: number;
  appliedTier: PricingTier;
  savings: number;
  originalPrice: number;
}

/**
 * Calculate tiered price based on quantity and pricing tiers
 * Follows Swiggy/Zomato pattern: auto-updates, no tier display
 */
export function calculateTieredPrice(
  quantity: number,
  tiers: PricingTier[]
): TieredPriceResult {
  if (!tiers || tiers.length === 0) {
    throw new Error('Pricing tiers are required');
  }

  // Sort tiers by minQty to ensure proper order
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);

  // Find the applicable tier for the given quantity
  const applicableTier = sortedTiers.find(tier => {
    const meetsMin = quantity >= tier.minQty;
    const meetsMax = tier.maxQty === null || quantity <= tier.maxQty;
    return meetsMin && meetsMax;
  });

  if (!applicableTier) {
    throw new Error(`No pricing tier found for quantity ${quantity}`);
  }

  // Calculate prices (convert from paise to rupees for display)
  const pricePerItem = applicableTier.pricePerItem / 100;
  const totalPrice = pricePerItem * quantity;
  
  // Calculate discount percentage
  const basePrice = sortedTiers[0].pricePerItem / 100;
  const discountPercent = Math.round(((basePrice - pricePerItem) / basePrice) * 100);
  const savings = (basePrice - pricePerItem) * quantity;
  const originalPrice = basePrice * quantity;

  return {
    pricePerItem,
    totalPrice,
    discountPercent,
    appliedTier: applicableTier,
    savings,
    originalPrice
  };
}

/**
 * Format price for display (handles paise conversion)
 */
export function formatPrice(priceInPaise: number): string {
  const priceInRupees = priceInPaise / 100;
  return `₹${priceInRupees.toLocaleString('en-IN')}`;
}

/**
 * Get pricing tier description for display
 */
export function getTierDescription(tier: PricingTier): string {
  const minQty = tier.minQty;
  const maxQty = tier.maxQty;
  const price = formatPrice(tier.pricePerItem);
  
  if (maxQty === null) {
    return `${minQty}+ items: ${price} per item`;
  }
  
  if (minQty === maxQty) {
    return `${minQty} items: ${price} per item`;
  }
  
  return `${minQty}-${maxQty} items: ${price} per item`;
}

/**
 * Calculate savings message for display
 */
export function getSavingsMessage(result: TieredPriceResult): string {
  if (result.savings <= 0) {
    return '';
  }
  
  const savingsFormatted = formatPrice(result.savings * 100);
  return `Save ${savingsFormatted} (${result.discountPercent}% off)`;
}

/**
 * Validate pricing tiers for consistency
 */
export function validatePricingTiers(tiers: PricingTier[]): string[] {
  const errors: string[] = [];
  
  if (!tiers || tiers.length === 0) {
    errors.push('At least one pricing tier is required');
    return errors;
  }

  // Sort by minQty
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);

  // Check for gaps and overlaps
  for (let i = 0; i < sortedTiers.length; i++) {
    const current = sortedTiers[i];
    const next = sortedTiers[i + 1];

    // Validate current tier
    if (current.minQty < 1) {
      errors.push(`Tier ${i + 1}: Minimum quantity must be at least 1`);
    }

    if (current.maxQty !== null && current.maxQty < current.minQty) {
      errors.push(`Tier ${i + 1}: Maximum quantity cannot be less than minimum quantity`);
    }

    if (current.pricePerItem <= 0) {
      errors.push(`Tier ${i + 1}: Price must be greater than 0`);
    }

    // Check for gaps with next tier
    if (next) {
      const currentMax = current.maxQty || Infinity;
      const nextMin = next.minQty;
      
      if (currentMax < nextMin - 1) {
        errors.push(`Gap between tier ${i + 1} and tier ${i + 2}: quantities ${currentMax + 1} to ${nextMin - 1} are not covered`);
      }
      
      if (currentMax >= nextMin) {
        errors.push(`Overlap between tier ${i + 1} and tier ${i + 2}: quantities ${Math.max(current.minQty, nextMin)} to ${Math.min(currentMax, next.maxQty || Infinity)} are covered by both tiers`);
      }
    }
  }

  return errors;
}

/**
 * Create default pricing tiers for new products
 */
export function createDefaultPricingTiers(basePrice: number): PricingTier[] {
  const basePriceInPaise = Math.round(basePrice * 100);
  
  return [
    {
      minQty: 1,
      maxQty: 9,
      pricePerItem: basePriceInPaise,
      discountPercent: 0
    },
    {
      minQty: 10,
      maxQty: 49,
      pricePerItem: Math.round(basePriceInPaise * 0.9), // 10% off
      discountPercent: 10
    },
    {
      minQty: 50,
      maxQty: null,
      pricePerItem: Math.round(basePriceInPaise * 0.8), // 20% off
      discountPercent: 20
    }
  ];
}

/**
 * Calculate price breakdown for display
 */
export function getPriceBreakdown(result: TieredPriceResult, quantity: number) {
  return {
    quantity,
    pricePerItem: result.pricePerItem,
    totalPrice: result.totalPrice,
    discount: result.savings,
    discountPercent: result.discountPercent,
    originalTotal: result.originalPrice,
    savingsMessage: getSavingsMessage(result)
  };
}