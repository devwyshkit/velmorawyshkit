/**
 * Sourcing Usage Tracking
 * Feature 11: PROMPT 11 - Sourcing Limits
 * Tracks monthly sourcing usage per product per reseller
 */

import { supabase } from "@/lib/integrations/supabase-client";

/**
 * Increment sourcing usage after successful order
 * Creates new record if first order this month, updates existing otherwise
 */
export const incrementSourcingUsage = async (
  productId: string,
  quantity: number,
  resellerId: string
): Promise<void> => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Check if record exists for this reseller + product + month
    const { data: existing, error: fetchError } = await supabase
      .from('sourcing_usage')
      .select('id, units_sourced')
      .eq('product_id', productId)
      .eq('partner_id', resellerId)
      .eq('month', currentMonth)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Fetch existing usage error:', fetchError);
      return;
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('sourcing_usage')
        .update({
          units_sourced: existing.units_sourced + quantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Update usage error:', updateError);
      }
    } else {
      // Create new record for this month
      const { error: insertError } = await supabase
        .from('sourcing_usage')
        .insert({
          product_id: productId,
          partner_id: resellerId,
          month: currentMonth,
          units_sourced: quantity,
          last_updated: new Date().toISOString()
        });

      if (insertError) {
        console.error('Insert usage error:', insertError);
      }
    }

    // Check if limit reached
    await checkLimitReached(productId);
  } catch (error) {
    console.error('Track usage error:', error);
  }
};

/**
 * Check if sourcing limit has been reached
 * Auto-disables sourcing if limit hit
 */
const checkLimitReached = async (productId: string): Promise<void> => {
  try {
    const { data: product } = await supabase
      .from('partner_products')
      .select('sourcing_limit_monthly, sourcing_limit_enabled, partner_id')
      .eq('id', productId)
      .single();

    if (!product || !product.sourcing_limit_enabled || !product.sourcing_limit_monthly) {
      return; // No limit set
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data: usageData } = await supabase
      .from('sourcing_usage')
      .select('units_sourced')
      .eq('product_id', productId)
      .eq('month', currentMonth);

    const totalUsage = usageData?.reduce((sum, record) => sum + record.units_sourced, 0) || 0;

    if (totalUsage >= product.sourcing_limit_monthly) {
      // Limit reached - auto-disable sourcing
      await supabase
        .from('partner_products')
        .update({ sourcing_available: false })
        .eq('id', productId);

      // TODO: Send notification to partner
      console.log(`Sourcing limit reached for product ${productId}`);
    }
  } catch (error) {
    console.error('Check limit error:', error);
  }
};

/**
 * Get sourcing usage status for a product
 * Returns current usage, limit, and percentage
 */
export const getSourcingStatus = async (productId: string): Promise<{
  used: number;
  limit: number | null;
  percentage: number;
  remaining: number | null;
} | null> => {
  try {
    const { data: product } = await supabase
      .from('partner_products')
      .select('sourcing_limit_monthly, sourcing_limit_enabled')
      .eq('id', productId)
      .single();

    if (!product || !product.sourcing_limit_enabled || !product.sourcing_limit_monthly) {
      return null; // No limit
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const { data: usageData } = await supabase
      .from('sourcing_usage')
      .select('units_sourced')
      .eq('product_id', productId)
      .eq('month', currentMonth);

    const used = usageData?.reduce((sum, record) => sum + record.units_sourced, 0) || 0;
    const limit = product.sourcing_limit_monthly;
    const remaining = Math.max(0, limit - used);
    const percentage = (used / limit) * 100;

    return { used, limit, percentage, remaining };
  } catch (error) {
    console.error('Get sourcing status error:', error);
    return null;
  }
};

