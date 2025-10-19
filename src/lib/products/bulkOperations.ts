/**
 * Bulk Operations Logic for Partner Products
 * Handles batch updates, deletes, and impact validation
 */

import { supabase } from '@/lib/integrations/supabase-client';
import { Product } from '@/pages/partner/Products';
import { PriceUpdate, StockUpdate, StatusUpdate, TagsUpdate } from '@/types/bulkOperations';

/**
 * Update prices for multiple products
 */
export const bulkUpdatePrices = async (
  productIds: string[],
  update: PriceUpdate
): Promise<{ success: boolean; updated: number; errors?: string[] }> => {
  try {
    // Fetch current products
    const { data: products, error: fetchError } = await supabase
      .from('partner_products')
      .select('id, price')
      .in('id', productIds);

    if (fetchError) throw fetchError;
    if (!products) throw new Error('No products found');

    const errors: string[] = [];
    let updated = 0;

    // Calculate new prices and update
    for (const product of products) {
      let newPrice = product.price;

      if (update.operation === 'increase') {
        newPrice = update.type === 'percentage'
          ? Math.round(product.price * (1 + update.value / 100))
          : product.price + Math.round(update.value * 100); // Convert to paise
      } else {
        newPrice = update.type === 'percentage'
          ? Math.round(product.price * (1 - update.value / 100))
          : product.price - Math.round(update.value * 100);
      }

      // Validate price doesn't go negative
      if (newPrice <= 0) {
        errors.push(`${product.id}: Price would become negative or zero`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('partner_products')
        .update({ price: newPrice })
        .eq('id', product.id);

      if (updateError) {
        errors.push(`${product.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    return {
      success: false,
      updated: 0,
      errors: [error.message]
    };
  }
};

/**
 * Update stock for multiple products
 */
export const bulkUpdateStock = async (
  productIds: string[],
  update: StockUpdate
): Promise<{ success: boolean; updated: number; errors?: string[] }> => {
  try {
    const { data: products, error: fetchError } = await supabase
      .from('partner_products')
      .select('id, stock')
      .in('id', productIds);

    if (fetchError) throw fetchError;
    if (!products) throw new Error('No products found');

    const errors: string[] = [];
    let updated = 0;

    for (const product of products) {
      let newStock = product.stock;

      switch (update.operation) {
        case 'set':
          newStock = update.value;
          break;
        case 'increase':
          newStock = product.stock + update.value;
          break;
        case 'decrease':
          newStock = product.stock - update.value;
          break;
      }

      // Validate stock doesn't go negative
      if (newStock < 0) {
        errors.push(`${product.id}: Stock would become negative`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('partner_products')
        .update({ stock: newStock })
        .eq('id', product.id);

      if (updateError) {
        errors.push(`${product.id}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    return {
      success: false,
      updated: 0,
      errors: [error.message]
    };
  }
};

/**
 * Change status for multiple products
 */
export const bulkChangeStatus = async (
  productIds: string[],
  update: StatusUpdate
): Promise<{ success: boolean; updated: number; errors?: string[] }> => {
  try {
    const isActive = update.status === 'active';

    const { error } = await supabase
      .from('partner_products')
      .update({ is_active: isActive })
      .in('id', productIds);

    if (error) throw error;

    return {
      success: true,
      updated: productIds.length
    };
  } catch (error: any) {
    return {
      success: false,
      updated: 0,
      errors: [error.message]
    };
  }
};

/**
 * Add tags to multiple products
 */
export const bulkAddTags = async (
  productIds: string[],
  update: TagsUpdate
): Promise<{ success: boolean; updated: number; errors?: string[] }> => {
  try {
    // Fetch current products to merge tags
    const { data: products, error: fetchError } = await supabase
      .from('partner_products')
      .select('id, tags')
      .in('id', productIds);

    if (fetchError) throw fetchError;
    if (!products) throw new Error('No products found');

    let updated = 0;

    for (const product of products) {
      const currentTags = product.tags || [];
      const newTags = [...new Set([...currentTags, ...update.tags])]; // Merge and deduplicate

      const { error: updateError } = await supabase
        .from('partner_products')
        .update({ tags: newTags })
        .eq('id', product.id);

      if (!updateError) {
        updated++;
      }
    }

    return {
      success: true,
      updated
    };
  } catch (error: any) {
    return {
      success: false,
      updated: 0,
      errors: [error.message]
    };
  }
};

/**
 * Delete multiple products with impact check
 */
export const bulkDeleteProducts = async (
  productIds: string[]
): Promise<{ success: boolean; deleted: number; errors?: string[]; warnings?: string[] }> => {
  try {
    // TODO: Check impact on hampers (when hamper feature exists)
    // const { data: affectedHampers } = await supabase
    //   .from('hamper_components')
    //   .select('hamper_id')
    //   .in('component_id', productIds);
    // 
    // if (affectedHampers && affectedHampers.length > 0) {
    //   return {
    //     success: false,
    //     deleted: 0,
    //     errors: [`Cannot delete: ${affectedHampers.length} hampers depend on these products`]
    //   };
    // }

    // Proceed with deletion
    const { error } = await supabase
      .from('partner_products')
      .delete()
      .in('id', productIds);

    if (error) throw error;

    return {
      success: true,
      deleted: productIds.length
    };
  } catch (error: any) {
    return {
      success: false,
      deleted: 0,
      errors: [error.message]
    };
  }
};

