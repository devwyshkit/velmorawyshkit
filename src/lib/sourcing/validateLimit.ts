/**
 * Sourcing Limit Validation
 * Feature 11: PROMPT 11 - Sourcing Limits
 * Validates sourcing orders against monthly limits
 */

import { supabase } from "@/lib/integrations/supabase-client";

interface ValidationResult {
  allowed: boolean;
  remaining?: number;
  error?: string;
}

/**
 * Validate if a sourcing order is within monthly limits
 * Called when reseller places component order
 */
export const validateSourcingLimit = async (
  productId: string,
  quantity: number
): Promise<ValidationResult> => {
  try {
    // Get product sourcing limits
    const { data: product, error: productError } = await supabase
      .from('partner_products')
      .select('sourcing_limit_monthly, sourcing_limit_enabled, sourcing_available')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Product fetch error:', productError);
      return { allowed: false, error: 'Product not found' };
    }

    // Check if sourcing is available
    if (!product.sourcing_available) {
      return { allowed: false, error: 'Product not available for sourcing' };
    }

    // If no limit set, allow unlimited sourcing
    if (!product.sourcing_limit_enabled || !product.sourcing_limit_monthly) {
      return { allowed: true };
    }

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { data: usageData, error: usageError } = await supabase
      .from('sourcing_usage')
      .select('units_sourced')
      .eq('product_id', productId)
      .eq('month', currentMonth);

    if (usageError) {
      console.error('Usage fetch error:', usageError);
      // Allow order but log warning
      return { allowed: true };
    }

    // Calculate total usage for this month (across all resellers)
    const currentUsage = usageData?.reduce((sum, record) => sum + record.units_sourced, 0) || 0;
    const remaining = product.sourcing_limit_monthly - currentUsage;

    // Check if order exceeds remaining limit
    if (quantity > remaining) {
      return {
        allowed: false,
        remaining,
        error: `Sourcing limit exceeded. Only ${remaining} units available this month.`
      };
    }

    return {
      allowed: true,
      remaining: remaining - quantity
    };
  } catch (error) {
    console.error('Validation error:', error);
    return { allowed: false, error: 'Validation failed. Please try again.' };
  }
};

/**
 * Get remaining units for a product this month
 * Used to display availability in Component Marketplace
 */
export const getRemainingUnits = async (productId: string): Promise<number | null> => {
  try {
    const { data: product } = await supabase
      .from('partner_products')
      .select('sourcing_limit_monthly, sourcing_limit_enabled')
      .eq('id', productId)
      .single();

    if (!product || !product.sourcing_limit_enabled || !product.sourcing_limit_monthly) {
      return null; // Unlimited
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data: usageData } = await supabase
      .from('sourcing_usage')
      .select('units_sourced')
      .eq('product_id', productId)
      .eq('month', currentMonth);

    const currentUsage = usageData?.reduce((sum, record) => sum + record.units_sourced, 0) || 0;
    return Math.max(0, product.sourcing_limit_monthly - currentUsage);
  } catch (error) {
    console.error('Get remaining units error:', error);
    return null;
  }
};

