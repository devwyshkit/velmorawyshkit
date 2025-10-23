/**
 * useDeliveryFee Hook
 * Swiggy/Zomato pattern for delivery fee calculation
 * Provides real-time delivery fee updates as cart changes
 */

import { useMemo } from 'react';
import { calculateDeliveryFee, createDeliveryBannerMessage, getDeliveryFeeBreakdown } from '@/lib/pricing/deliveryFee';
import { DeliveryFeeCalculation } from '@/types/product';

interface UseDeliveryFeeOptions {
  cartSubtotal: number; // in paise
  distanceKm?: number;
  freeThreshold?: number; // in paise
}

interface UseDeliveryFeeReturn {
  // Core calculation
  deliveryFee: DeliveryFeeCalculation;
  
  // Display helpers
  bannerMessage: ReturnType<typeof createDeliveryBannerMessage>;
  breakdown: ReturnType<typeof getDeliveryFeeBreakdown>;
  
  // Utility functions
  formatFee: () => string;
  isCloseTo FreeDelivery: boolean; // Within ₹1000 of free delivery
  progressPercentage: number; // 0-100, for progress bar
}

/**
 * Hook for calculating and displaying delivery fees
 * Automatically updates when cart subtotal changes
 */
export function useDeliveryFee({
  cartSubtotal,
  distanceKm = 0,
  freeThreshold = 500000, // ₹5000 default
}: UseDeliveryFeeOptions): UseDeliveryFeeReturn {
  // Calculate delivery fee
  const deliveryFee = useMemo(() => {
    return calculateDeliveryFee(cartSubtotal, undefined, freeThreshold, distanceKm);
  }, [cartSubtotal, distanceKm, freeThreshold]);
  
  // Create banner message for UI
  const bannerMessage = useMemo(() => {
    return createDeliveryBannerMessage(cartSubtotal, deliveryFee);
  }, [cartSubtotal, deliveryFee]);
  
  // Get detailed breakdown
  const breakdown = useMemo(() => {
    return getDeliveryFeeBreakdown(cartSubtotal, undefined, freeThreshold);
  }, [cartSubtotal, freeThreshold]);
  
  // Check if close to free delivery (within ₹1000)
  const isCloseToFreeDelivery = useMemo(() => {
    return deliveryFee.amountNeededForFree > 0 && deliveryFee.amountNeededForFree < 100000;
  }, [deliveryFee.amountNeededForFree]);
  
  // Calculate progress percentage for visual progress bar
  const progressPercentage = useMemo(() => {
    if (deliveryFee.isFree) return 100;
    return Math.min(100, (cartSubtotal / freeThreshold) * 100);
  }, [cartSubtotal, freeThreshold, deliveryFee.isFree]);
  
  // Format fee for display
  const formatFee = () => {
    if (deliveryFee.isFree) return 'FREE';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(deliveryFee.fee / 100);
  };
  
  return {
    deliveryFee,
    bannerMessage,
    breakdown,
    formatFee,
    isCloseToFreeDelivery,
    progressPercentage,
  };
}

/**
 * Hook for delivery fee config management (Admin use)
 */
export function useDeliveryFeeConfig() {
  // TODO: Fetch from Supabase when admin panel is built
  // For now, return default config
  
  const updateDeliveryConfig = async (config: any) => {
    // TODO: Update in Supabase
    console.log('Updating delivery config:', config);
  };
  
  const updateFreeThreshold = async (threshold: number) => {
    // TODO: Update in Supabase platform_config table
    console.log('Updating free threshold:', threshold);
  };
  
  return {
    updateDeliveryConfig,
    updateFreeThreshold,
  };
}

