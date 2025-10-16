import { supabase, isAuthenticated } from './supabase-client';

// Type definitions
export interface Partner {
  id: string;
  name: string;
  image: string;
  rating: number;
  delivery: string;
  badge?: 'bestseller' | 'trending';
  location?: string;
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
  partner_id: string;
  specs?: any;
  add_ons?: any[];
}

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addOns?: any[];
}

export interface WishlistItemData {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  badge?: 'bestseller' | 'trending';
}

// Mock data fallbacks
const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Premium Gifts Co',
    image: '/placeholder.svg',
    rating: 4.5,
    delivery: '1-2 days',
    badge: 'bestseller',
  },
  {
    id: '2',
    name: 'Artisan Hampers',
    image: '/placeholder.svg',
    rating: 4.7,
    delivery: '2-3 days',
    badge: 'trending',
  },
  {
    id: '3',
    name: 'Sweet Delights',
    image: '/placeholder.svg',
    rating: 4.6,
    delivery: '1-2 days',
  },
  {
    id: '4',
    name: 'Custom Crafts',
    image: '/placeholder.svg',
    rating: 4.8,
    delivery: '3-5 days',
    badge: 'bestseller',
  },
  {
    id: '5',
    name: 'Gourmet Treats',
    image: '/placeholder.svg',
    rating: 4.4,
    delivery: '1-2 days',
  },
  {
    id: '6',
    name: 'Luxury Hampers',
    image: '/placeholder.svg',
    rating: 4.9,
    delivery: '2-3 days',
    badge: 'trending',
  },
];

const mockItems: Item[] = [
  {
    id: '1',
    name: 'Premium Gift Hamper',
    description: 'Curated selection of premium items including gourmet treats, artisan chocolates, and luxury accessories. Perfect for any special occasion.',
    image: '/placeholder.svg',
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    price: 2499,
    rating: 4.6,
    badge: 'bestseller',
    partner_id: '1',
    specs: {
      weight: '2.5 kg',
      dimensions: '30cm x 20cm x 15cm',
      materials: 'Premium packaging with satin finish',
    },
  },
  {
    id: '2',
    name: 'Artisan Chocolate Box',
    description: 'Hand-crafted chocolates made with premium Belgian cocoa. Delightful flavors that melt in your mouth.',
    image: '/placeholder.svg',
    images: ['/placeholder.svg', '/placeholder.svg'],
    price: 1299,
    rating: 4.8,
    badge: 'trending',
    partner_id: '1',
  },
  {
    id: '3',
    name: 'Custom Photo Frame',
    description: 'Personalized photo frame with custom engraving. Perfect for capturing special memories.',
    image: '/placeholder.svg',
    price: 899,
    rating: 4.5,
    partner_id: '1',
  },
  {
    id: '4',
    name: 'Luxury Perfume Set',
    description: 'Premium fragrance collection from renowned brands. Elegant packaging for gifting.',
    image: '/placeholder.svg',
    price: 3999,
    rating: 4.7,
    partner_id: '1',
  },
  {
    id: '5',
    name: 'Gourmet Snack Basket',
    description: 'Curated selection of international and local gourmet snacks. Perfect for food lovers.',
    image: '/placeholder.svg',
    price: 1799,
    rating: 4.4,
    partner_id: '1',
  },
  {
    id: '6',
    name: 'Wireless Earbuds',
    description: 'Premium wireless earbuds with noise cancellation. Perfect gift for music lovers.',
    image: '/placeholder.svg',
    price: 4999,
    rating: 4.9,
    badge: 'bestseller',
    partner_id: '1',
  },
];

// Data fetching functions
export const fetchPartners = async (location?: string): Promise<Partner[]> => {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn('Supabase fetch failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockPartners;
};

export const fetchPartnerById = async (id: string): Promise<Partner | null> => {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) return data;
  } catch (error) {
    console.warn('Supabase fetch failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockPartners.find(p => p.id === id) || mockPartners[0];
};

export const fetchItemsByPartner = async (partnerId: string): Promise<Item[]> => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('partner_id', partnerId)
      .order('rating', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn('Supabase fetch failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockItems;
};

export const fetchItemById = async (id: string): Promise<Item | null> => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (data) return data;
  } catch (error) {
    console.warn('Supabase fetch failed, using mock data:', error);
  }
  
  // Fallback to mock data
  return mockItems.find(i => i.id === id) || mockItems[0];
};

export const fetchCartItems = async (): Promise<CartItemData[]> => {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    // Return empty for guests (they use localStorage)
    return [];
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.id,
        name: item.product_name || 'Product',
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || '/placeholder.svg',
        addOns: item.add_ons || [],
      }));
    }
  } catch (error) {
    console.warn('Supabase cart fetch failed:', error);
  }
  
  return [];
};

export const addToCartSupabase = async (item: CartItemData): Promise<boolean> => {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('cart_items')
      .insert({
        user_id: user.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        add_ons: item.addOns,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to add to Supabase cart:', error);
    return false;
  }
};

export const updateCartItemSupabase = async (itemId: string, quantity: number): Promise<boolean> => {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update cart item:', error);
    return false;
  }
};

export const removeCartItemSupabase = async (itemId: string): Promise<boolean> => {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to remove cart item:', error);
    return false;
  }
};

export const fetchWishlistItems = async (): Promise<WishlistItemData[]> => {
  const authenticated = await isAuthenticated();
  if (!authenticated) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*, items(*)')
      .eq('user_id', user.id);

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.items?.id || item.id,
        name: item.items?.name || 'Product',
        image: item.items?.image || '/placeholder.svg',
        price: item.items?.price || 0,
        rating: item.items?.rating || 4.5,
        badge: item.items?.badge,
      }));
    }
  } catch (error) {
    console.warn('Supabase wishlist fetch failed:', error);
  }
  
  return [];
};

export const addToWishlistSupabase = async (itemId: string): Promise<boolean> => {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('wishlist_items')
      .insert({
        user_id: user.id,
        item_id: itemId,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    return false;
  }
};

export const removeFromWishlistSupabase = async (itemId: string): Promise<boolean> => {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', itemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to remove from wishlist:', error);
    return false;
  }
};

// Mock data getters (for fallback)
export const getMockPartners = () => mockPartners;
export const getMockItems = () => mockItems;

