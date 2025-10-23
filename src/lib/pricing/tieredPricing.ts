// Tiered Pricing Calculation Utilities
// Swiggy/Zomato-like dynamic pricing with MOQ-based add-ons

import { PricingTier, PriceCalculation, TieredProduct, ProductAddOn } from '@/types/tiered-pricing';

/**
 * Calculate tiered price for a given quantity
 */
export function calculateTieredPrice(
  quantity: number, 
  pricingTiers: PricingTier[]
): { pricePerItem: number; totalPrice: number; discountPercent: number } {
  if (pricingTiers.length === 0) {
    throw new Error('No pricing tiers available');
  }

  // Sort tiers by min quantity
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQty - b.minQty);
  
  // Find applicable tier
  let applicableTier = sortedTiers[0];
  
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty)) {
      applicableTier = tier;
    }
  }
  
  return {
    pricePerItem: applicableTier.pricePerItem,
    totalPrice: applicableTier.pricePerItem * quantity,
    discountPercent: applicableTier.discountPercent
  };
}

/**
 * Validate pricing tiers for consistency
 */
export function validatePricingTiers(pricingTiers: PricingTier[]): string[] {
  const errors: string[] = [];
  
  if (pricingTiers.length === 0) {
    errors.push('At least one pricing tier is required');
    return errors;
  }
  
  // Sort tiers by min quantity
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQty - b.minQty);
  
  // Check for gaps in quantity ranges
  for (let i = 0; i < sortedTiers.length; i++) {
    const currentTier = sortedTiers[i];
    const nextTier = sortedTiers[i + 1];
    
    if (currentTier.minQty <= 0) {
      errors.push('Minimum quantity must be greater than 0');
    }
    
    if (currentTier.maxQty !== null && currentTier.maxQty < currentTier.minQty) {
      errors.push('Maximum quantity cannot be less than minimum quantity');
    }
    
    if (nextTier && currentTier.maxQty !== null) {
      if (currentTier.maxQty + 1 !== nextTier.minQty) {
        errors.push(`Gap in quantity ranges between tiers: ${currentTier.maxQty + 1} to ${nextTier.minQty - 1}`);
      }
    }
    
    // Check for overlapping tiers
    if (currentTier.maxQty !== null && nextTier) {
      if (currentTier.maxQty >= nextTier.minQty) {
        errors.push('Pricing tiers cannot overlap');
      }
    }
  }
  
  // Check that the last tier doesn't have a max quantity (should be open-ended)
  const lastTier = sortedTiers[sortedTiers.length - 1];
  if (lastTier.maxQty !== null) {
    errors.push('The highest tier should not have a maximum quantity limit');
  }
  
  return errors;
}

/**
 * Get pricing tier information for display
 */
export function getPricingTierInfo(
  quantity: number, 
  pricingTiers: PricingTier[]
): {
  currentTier: PricingTier;
  nextTier?: PricingTier;
  savingsFromNextTier?: number;
  quantityToNextTier?: number;
} {
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQty - b.minQty);
  
  let currentTier = sortedTiers[0];
  let nextTier: PricingTier | undefined;
  
  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    if (quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty)) {
      currentTier = tier;
      nextTier = sortedTiers[i + 1];
      break;
    }
  }
  
  let savingsFromNextTier: number | undefined;
  let quantityToNextTier: number | undefined;
  
  if (nextTier && currentTier.pricePerItem > nextTier.pricePerItem) {
    savingsFromNextTier = (currentTier.pricePerItem - nextTier.pricePerItem) * quantity;
    quantityToNextTier = nextTier.minQty - quantity;
  }
  
  return {
    currentTier,
    nextTier,
    savingsFromNextTier,
    quantityToNextTier
  };
}

/**
 * Calculate total price with add-ons
 */
