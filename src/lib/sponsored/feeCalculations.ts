/**
 * Sponsored Fee Calculations
 * Feature 5: PROMPT 5 - Sponsored Listings
 * Calculate fees, validate wallet balance, estimate costs
 */

import { supabase } from "@/lib/integrations/supabase-client";

/**
 * Calculate estimated daily fee for sponsored product
 * Based on average daily sales and product price
 */
export const calculateEstimatedFee = (
  productPrice: number, // in paise
  avgDailySales: number,
  feePercent: number = 0.05 // 5% default
): number => {
  return Math.round(productPrice * avgDailySales * feePercent);
};

/**
 * Calculate actual fee from orders for a specific date
 * Used by daily cron job to charge partners
 */
export const calculateActualFee = async (
  productId: string,
  date: string // YYYY-MM-DD format
): Promise<number> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total')
      .eq('product_id', productId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (error) {
      console.error('Fetch orders for fee calculation error:', error);
      return 0;
    }

    const revenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
    return Math.round(revenue * 0.05); // 5% fee
  } catch (error) {
    console.error('Calculate actual fee error:', error);
    return 0;
  }
};

/**
 * Validate if partner has sufficient wallet balance for sponsored period
 * Prevents activation if wallet balance is insufficient
 */
export const validateWalletBalance = async (
  partnerId: string,
  estimatedDailyFee: number,
  durationDays: number
): Promise<{ valid: boolean; currentBalance?: number; required?: number; error?: string }> => {
  try {
    const { data: wallet, error } = await supabase
      .from('partner_wallets')
      .select('balance')
      .eq('partner_id', partnerId)
      .single();

    if (error) {
      console.warn('Wallet fetch error:', error);
      // If wallet doesn't exist, assume valid (will be created on first transaction)
      return { valid: true };
    }

    const required = estimatedDailyFee * durationDays;
    const valid = wallet.balance >= required;

    return {
      valid,
      currentBalance: wallet.balance,
      required,
      error: valid ? undefined : `Insufficient balance. You need ₹${((required - wallet.balance) / 100).toFixed(2)} more.`
    };
  } catch (error) {
    console.error('Validate wallet balance error:', error);
    return { valid: false, error: 'Failed to validate wallet balance' };
  }
};

/**
 * Estimate cost for sponsored period
 * Shows partner how much they'll spend before activation
 */
export const estimateSponsoredCost = (
  productPrice: number, // in paise
  avgDailySales: number,
  durationDays: number,
  feePercent: number = 0.05
): {
  dailyFee: number;
  totalFee: number;
  dailyRevenue: number;
  totalRevenue: number;
  roi: number; // Return on Investment percentage
} => {
  const dailyRevenue = productPrice * avgDailySales;
  const dailyFee = Math.round(dailyRevenue * feePercent);
  const totalRevenue = dailyRevenue * durationDays;
  const totalFee = dailyFee * durationDays;
  
  // ROI = (Revenue gained - Fee) / Fee * 100
  // Assuming sponsored gives 30% visibility boost
  const visibilityBoost = 0.30;
  const additionalRevenue = totalRevenue * visibilityBoost;
  const roi = totalFee > 0 ? ((additionalRevenue - totalFee) / totalFee) * 100 : 0;

  return {
    dailyFee,
    totalFee,
    dailyRevenue,
    totalRevenue,
    roi
  };
};

/**
 * Get average daily sales for a product
 * Looks at last 30 days of order history
 */
export const getAvgDailySales = async (productId: string): Promise<number> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders, error } = await supabase
      .from('order_items')
      .select('quantity')
      .eq('product_id', productId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Fetch sales history error:', error);
      return 1; // Default to 1 sale/day
    }

    const totalQuantity = orders?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    return Math.max(1, Math.round(totalQuantity / 30)); // At least 1/day
  } catch (error) {
    console.error('Get avg daily sales error:', error);
    return 1;
  }
};

