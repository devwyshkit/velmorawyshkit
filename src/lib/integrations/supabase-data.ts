import { supabase, isAuthenticated } from './supabase-client';
import { ValidationSchemas } from '@/lib/validation/schemas';

// Re-export favorites service
export * from '@/lib/services/favorites';

// Backend only - no mock auth

// Type definitions
export interface Store {
  id: string;
  name: string;
  image: string;
  rating: number;
  delivery: string;
  badge?: 'bestseller' | 'trending';
  location?: string;
  category?: string;  // "Tech Gifts", "Gourmet", etc.
  tagline?: string;   // "Premium tech products"
  ratingCount?: number; // 156
  sponsored?: boolean; // Promoted/sponsored store
  status?: 'pending' | 'approved' | 'rejected';  // Store approval status
  is_active?: boolean;  // Store can self-disable
  startingPrice?: number; // Starting price from cheapest item
}

export interface Item {
  id: string;
  name: string;
  description: string;
  image: string;
  images?: string[];
  price: number;
  rating: number;
  badge?: 'bestseller' | 'trending';
  store_id: string;
  specs?: Record<string, string>;
  add_ons?: Array<{ id: string; name: string; price: number }>;
  ratingCount?: number; // 156
  shortDesc?: string; // 3-line benefits for card display (emotional appeal)
  sponsored?: boolean; // Promoted/sponsored item
  isCustomizable?: boolean; // Supports branding/customization (distributor-handled)
  estimatedDeliveryDays?: string; // ETA display (e.g., "3-5 days")
  components?: string[]; // For hampers: list of included items
  mrp?: number; // Maximum retail price for discount display
  variants?: {
    sizes?: Array<{ id: string; label: string; available: boolean }>;
    colors?: Array<{ id: string; name: string; hex: string }>;
  };
  personalizations?: Array<{ id: string; label: string; price: number; instructions?: string }>;
  preparationTime?: string; // Ready in: X hours/days
  deliveryTime?: string; // Delivery: X days
  campaignDiscount?: { type: 'percentage' | 'flat'; value: number }; // Discount badge
  moq?: number; // Minimum order quantity
  eta?: string; // Delivery ETA (legacy alias for estimatedDeliveryDays)
}

export interface CartItemData {
  id: string; // cart_item.id
  item_id?: string; // product item_id (for matching products with cart)
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addOns?: Array<{ id: string; name: string; price: number }>;
  store_id?: string;
  isCustomizable?: boolean; // NEW: Track if item has customizations
  personalizations?: Array<{ id: string; label: string; price: number; instructions?: string }>; // NEW: Store personalization data
}

export interface SavedItemData {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  badge?: 'bestseller' | 'trending';
}


// ============================================
// NOTE: All mock data has been removed.
// Use Supabase seed data (supabase/seed/) for development.
// All functions now return empty arrays/null when Supabase queries fail.
// ============================================

// Helper function to group stores by delivery time
export const groupStoresByDelivery = (stores: Store[], selectedDate: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const tomorrowStores = stores.filter(p => 
    p.delivery?.includes('1-2') || 
    p.delivery?.includes('Tomorrow') || 
    p.delivery?.includes('Same day') ||
    p.delivery?.includes('Today')
  );
  
  const regionalStores = stores.filter(p => 
    p.delivery?.includes('2-3') || 
    p.delivery?.includes('3-4') || 
    p.delivery?.includes('Regional')
  );
  
  const panIndiaStores = stores.filter(p => 
    p.delivery?.includes('5-7') || 
    p.delivery?.includes('7+') || 
    p.delivery?.includes('Pan-India')
  );
  
  return {
    tomorrow: tomorrowStores,
    regional: regionalStores,
    panIndia: panIndiaStores
  };
};

