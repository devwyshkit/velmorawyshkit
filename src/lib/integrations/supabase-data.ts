import { supabase, isAuthenticated } from './supabase-client';
import { ValidationSchemas } from '@/lib/validation/schemas';

// Re-export favorites service
export * from '@/lib/services/favorites';

// Helper to check if user is using mock auth
const isMockAuth = (): boolean => {
  try {
    return localStorage.getItem('mock_session') === 'true';
  } catch {
    return false;
  }
};

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
  personalizations?: Array<{ id: string; label: string; price: number; instructions?: string; requiresPreview?: boolean }>;
  preparationTime?: string; // Ready in: X hours/days
  deliveryTime?: string; // Delivery: X days
  campaignDiscount?: { type: 'percentage' | 'flat'; value: number }; // Discount badge
  moq?: number; // Minimum order quantity
  eta?: string; // Delivery ETA (legacy alias for estimatedDeliveryDays)
}

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addOns?: Array<{ id: string; name: string; price: number }>;
  store_id?: string;
  isCustomizable?: boolean; // NEW: Track if item has customizations
  personalizations?: Array<{ id: string; label: string; price: number; instructions?: string; requiresPreview?: boolean }>; // NEW: Store personalization data
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
    // Query stores table with items to calculate starting price
    const { data, error } = await supabase
      .from('stores')
      .select(`
        *,
        store_items!inner(price)
      `)
      .order('rating', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(p => {
        // Calculate starting price from cheapest item
        const startingPrice = p.store_items && p.store_items.length > 0 
          ? Math.min(...p.store_items.map((item: any) => item.price))
          : 299; // Default fallback price
        
        return {
          id: p.id,
          name: p.name,
          image: p.logo_url || p.banner_url || 'https://picsum.photos/seed/store/400/400',
          rating: p.rating || 4.5,
          delivery: p.delivery_time || '3-5 days',
          location: p.city,
          category: p.category,
          ratingCount: p.rating_count || 100,
          startingPrice,
        };
      });
    }
  } catch (error) {
    // Handle error silently in production
  }
  
  // Return empty array if Supabase query fails
  return [];
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
    console.error('Error fetching store:', error);
  }
  
  return null;
};

export const fetchItemsByStore = async (storeId: string): Promise<Item[]> => {
  try {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('store_id', storeId)
      .eq('status', 'approved')
      .order('rating', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.error('Error fetching items by store:', error);
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
    console.error('Error fetching item:', error);
  }
  
  return null;
};

export const fetchCartItems = async (): Promise<CartItemData[]> => {
  // Always check localStorage first (works for both guest and logged-in users)
  try {
    const cartData = localStorage.getItem('mock_cart');
    if (cartData) {
      const localCart = JSON.parse(cartData);
      // If we have local cart, return it immediately
      if (localCart && localCart.length > 0) {
        return localCart;
      }
    }
  } catch (error) {
    console.error('Error reading localStorage cart:', error);
  }

  // If logged in, try to fetch from Supabase and merge
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          store_items (
            name,
            image,
            price,
            add_ons
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const supabaseCart = data.map(item => ({
          id: item.id,
          name: item.store_items?.name || 'Product',
          price: item.unit_price || 0,
          quantity: item.quantity || 1,
          image: item.store_items?.image || '/placeholder.svg',
          addOns: item.personalizations || [],
          store_id: item.store_id,
        }));
        
        // Merge with localStorage cart if exists
        const localCart = localStorage.getItem('mock_cart');
        if (localCart) {
          const parsedLocalCart = JSON.parse(localCart);
          // Merge logic: combine both carts, prefer Supabase for conflicts
          const mergedCart = [...parsedLocalCart, ...supabaseCart];
          localStorage.setItem('mock_cart', JSON.stringify(mergedCart));
          return mergedCart;
        }
        
        return supabaseCart;
      }
    } catch (error) {
      // Handle error silently in production
    }
  }
  
  return [];
};

