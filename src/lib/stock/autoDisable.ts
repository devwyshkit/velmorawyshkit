/**
 * Auto-Disable Sourcing Logic
 * Automatically disables sourcing when stock reaches 0
 */

import { supabase } from '@/lib/integrations/supabase-client';

export const disableSourcing = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('partner_products')
    .update({ sourcing_available: false })
    .eq('id', productId);

  if (error) {
    throw new Error(`Failed to disable sourcing: ${error.message}`);
  }
};

export const enableSourcing = async (productId: string): Promise<void> => {
  const { error } = await supabase
    .from('partner_products')
    .update({ sourcing_available: true })
    .eq('id', productId);

  if (error) {
    throw new Error(`Failed to enable sourcing: ${error.message}`);
  }
};

export const checkAndDisableSourcing = async (
  productId: string,
  currentStock: number
): Promise<boolean> => {
  if (currentStock === 0) {
    await disableSourcing(productId);
    return true;
  }
  return false;
};

