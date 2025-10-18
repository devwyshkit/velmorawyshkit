/**
 * useBulkPricing Hook
 * Auto-calculates price based on quantity tiers (Zomato combo pattern)
 * Shows toast when bulk discount applied
 */

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import type { BulkPricingTier } from '@/lib/integrations/supabase-data';

interface UseBulkPricingReturn {
  appliedPrice: number; // Price per unit based on quantity
  totalPrice: number; // Total price (appliedPrice * quantity)
  tierApplied: BulkPricingTier | null;
  discount: number; // Percentage discount from base price
}

export const useBulkPricing = (
  basePrice: number, // Regular price per unit (in paise)
  quantity: number,
  bulkTiers: BulkPricingTier[] = []
): UseBulkPricingReturn => {
  const { toast } = useToast();
  const [appliedPrice, setAppliedPrice] = useState(basePrice);
  const [tierApplied, setTierApplied] = useState<BulkPricingTier | null>(null);

  useEffect(() => {
    // No bulk pricing tiers defined - use base price
    if (!bulkTiers || bulkTiers.length === 0) {
      setAppliedPrice(basePrice);
      setTierApplied(null);
      return;
    }

    // Find applicable tier for current quantity
    const applicableTier = bulkTiers.find(tier =>
      quantity >= tier.min_qty && 
      (tier.max_qty === null || quantity <= tier.max_qty)
    );

    if (applicableTier) {
      setAppliedPrice(applicableTier.price_per_unit);
      
      // Show toast only when tier changes (not on initial load)
      if (tierApplied && tierApplied.min_qty !== applicableTier.min_qty) {
        const discountPercent = Math.round(
          ((basePrice - applicableTier.price_per_unit) / basePrice) * 100
        );
        
        toast({
          title: "Bulk Pricing Applied! 🎉",
          description: `₹${(applicableTier.price_per_unit / 100).toFixed(0)}/unit for ${quantity} items (${discountPercent}% off)`,
          duration: 3000,
        });
      }
      
      setTierApplied(applicableTier);
    } else {
      // No tier matches - use base price
      setAppliedPrice(basePrice);
      setTierApplied(null);
    }
  }, [quantity, bulkTiers, basePrice]);

  const discount = tierApplied 
    ? Math.round(((basePrice - appliedPrice) / basePrice) * 100)
    : 0;

  return {
    appliedPrice,
    totalPrice: appliedPrice * quantity,
    tierApplied,
    discount,
  };
};

