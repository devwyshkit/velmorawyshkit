/**
 * Test Helpers for Wyshkit
 * Utilities to assist with testing workflows
 */

import { supabase } from "@/lib/integrations/supabase-client";

/**
 * Create a test store for a user
 */
export const createTestStore = async (userId: string, slug: string = 'test-store') => {
  // First ensure partner profile exists
  const { data: profile, error: profileError } = await supabase
    .from('partner_profiles')
    .upsert({
      user_id: userId,
      business_name: 'Test Store',
      owner_name: 'Test Owner',
      phone: '+919740803490',
      email: 'test@wyshkit.com',
      status: 'approved',
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (profileError && profileError.code !== '23505') {
    throw profileError;
  }

  // Create store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .upsert({
      owner_id: userId,
      name: 'Test Store',
      slug: slug,
      status: 'active',
    }, {
      onConflict: 'slug'
    })
    .select()
    .single();

  if (storeError) throw storeError;

  return { store, profile };
};

/**
 * Create a test product
 */
export const createTestProduct = async (
  storeId: string,
  options: {
    name?: string;
    status?: 'pending' | 'approved' | 'rejected';
    isCustomizable?: boolean;
    hasPersonalizations?: boolean;
  } = {}
) => {
  const {
    name = 'Test Product',
    status = 'pending',
    isCustomizable = false,
    hasPersonalizations = false,
  } = options;

  const personalizations = hasPersonalizations ? [
    {
      id: 'test-logo',
      label: 'Company Logo',
      price: 20000, // ₹200 in paise
      instructions: 'Upload PNG/SVG format',
    },
    {
      id: 'test-card',
      label: 'Greeting Card',
      price: 5000, // ₹50 in paise
      instructions: 'Custom message',
    },
  ] : null;

  const slug = name.toLowerCase().replace(/\s+/g, '-');

  const { data: product, error } = await supabase
    .from('store_items')
    .insert({
      store_id: storeId,
      name,
      slug,
      description: 'Test product description',
      short_desc: 'Test short description',
      price: 100000, // ₹1000 in paise
      category: 'Electronics',
      image_url: 'https://via.placeholder.com/400x400',
      images: ['https://via.placeholder.com/400x400'],
      is_customizable: isCustomizable,
      personalizations: personalizations ? JSON.stringify(personalizations) : null,
      moq: 1,
      stock_quantity: 50,
      is_active: true,
      status,
    })
    .select()
    .single();

  if (error) throw error;

  return product;
};

/**
 * Clean up test data
 */
export const cleanupTestData = async (storeSlug: string) => {
  // Get store ID
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', storeSlug)
    .single();

  if (!store) return;

  // Delete products
  await supabase
    .from('store_items')
    .delete()
    .eq('store_id', store.id);

  // Delete store
  await supabase
    .from('stores')
    .delete()
    .eq('slug', storeSlug);
};

/**
 * Verify product structure
 */
export const verifyProductStructure = (product: any) => {
  const errors: string[] = [];

  // Check required fields
  if (!product.id) errors.push('Missing id');
  if (!product.store_id) errors.push('Missing store_id');
  if (!product.name) errors.push('Missing name');
  if (!product.status) errors.push('Missing status');
  if (!product.price) errors.push('Missing price');

  // Check status values
  const validStatuses = ['pending', 'approved', 'rejected', 'changes_requested'];
  if (!validStatuses.includes(product.status)) {
    errors.push(`Invalid status: ${product.status}`);
  }

  // Check personalizations structure
  if (product.is_customizable && product.personalizations) {
    if (!Array.isArray(product.personalizations)) {
      errors.push('personalizations must be an array');
    } else {
      product.personalizations.forEach((p: any, idx: number) => {
        if (!p.id) errors.push(`personalizations[${idx}] missing id`);
        if (!p.label) errors.push(`personalizations[${idx}] missing label`);
        if (typeof p.price !== 'number') errors.push(`personalizations[${idx}] price must be number`);
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get pending products count for admin
 */
export const getPendingProductsCount = async () => {
  const { count, error } = await supabase
    .from('store_items')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'changes_requested']);

  if (error) throw error;

  return count || 0;
};

/**
 * Get partner's products count
 */
export const getPartnerProductsCount = async (userId: string) => {
  // Get store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (!store) return 0;

  const { count, error } = await supabase
    .from('store_items')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', store.id);

  if (error) throw error;

  return count || 0;
};