// Data fetching functions
export const fetchStores = async (location?: string): Promise<Store[]> => {
  try {
    // Swiggy 2025: Only show approved, active stores
    // 2025 Pattern: Parallelize stores and items queries for performance
    const [storesResult, itemsResult] = await Promise.all([
      // Stores query - optimized select (only needed columns)
      supabase
        .from('stores')
        .select('id, name, logo_url, banner_url, rating, delivery_time, city, category, rating_count, status, is_active')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('rating', { ascending: false }),
      
      // Items query - fetch all approved items for pricing calculation
      supabase
        .from('store_items')
        .select('store_id, price')
        .eq('status', 'approved')
        .eq('is_active', true),
    ]);

    const { data: storesData, error: storesError } = storesResult;
    const { data: itemsData } = itemsResult;

    if (storesError) {
      // Silent error handling - return empty array (Swiggy 2025 pattern)
      return [];
    }

    if (!storesData || storesData.length === 0) {
      return [];
    }

    // Group items by store_id and calculate starting price
    const itemsByStore = new Map<string, number[]>();
    if (itemsData) {
      itemsData.forEach((item: any) => {
        if (!itemsByStore.has(item.store_id)) {
          itemsByStore.set(item.store_id, []);
        }
        itemsByStore.get(item.store_id)!.push(Number(item.price));
      });
    }

    // Map stores to Store interface with starting prices
    return storesData.map(p => {
      const storeItems = itemsByStore.get(p.id) || [];
      const startingPrice = storeItems.length > 0 
        ? Math.min(...storeItems)
        : 299; // Default fallback price
      
      return {
        id: p.id,
        name: p.name,
        image: p.logo_url || p.banner_url || 'https://picsum.photos/seed/store/400/400',
        rating: Number(p.rating) || 4.5,
        delivery: p.delivery_time || '3-5 days',
        location: p.city,
        category: p.category,
        ratingCount: p.rating_count || 100,
        startingPrice,
        status: p.status,
        is_active: p.is_active,
      };
    });
  } catch (error) {
    // Silent error handling - return empty array (Swiggy 2025 pattern)
    return [];
  }
};

export const fetchStoreById = async (id: string): Promise<Store | null> => {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) return {
      id: data.id,
      name: data.name,
      image: data.logo_url || data.banner_url || '',
      rating: data.rating || 0,
      delivery: data.delivery_time || '',
      location: data.city,
      category: data.category,
      ratingCount: data.rating_count || 0,
    };
  } catch (error) {
    // Silent error handling (Swiggy 2025 pattern)
  }
  
  return null;
};

export const fetchItemsByStore = async (storeId: string): Promise<Item[]> => {
  try {
    // Swiggy 2025: Only show approved, active items
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    // Silent error handling (Swiggy 2025 pattern)
  }
  
  return [];
};


export const fetchItemById = async (id: string): Promise<Item | null> => {
  try {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) return data;
  } catch (error) {
    // Silent error handling (Swiggy 2025 pattern)
  }
  
  return null;
};

export const fetchCartItems = async (): Promise<CartItemData[]> => {
  // Mock mode: Use localStorage cart
  const { isMockModeEnabled } = await import('@/lib/mock-mode');
    const { getCartItems } = await import('@/lib/mock-cart');
  
  if (isMockModeEnabled()) {
    const mockItems = getCartItems();
    return mockItems.map(item => ({
      id: item.id,
      item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      addOns: item.personalizations || [],
      store_id: item.store_id,
    }));
  }

  // Backend only - require authentication
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return []; // Empty cart for unauthenticated users
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        item_id,
        store_id,
        quantity,
        unit_price,
        personalizations,
        store_items (
          name,
          image_url,
          images,
          price,
          customization_options
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.id, // cart_item.id
        item_id: item.item_id, // product item_id (for matching)
        name: item.store_items?.name || 'Product',
        price: item.unit_price || 0,
        quantity: item.quantity || 1,
        image: item.store_items?.image_url || item.store_items?.images?.[0] || '/placeholder.svg',
        addOns: item.personalizations || [],
        store_id: item.store_id,
      }));
    }
    
    return [];
  } catch (error) {
    // Silent error handling - return empty array (Swiggy 2025 pattern)
    return [];
  }
};