export function calculateTotalPriceWithAddOns(
  quantity: number,
  pricingTiers: PricingTier[],
  selectedAddOns: Array<{ addOnId: string; quantity: number }>,
  availableAddOns: ProductAddOn[]
): PriceCalculation {
  const tierPrice = calculateTieredPrice(quantity, pricingTiers);
  const basePrice = tierPrice.totalPrice;
  
  let addOnsPrice = 0;
  const breakdown = [
    { item: 'Base cost', amount: basePrice }
  ];
  
  // Calculate add-ons price
  for (const selectedAddOn of selectedAddOns) {
    const addOn = availableAddOns.find(a => a.id === selectedAddOn.addOnId);
    if (addOn && selectedAddOn.quantity >= addOn.minimumOrderQuantity) {
      const addOnTotal = addOn.pricePaise * selectedAddOn.quantity;
      addOnsPrice += addOnTotal;
      breakdown.push({
        item: addOn.name,
        amount: addOnTotal,
        description: `₹${addOn.pricePaise / 100} × ${selectedAddOn.quantity}`
      });
    }
  }
  
  const subtotal = basePrice + addOnsPrice;
  const deliveryFee = 0; // Will be calculated separately
  const platformFee = 0; // Will be calculated separately
  const gst = Math.round((subtotal + deliveryFee + platformFee) * 0.18); // 18% GST
  const total = subtotal + deliveryFee + platformFee + gst;
  
  breakdown.push(
    { item: 'Delivery fee', amount: deliveryFee },
    { item: 'Platform fee', amount: platformFee },
    { item: 'GST (18%)', amount: gst }
  );
  
  return {
    basePrice,
    addOnsPrice,
    deliveryFee,
    platformFee,
    gst,
    total,
    breakdown
  };
}

/**
 * Format price for display (paise to rupees)
 */
export function formatPrice(pricePaise: number): string {
  return `₹${Math.round(pricePaise / 100).toLocaleString()}`;
}

/**
 * Convert rupees to paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Get quantity range display string
 */
export function getQuantityRangeDisplay(tier: PricingTier): string {
  if (tier.maxQty === null) {
    return `${tier.minQty}+`;
  }
  return `${tier.minQty}-${tier.maxQty}`;
}

/**
 * Check if quantity qualifies for a specific tier
 */
export function quantityQualifiesForTier(quantity: number, tier: PricingTier): boolean {
  return quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty);
}

/**
 * Get next tier information for upselling
 */
export function getNextTierInfo(
  currentQuantity: number,
  pricingTiers: PricingTier[]
): {
  nextTier?: PricingTier;
  quantityNeeded?: number;
  savingsPotential?: number;
  message?: string;
} {
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQty - b.minQty);
  
  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];
    if (currentQuantity >= tier.minQty && (tier.maxQty === null || currentQuantity <= tier.maxQty)) {
      const nextTier = sortedTiers[i + 1];
      if (nextTier) {
        const quantityNeeded = nextTier.minQty - currentQuantity;
        const savingsPerUnit = tier.pricePerItem - nextTier.pricePerItem;
        const savingsPotential = savingsPerUnit * nextTier.minQty;
        
        return {
          nextTier,
          quantityNeeded,
          savingsPotential,
          message: `Add ${quantityNeeded} more items to save ₹${Math.round(savingsPotential / 100)}`
        };
      }
      break;
    }
  }
  
  return {};
}

/**
 * Validate add-on selection against MOQ requirements
 */
export function validateAddOnSelection(
  selectedAddOns: Array<{ addOnId: string; quantity: number }>,
  availableAddOns: ProductAddOn[],
  mainProductQuantity: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const selectedAddOn of selectedAddOns) {
    const addOn = availableAddOns.find(a => a.id === selectedAddOn.addOnId);
    if (!addOn) {
      errors.push(`Add-on ${selectedAddOn.addOnId} not found`);
      continue;
    }
    
    if (selectedAddOn.quantity < addOn.minimumOrderQuantity) {
      errors.push(`${addOn.name} requires minimum ${addOn.minimumOrderQuantity} units`);
    }
    
    // Check if main product quantity qualifies for this add-on's MOQ
    if (mainProductQuantity < addOn.minimumOrderQuantity) {
      errors.push(`${addOn.name} is only available for orders of ${addOn.minimumOrderQuantity}+ items`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create default pricing tiers for new products
 */
export function createDefaultPricingTiers(basePrice: number): PricingTier[] {
  return [
    {
      minQty: 1,
      maxQty: 9,
      pricePerItem: rupeesToPaise(basePrice),
      discountPercent: 0
    },
    {
      minQty: 10,
      maxQty: 49,
      pricePerItem: rupeesToPaise(basePrice * 0.9), // 10% discount
      discountPercent: 10
    },
    {
      minQty: 50,
      maxQty: 99,
      pricePerItem: rupeesToPaise(basePrice * 0.85), // 15% discount
      discountPercent: 15
    },
    {
      minQty: 100,
      maxQty: null,
      pricePerItem: rupeesToPaise(basePrice * 0.8), // 20% discount
      discountPercent: 20
    }
  ];
}