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
  category?: string;  // "Tech Gifts", "Gourmet", etc.
  tagline?: string;   // "Premium tech products"
  ratingCount?: number; // 156
  sponsored?: boolean; // Promoted/sponsored partner
  status?: 'pending' | 'approved' | 'rejected';  // Partner approval status
  is_active?: boolean;  // Partner can self-disable
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
  specs?: Record<string, string>;
  add_ons?: Array<{ id: string; name: string; price: number }>;
  ratingCount?: number; // 156
  shortDesc?: string; // 3-line benefits for card display (emotional appeal)
  sponsored?: boolean; // Promoted/sponsored item
  isCustomizable?: boolean; // Supports branding/customization (distributor-handled)
  estimatedDeliveryDays?: string; // ETA display (e.g., "3-5 days")
  components?: string[]; // For hampers: list of included items
}

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addOns?: Array<{ id: string; name: string; price: number }>;
  partner_id?: string;
}

export interface WishlistItemData {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  badge?: 'bestseller' | 'trending';
}

// Mock data fallbacks (UUIDs match database for seamless fallback)
const mockPartners: Partner[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Premium Gifts Co',
    image: 'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=400&h=400&fit=crop',
    rating: 4.5,
    delivery: '1-2 days',
    category: 'Tech Gifts',
    tagline: 'Premium tech accessories',
    ratingCount: 234,
    sponsored: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Artisan Hampers',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop',
    rating: 4.7,
    delivery: '2-3 days',
    badge: 'trending',
    category: 'Gourmet',
    tagline: 'Curated gift hampers',
    ratingCount: 189,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Sweet Delights',
    image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop',
    rating: 4.6,
    delivery: '1-2 days',
    category: 'Chocolates',
    tagline: 'Artisan chocolates & sweets',
    ratingCount: 156,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Custom Crafts',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop',
    rating: 4.8,
    delivery: '3-5 days',
    badge: 'bestseller',
    category: 'Personalized',
    tagline: 'Custom-made gifts',
    ratingCount: 312,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Gourmet Treats',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
    rating: 4.4,
    delivery: '1-2 days',
    category: 'Food & Beverage',
    tagline: 'International gourmet items',
    ratingCount: 98,
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Luxury Hampers',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop',
    rating: 4.9,
    delivery: '2-3 days',
    badge: 'trending',
    category: 'Premium',
    tagline: 'Luxury gift collections',
    ratingCount: 276,
  },
];

const mockItems: Item[] = [
  {
    id: '00000000-0000-0000-0001-000000000001',
    name: 'Premium Gift Hamper',
    description: 'Curated selection of premium items including gourmet treats, artisan chocolates, and luxury accessories. Perfect for any special occasion.',
    shortDesc: 'Premium treats & chocolates for special occasions – ideal for corporate gifting and celebrations',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=400&fit=crop'],
    price: 2499,
    rating: 4.6,
    ratingCount: 234,
    partner_id: '00000000-0000-0000-0000-000000000001',
    sponsored: true,
    specs: {
      weight: '2.5 kg',
      dimensions: '30cm x 20cm x 15cm',
      materials: 'Premium packaging with satin finish',
    },
  },
  {
    id: '00000000-0000-0000-0001-000000000002',
    name: 'Artisan Chocolate Box',
    description: 'Hand-crafted chocolates made with premium Belgian cocoa. Delightful flavors that melt in your mouth.',
    shortDesc: 'Belgian chocolates perfect for sweet lovers – handcrafted with premium ingredients',
    image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop',
    images: ['https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop'],
    price: 1299,
    rating: 4.8,
    ratingCount: 189,
    badge: 'trending',
    partner_id: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '00000000-0000-0000-0001-000000000003',
    name: 'Custom Photo Frame',
    description: 'Personalized photo frame with custom engraving. Perfect for capturing special memories.',
    shortDesc: 'Personalized frame for cherished memories – custom engraving available',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop',
    price: 899,
    rating: 4.5,
    ratingCount: 98,
    partner_id: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '00000000-0000-0000-0001-000000000004',
    name: 'Luxury Perfume Set',
    description: 'Premium fragrance collection from renowned brands. Elegant packaging for gifting.',
    shortDesc: 'Premium fragrances in elegant packaging – perfect for special occasions',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop',
    price: 3999,
    rating: 4.7,
    ratingCount: 167,
    partner_id: '00000000-0000-0000-0000-000000000001',
    sponsored: true,
  },
  {
    id: '00000000-0000-0000-0001-000000000005',
    name: 'Gourmet Snack Cart',
    description: 'Curated selection of international and local gourmet snacks. Perfect for food lovers.',
    shortDesc: 'International snacks for food enthusiasts – exotic flavors from around the world',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
    price: 1799,
    rating: 4.4,
    ratingCount: 124,
    partner_id: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '00000000-0000-0000-0001-000000000006',
    name: 'Wireless Earbuds',
    description: 'Premium wireless earbuds with noise cancellation. Perfect gift for music lovers.',
    shortDesc: 'Wireless audio for music lovers – noise cancellation and premium sound quality',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    price: 4999,
    rating: 4.9,
    ratingCount: 312,
    badge: 'bestseller',
    partner_id: '00000000-0000-0000-0000-000000000001',
  },
];

// Data fetching functions
export const fetchPartners = async (location?: string): Promise<Partner[]> => {
  try {
    // Query partners table (no status/is_active columns in this table)
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(p => ({
        id: p.id,
        name: p.name,
        image: p.image || 'https://picsum.photos/seed/partner/400/400',
        rating: p.rating || 4.5,
        delivery: p.delivery_time || '3-5 days',
        location: p.location,
        category: p.category,
        ratingCount: 100, // Default until we have actual data
      }));
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
      .from('partner_products')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('approval_status', 'approved')
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
      .from('partner_products')
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
        partner_id: item.partner_id,
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
        partner_id: item.partner_id,
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

// Search functions using Postgres Full-Text Search
export const searchItems = async (query: string): Promise<Item[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Format query for PostgreSQL tsquery (handle spaces, special chars)
    const formattedQuery = query
      .trim()
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 0)
      .join(' | '); // OR operator for better results

    const { data, error } = await supabase
      .rpc('search_items', { search_query: formattedQuery });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    }
  } catch (error) {
    console.warn('Backend search failed, using client-side fallback:', error);
  }
  
  // Fallback to client-side search if backend fails
  return mockItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.shortDesc?.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchPartners = async (query: string): Promise<Partner[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Simple search on partners table
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .order('rating', { ascending: false })
      .limit(20);

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(p => ({
        id: p.id,
        name: p.name,
        image: p.image || 'https://picsum.photos/seed/partner/400/400',
        rating: p.rating || 4.5,
        delivery: p.delivery_time || '3-5 days',
        location: p.location,
        category: p.category,
        ratingCount: 100,
      }));
    }
  } catch (error) {
    console.warn('Backend search failed, using client-side fallback:', error);
  }
  
  // Fallback to client-side search (mock partners are implicitly approved)
  return mockPartners.filter(partner =>
    partner.name.toLowerCase().includes(query.toLowerCase()) ||
    partner.tagline?.toLowerCase().includes(query.toLowerCase()) ||
    partner.category?.toLowerCase().includes(query.toLowerCase())
  );
};

// Mock data getters (for fallback)
export const getMockPartners = () => mockPartners;
export const getMockItems = () => mockItems;

// ============================================