export const addToCartSupabase = async (item: CartItemData): Promise<boolean> => {
  // Mock mode: Use localStorage cart
  const { isMockModeEnabled } = await import('@/lib/mock-mode');
  const { addToMockCart } = await import('@/lib/mock-cart');
  
  if (isMockModeEnabled()) {
    return addToMockCart(item);
  }

  // Backend only - require authentication
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Please login to add items to cart');
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not found');
    }

    const unitPrice = item.price;
    const totalPrice = unitPrice * (item.quantity || 1);

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_id', item.id)
      .eq('store_id', item.store_id!)
      .single();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + (item.quantity || 1);
      const newTotalPrice = unitPrice * newQuantity;
      
      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity: newQuantity,
          total_price: newTotalPrice 
        })
        .eq('id', existingItem.id);

      if (error) throw error;
    } else {
      // Insert new item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          item_id: item.id,
          store_id: item.store_id!,
          quantity: item.quantity || 1,
          personalizations: item.addOns || [],
          unit_price: unitPrice,
          total_price: totalPrice,
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    // Re-throw error for caller to handle (Swiggy 2025 pattern: silent at low level)
    throw error;
  }
};

export const updateCartItemSupabase = async (itemId: string, quantity: number): Promise<boolean> => {
  // Mock mode: Use localStorage cart
  const { isMockModeEnabled } = await import('@/lib/mock-mode');
  const { updateMockCartQuantity } = await import('@/lib/mock-cart');
  
  if (isMockModeEnabled()) {
    return updateMockCartQuantity(itemId, quantity);
  }

  // Backend only - require authentication
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Please login to update cart');
  }

  try {
    // Fetch current unit_price to recalculate total_price
    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('unit_price')
      .eq('id', itemId)
      .single();

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    const totalPrice = cartItem.unit_price * quantity;

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity, total_price: totalPrice })
      .eq('id', itemId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    // Re-throw error for caller to handle (Swiggy 2025 pattern: silent at low level)
    throw error;
  }
};

export const removeCartItemSupabase = async (itemId: string): Promise<boolean> => {
  // Mock mode: Use localStorage cart
  const { isMockModeEnabled } = await import('@/lib/mock-mode');
  const { removeFromMockCart } = await import('@/lib/mock-cart');
  
  if (isMockModeEnabled()) {
    return removeFromMockCart(itemId);
  }

  // Backend only - require authentication
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Please login to remove cart item');
  }

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    // Re-throw error for caller to handle (Swiggy 2025 pattern: silent at low level)
    throw error;
  }
};

// Alias for consistency with other naming patterns
export const removeFromCartSupabase = removeCartItemSupabase;

// Helper function to remove cart item by product ID and store ID (Swiggy 2025 pattern)
export const removeCartItemByProductId = async (itemId: string, storeId: string): Promise<boolean> => {
  // Backend only - require authentication
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    throw new Error('Please login to remove cart item');
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not found');
    }

    // Find cart item by item_id and store_id
    const { data: cartItem, error: findError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .eq('store_id', storeId)
      .single();

    if (findError) {
      // Item not in cart - not an error, return success
      if (findError.code === 'PGRST116') {
        return true;
      }
      throw findError;
    }

    if (!cartItem) {
      return true; // Item not found - already removed
    }

    // Remove by cart_item ID
    return await removeCartItemSupabase(cartItem.id);
  } catch (error) {
    // Re-throw error for caller to handle
    throw error;
  }
};

// Note: fetchSavedItems, addToSavedItemsSupabase, removeFromSavedItemsSupabase
// are now provided by the favorites service (exported via line 5)