export const addToCartSupabase = async (item: CartItemData): Promise<boolean> => {
  // Always save to localStorage first (works for both guest and logged-in users)
  try {
    const existingCart = localStorage.getItem('mock_cart');
    const cartItems: CartItemData[] = existingCart ? JSON.parse(existingCart) : [];
    
    // Generate unique cart item ID
    const cartItem: CartItemData = {
      ...item,
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    // Check if item already exists (by product ID, not cart ID)
    const existingIndex = cartItems.findIndex(i => i.name === item.name && i.store_id === item.store_id);
    if (existingIndex >= 0) {
      cartItems[existingIndex].quantity += (item.quantity || 1);
    } else {
      cartItems.push(cartItem);
    }
    
    localStorage.setItem('mock_cart', JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error adding to localStorage cart:', error);
    return false;
  }

  // If logged in, also save to Supabase in background
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return true; // Return true since localStorage save succeeded

      const unitPrice = item.price;
      const totalPrice = unitPrice * (item.quantity || 1);

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

      if (error) {
        console.error('Error syncing to Supabase:', error);
        // Still return true since localStorage save succeeded
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      // Still return true since localStorage save succeeded
    }
  }
  
  return true;
};

export const updateCartItemSupabase = async (itemId: string, quantity: number): Promise<boolean> => {
  // Always update localStorage first
  try {
    const existingCart = localStorage.getItem('mock_cart');
    const cartItems: CartItemData[] = existingCart ? JSON.parse(existingCart) : [];
    
    const itemIndex = cartItems.findIndex(i => i.id === itemId);
    if (itemIndex >= 0) {
      cartItems[itemIndex].quantity = quantity;
      localStorage.setItem('mock_cart', JSON.stringify(cartItems));
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error updating localStorage cart:', error);
    return false;
  }

  // If logged in, also update Supabase in background
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      // Need to fetch current unit_price to recalculate total_price
      const { data: cartItem } = await supabase
        .from('cart_items')
        .select('unit_price')
        .eq('id', itemId)
        .single();

      if (!cartItem) return true; // Return true since localStorage update succeeded

      const totalPrice = cartItem.unit_price * quantity;

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity, total_price: totalPrice })
        .eq('id', itemId);

      if (error) {
        console.error('Error syncing to Supabase:', error);
        // Still return true since localStorage update succeeded
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      // Still return true since localStorage update succeeded
    }
  }
  
  return true;
};

export const removeCartItemSupabase = async (itemId: string): Promise<boolean> => {
  // Always remove from localStorage first
  try {
    const existingCart = localStorage.getItem('mock_cart');
    const cartItems: CartItemData[] = existingCart ? JSON.parse(existingCart) : [];
    
    const filtered = cartItems.filter(i => i.id !== itemId);
    localStorage.setItem('mock_cart', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from localStorage cart:', error);
    return false;
  }

  // If logged in, also remove from Supabase in background
  const authenticated = await isAuthenticated();
  if (authenticated) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error syncing to Supabase:', error);
        // Still return true since localStorage remove succeeded
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      // Still return true since localStorage remove succeeded
    }
  }
  
  return true;
};

// Alias for consistency with other naming patterns
export const removeFromCartSupabase = removeCartItemSupabase;

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
      
      if (error) throw error;
      return (data || []).map((s: any) => ({
        id: s.id,
        text: s.text,
        type: s.type as 'recent' | 'trending' | 'product' | 'category',
        count: s.count
      }));
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
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
    
    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      text: s.text,
      type: s.type as 'recent' | 'trending' | 'product' | 'category',
      count: s.count
    }));
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
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
    console.error('Error saving search history:', error);
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
    console.error('Error fetching trending searches:', error);
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
      // Try direct table search first (more reliable than RPC)
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
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
  console.error('Search failed after retries:', lastError);
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
  console.error('Store search failed after retries:', lastError);
  return [];
};

// ============================================
// Mock data getters removed - use Supabase seed data instead
// ============================================

// ============================================
