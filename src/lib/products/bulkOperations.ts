/**
 * Bulk Operations Logic
 * Feature 2: PROMPT 8
 * Handles batch updates for multiple products
 */

import { supabase } from '@/lib/integrations/supabase-client';
import type { 
  PriceUpdate, 
  StockUpdate, 
  StatusUpdate, 
  TagsUpdate,
  BulkOperationResult 
} from '@/types/bulkOperations';

/**
 * Update prices for multiple products
 */
export const bulkUpdatePrices = async (
  productIds: string[],
  update: PriceUpdate,
  partnerId: string
): Promise<BulkOperationResult> => {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    // Fetch products to calculate new prices
    const { data: products, error: fetchError } = await supabase
      .from('partner_products')
      .select('id, name, price, wholesale_price')
      .in('id', productIds)
      .eq('partner_id', partnerId);

    if (fetchError) throw fetchError;
    if (!products) throw new Error('No products found');

    // Calculate new prices for each product
    for (const product of products) {
      try {
        let newPrice = product.price;
        let newWholesale = product.wholesale_price || product.price;

        if (update.applyTo === 'retail' || update.applyTo === 'both') {
          newPrice = calculateNewPrice(product.price, update);
        }

        if (update.applyTo === 'wholesale' || update.applyTo === 'both') {
          newWholesale = calculateNewPrice(product.wholesale_price || product.price, update);
        }

        // Validate: retail should be greater than wholesale
        if (newWholesale >= newPrice) {
          result.failed++;
          result.errors.push({
            productId: product.id,
            productName: product.name,
            error: 'Wholesale price cannot be greater than or equal to retail price'
          });
          continue;
        }

        // Update in database
        const { error: updateError } = await supabase
          .from('partner_products')
          .update({
            price: Math.round(newPrice),
            wholesale_price: Math.round(newWholesale)
          })
          .eq('id', product.id);

        if (updateError) throw updateError;
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          productId: product.id,
          productName: product.name,
          error: error.message
        });
      }
    }
  } catch (error: any) {
    throw new Error(`Bulk price update failed: ${error.message}`);
  }

  return result;
};

/**
 * Calculate new price based on update operation
 */
const calculateNewPrice = (currentPrice: number, update: PriceUpdate): number => {
  if (update.operation === 'increase') {
    if (update.type === 'percentage') {
      return currentPrice * (1 + update.value / 100);
    }
    return currentPrice + (update.value * 100); // Convert rupees to paise
  } else {
    if (update.type === 'percentage') {
      return currentPrice * (1 - update.value / 100);
    }
    return Math.max(100, currentPrice - (update.value * 100)); // Minimum 1 rupee
  }
};

/**
 * Update stock for multiple products
 */
export const bulkUpdateStock = async (
  productIds: string[],
  update: StockUpdate,
  partnerId: string
): Promise<BulkOperationResult> => {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    const { data: products, error: fetchError } = await supabase
      .from('partner_products')
      .select('id, name, stock')
      .in('id', productIds)
      .eq('partner_id', partnerId);

    if (fetchError) throw fetchError;
    if (!products) throw new Error('No products found');

    for (const product of products) {
      try {
        let newStock = product.stock;

        switch (update.operation) {
          case 'set':
            newStock = update.value;
            break;
          case 'increase':
            newStock = product.stock + update.value;
            break;
          case 'decrease':
            newStock = Math.max(0, product.stock - update.value);
            break;
        }

        const { error: updateError } = await supabase
          .from('partner_products')
          .update({ stock: newStock })
          .eq('id', product.id);

        if (updateError) throw updateError;
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          productId: product.id,
          productName: product.name,
          error: error.message
        });
      }
    }
  } catch (error: any) {
    throw new Error(`Bulk stock update failed: ${error.message}`);
  }

  return result;
};

/**
 * Change status for multiple products
 */
export const bulkChangeStatus = async (
  productIds: string[],
  update: StatusUpdate,
  partnerId: string
): Promise<BulkOperationResult> => {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    const isActive = update.status === 'active';
    const stock = update.status === 'out_of_stock' ? 0 : undefined;

    const updateData: any = { is_active: isActive };
    if (stock !== undefined) {
      updateData.stock = stock;
    }

    const { error } = await supabase
      .from('partner_products')
      .update(updateData)
      .in('id', productIds)
      .eq('partner_id', partnerId);

    if (error) throw error;
    result.success = productIds.length;
  } catch (error: any) {
    result.failed = productIds.length;
    throw new Error(`Bulk status change failed: ${error.message}`);
  }

  return result;
};

/**
 * Update tags for multiple products
 */
export const bulkUpdateTags = async (
  productIds: string[],
  update: TagsUpdate,
  partnerId: string
): Promise<BulkOperationResult> => {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    if (update.operation === 'replace') {
      // Simple replace - same tags for all products
      const { error } = await supabase
        .from('partner_products')
        .update({ tags: update.tags })
        .in('id', productIds)
        .eq('partner_id', partnerId);

      if (error) throw error;
      result.success = productIds.length;
    } else {
      // Add or remove - need to fetch existing tags first
      const { data: products, error: fetchError } = await supabase
        .from('partner_products')
        .select('id, name, tags')
        .in('id', productIds)
        .eq('partner_id', partnerId);

      if (fetchError) throw fetchError;
      if (!products) throw new Error('No products found');

      for (const product of products) {
        try {
          const currentTags = product.tags || [];
          let newTags: string[] = [];

          if (update.operation === 'add') {
            newTags = [...new Set([...currentTags, ...update.tags])];
          } else if (update.operation === 'remove') {
            newTags = currentTags.filter(tag => !update.tags.includes(tag));
          }

          const { error: updateError } = await supabase
            .from('partner_products')
            .update({ tags: newTags })
            .eq('id', product.id);

          if (updateError) throw updateError;
          result.success++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            productId: product.id,
            productName: product.name,
            error: error.message
          });
        }
      }
    }
  } catch (error: any) {
    throw new Error(`Bulk tags update failed: ${error.message}`);
  }

  return result;
};

/**
 * Delete multiple products
 */
export const bulkDeleteProducts = async (
  productIds: string[],
  partnerId: string
): Promise<BulkOperationResult> => {
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    // TODO: Check if products are used in active orders/hampers
    // For now, proceed with deletion

    const { error } = await supabase
      .from('partner_products')
      .delete()
      .in('id', productIds)
      .eq('partner_id', partnerId);

    if (error) throw error;
    result.success = productIds.length;
  } catch (error: any) {
    result.failed = productIds.length;
    throw new Error(`Bulk delete failed: ${error.message}`);
  }

  return result;
};

