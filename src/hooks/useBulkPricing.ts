import { useMemo } from "react";
import { BulkTier } from "@/types/products";

/**
 * Hook for Bulk Pricing Calculations
 * Used in both partner ProductForm and customer ItemSheet
 * 
 * Features:
 * - Find applicable tier for given quantity
 * - Calculate discounted price
 * - Calculate savings
 */

interface UseBulkPricingResult {
  applicableTier: BulkTier | null;
  finalPrice: number;
  savings: number;
  savingsPercent: number;
}

export const useBulkPricing = (
  quantity: number,
  basePrice: number,  // in paise
  bulkTiers?: BulkTier[]
): UseBulkPricingResult => {
  return useMemo(() => {
    // No bulk pricing configured
    if (!bulkTiers || bulkTiers.length === 0) {
      return {
        applicableTier: null,
        finalPrice: basePrice * quantity,
        savings: 0,
        savingsPercent: 0,
      };
    }

    // Find applicable tier (highest minQty that's <= quantity)
    const sorted = [...bulkTiers].sort((a, b) => b.minQty - a.minQty);
    const applicableTier = sorted.find(tier => quantity >= tier.minQty);

    if (!applicableTier) {
      // Quantity doesn't meet any tier threshold
      return {
        applicableTier: null,
        finalPrice: basePrice * quantity,
        savings: 0,
        savingsPercent: 0,
      };
    }

    // Calculate with tier pricing
    const tierTotal = applicableTier.price * quantity;
    const regularTotal = basePrice * quantity;
    const savings = regularTotal - tierTotal;
    const savingsPercent = Math.round((savings / regularTotal) * 100);

    return {
      applicableTier,
      finalPrice: tierTotal,
      savings,
      savingsPercent,
    };
  }, [quantity, basePrice, bulkTiers]);
};

/**
 * Helper: Format tier range display
 */
export const formatTierRange = (tier: BulkTier): string => {
  if (tier.maxQty) {
    return `${tier.minQty}-${tier.maxQty} units`;
  }
  return `${tier.minQty}+ units`;
};

/**
 * Helper: Get best tier message for customers
 */
export const getBestTierMessage = (
  currentQty: number,
  bulkTiers?: BulkTier[]
): string | null => {
  if (!bulkTiers || bulkTiers.length === 0) return null;

  // Find next tier
  const nextTier = bulkTiers.find(tier => tier.minQty > currentQty);
  
  if (!nextTier) return null;

  const unitsNeeded = nextTier.minQty - currentQty;
  const savingsPerUnit = Math.round((nextTier.price / 100) * nextTier.discountPercent);

  return `Add ${unitsNeeded} more to save ₹${savingsPerUnit}/unit (${nextTier.discountPercent}% off)`;
};