// Search functions using Postgres Full-Text Search
// Search suggestions (autocomplete) from backend - Swiggy 2025 pattern
export const getSearchSuggestions = async (
  query: string,
  userId?: string | null,
  sessionId?: string
): Promise<Array<{
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'product' | 'category';
  count?: number;
}>> => {
  if (!query || query.trim().length < 1) {
    // Return recent + trending when no query
    try {
      const { data, error } = await supabase.rpc('get_search_suggestions', {
        p_query: '',
        p_user_id: userId || null,
        p_session_id: sessionId || null,
        p_limit: 10
      });
      
      if (error) {
        // RPC function doesn't exist - handle gracefully (Swiggy 2025 pattern)
        // Check for various error codes: PGRST202 (function not found), 404, or any error
        return [];
      }
      return (data || []).map((s: any) => ({
        id: s.id,
        text: s.text,
        type: s.type as 'recent' | 'trending' | 'product' | 'category',
        count: s.count
      }));
    } catch (error: any) {
      // Handle any other errors gracefully (Swiggy 2025 pattern)
      // Silent error handling - return empty array
      return [];
    }
  }

  try {
    const { data, error } = await supabase.rpc('get_search_suggestions', {
      p_query: query.trim(),
      p_user_id: userId || null,
      p_session_id: sessionId || null,
      p_limit: 10
    });
    
    if (error) {
      // RPC function doesn't exist - handle gracefully (Swiggy 2025 pattern)
      // Silent error handling - return empty array
      return [];
    }
    return (data || []).map((s: any) => ({
      id: s.id,
      text: s.text,
      type: s.type as 'recent' | 'trending' | 'product' | 'category',
      count: s.count
    }));
  } catch (error: any) {
    // Handle any other errors gracefully (Swiggy 2025 pattern)
    // Silent error handling - return empty array
    return [];
  }
};

// Save search to history - Swiggy 2025 pattern (sync across devices)
export const saveSearchHistory = async (
  query: string,
  userId?: string | null,
  sessionId?: string,
  metadata?: {
    searchSource?: 'search_bar' | 'voice' | 'autocomplete' | 'trending' | 'recent';
    location?: string;
    resultCount?: number;
    clickedResultId?: string;
  }
): Promise<void> => {
  if (!query || !query.trim()) return;

  try {
    const { error } = await supabase.from('search_history').insert({
      user_id: userId || null,
      query: query.trim(),
      session_id: sessionId || (userId ? null : `session_${Date.now()}`),
      search_source: metadata?.searchSource || 'search_bar',
      location: metadata?.location || null,
      result_count: metadata?.resultCount || 0,
      clicked_result_id: metadata?.clickedResultId || null,
    });

    if (error) throw error;
  } catch (error) {
    // Silent error handling (Swiggy 2025 pattern)
    // Silent fail - search history is non-critical
  }
};

// Get trending searches from backend - Swiggy 2025 pattern (real data, not fake)
export const getTrendingSearches = async (limit: number = 10): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_trending_searches', {
      p_limit: limit,
      p_days: 7
    });
    
    if (error) throw error;
    return (data || []).map((t: any) => t.query);
  } catch (error) {
    // Silent error handling (Swiggy 2025 pattern)
    return [];
  }
};

export const searchItems = async (query: string): Promise<Item[]> => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Swiggy 2025: Only search approved, active items
      // First get approved active stores, then search their items
      const { data: activeStores } = await supabase
        .from('stores')
        .select('id')
        .eq('status', 'approved')
        .eq('is_active', true);
      
      const storeIds = activeStores?.map(s => s.id) || [];
      
      if (storeIds.length === 0) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .in('store_id', storeIds)
        .eq('status', 'approved')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,short_desc.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      
      if (data && data.length > 0) {
        return data;
      }
      
      // If no results, return empty array
      return [];
    } catch (error) {
      lastError = error;
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  // Return empty array if all backend attempts fail
  // Silent error handling after retries (Swiggy 2025 pattern)
  return [];
};

export const searchStores = async (query: string): Promise<Store[]> => {
  if (!query || query.trim().length < 1) {
    return [];
  }

  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Simple search on stores table
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      if (data && data.length > 0) {
        return data.map(p => ({
          id: p.id,
          name: p.name,
          image: p.logo_url || p.banner_url || 'https://picsum.photos/seed/store/400/400',
          rating: p.rating || 4.5,
          delivery: p.delivery_time || '3-5 days',
          location: p.city,
          category: p.category,
          ratingCount: p.rating_count || 100,
        }));
      }
      
      // If no results, return empty array
      return [];
    } catch (error) {
      lastError = error;
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  // Return empty array if all backend attempts fail
  // Silent error handling after retries (Swiggy 2025 pattern)
  return [];
};

// ============================================
// Mock data getters removed - use Supabase seed data instead
// ============================================

// ============================================
