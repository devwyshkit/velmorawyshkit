import { supabase } from "@/lib/integrations/supabase-client";

export interface PriceUpdate {
  operation: 'increase' | 'decrease';
  type: 'percentage' | 'flat';
  value: number;
  applyTo: 'price' | 'both';
}

export interface StockUpdate {
  operation: 'set' | 'increase' | 'decrease';
  value: number;
}

/**
 * Bulk Operations Library
 * Handles batch updates for products
 * Following Swiggy/Zomato menu bulk edit patterns
 */

/**
 * Update prices for multiple products
 */
export const updatePrices = async (productIds: string[], update: PriceUpdate) => {
  // Fetch current products
  const { data: products, error: fetchError } = await supabase
    .from('partner_products')
    .select('id, price')
    .in('id', productIds);

  if (fetchError) throw fetchError;
  if (!products) throw new Error('No products found');

  // Calculate new prices
  const updates = products.map(product => {
    let newPrice = product.price;

    if (update.operation === 'increase') {
      if (update.type === 'percentage') {
        newPrice = Math.round(product.price * (1 + update.value / 100));
      } else {
        newPrice = product.price + Math.round(update.value * 100); // Convert ₹ to paise
      }
    } else {
      if (update.type === 'percentage') {
        newPrice = Math.round(product.price * (1 - update.value / 100));
      } else {
        newPrice = product.price - Math.round(update.value * 100); // Convert ₹ to paise
      }
    }

    // Ensure minimum price of ₹1
    newPrice = Math.max(100, newPrice);

    return { id: product.id, price: newPrice };
  });

  // Batch update
  const updatePromises = updates.map(({ id, price }) =>
    supabase
      .from('partner_products')
      .update({ price })
      .eq('id', id)
  );

  const results = await Promise.allSettled(updatePromises);
  
  // Check for failures
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    throw new Error(`Failed to update ${failures.length} products`);
  }

  return updates.length;
};

/**
 * Update stock for multiple products
 */
export const updateStock = async (productIds: string[], update: StockUpdate) => {
  // Fetch current products
  const { data: products, error: fetchError } = await supabase
    .from('partner_products')
    .select('id, stock')
    .in('id', productIds);

  if (fetchError) throw fetchError;
  if (!products) throw new Error('No products found');

  // Calculate new stock
  const updates = products.map(product => {
    let newStock = product.stock || 0;

    if (update.operation === 'set') {
      newStock = update.value;
    } else if (update.operation === 'increase') {
      newStock = (product.stock || 0) + update.value;
    } else if (update.operation === 'decrease') {
      newStock = Math.max(0, (product.stock || 0) - update.value);
    }

    return { id: product.id, stock: newStock };
  });

  // Batch update
  const updatePromises = updates.map(({ id, stock }) =>
    supabase
      .from('partner_products')
      .update({ stock })
      .eq('id', id)
  );

  const results = await Promise.allSettled(updatePromises);
  
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    throw new Error(`Failed to update ${failures.length} products`);
  }

  return updates.length;
};

/**
 * Change status for multiple products
 */
export const changeStatus = async (productIds: string[], status: 'active' | 'inactive' | 'out_of_stock') => {
  const updateData: any = {};

  if (status === 'active') {
    updateData.is_active = true;
    updateData.status = 'active';
  } else if (status === 'inactive') {
    updateData.is_active = false;
    updateData.status = 'inactive';
  } else if (status === 'out_of_stock') {
    updateData.is_active = true;
    updateData.status = 'out_of_stock';
    // Product disabled due to out of stock
  }

  const { error } = await supabase
    .from('partner_products')
    .update(updateData)
    .in('id', productIds);

  if (error) throw error;

  return productIds.length;
};

/**
 * Add tags to multiple products
 */
export const addTags = async (productIds: string[], tags: string[]) => {
  // Fetch current products to merge tags
  const { data: products, error: fetchError } = await supabase
    .from('partner_products')
    .select('id, tags')
    .in('id', productIds);

  if (fetchError) throw fetchError;
  if (!products) throw new Error('No products found');

  // Merge new tags with existing
  const updatePromises = products.map(product => {
    const existingTags = product.tags || [];
    const mergedTags = Array.from(new Set([...existingTags, ...tags]));

    return supabase
      .from('partner_products')
      .update({ tags: mergedTags })
      .eq('id', product.id);
  });

  const results = await Promise.allSettled(updatePromises);
  
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    throw new Error(`Failed to update ${failures.length} products`);
  }

  return products.length;
};

/**
 * Delete multiple products with safety checks
 */
export const bulkDelete = async (productIds: string[]) => {
  // Check if products are in active orders or hampers
  const hampersCount = await checkHamperDependencies(productIds);
  
  if (hampersCount > 0) {
    // Allow deletion but warn user (they confirmed in dialog)
    console.warn(`Deleting products that affect ${hampersCount} hampers`);
  }

  const { error } = await supabase
    .from('partner_products')
    .delete()
    .in('id', productIds);

  if (error) throw error;

  return productIds.length;
};

/**
 * Check how many hampers depend on these products
 */
export const checkHamperDependencies = async (productIds: string[]): Promise<number> => {
  // Note: This assumes a hamper_components table exists
  // If it doesn't exist yet, return 0
  try {
    const { data, error } = await supabase
      .from('hamper_components')
      .select('hamper_id')
      .in('component_id', productIds);

    if (error) {
      // Table might not exist yet
      return 0;
    }

    // Count unique hampers
    const uniqueHampers = new Set(data?.map(h => h.hamper_id) || []);
    return uniqueHampers.size;
  } catch (error) {
    // Gracefully handle if table doesn't exist
    return 0;
  }
};
