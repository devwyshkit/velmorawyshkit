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
  personalizations?: Array<{ id: string; label: string; price: number; instructions?: string }>;
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
}

export interface SavedItemData {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  badge?: 'bestseller' | 'trending';
}


// Mock data fallbacks (UUIDs match database for seamless fallback)
const mockStores: Store[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Premium Gifts Co',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.6,
    delivery: '1-2 days',
    category: 'Chocolates',
    tagline: 'Artisan chocolates & sweets',
    ratingCount: 156,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Custom Crafts',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.4,
    delivery: '1-2 days',
    category: 'Food & Beverage',
    tagline: 'International gourmet items',
    ratingCount: 98,
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Luxury Hampers',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.9,
    delivery: '2-3 days',
    badge: 'trending',
    category: 'Premium',
    tagline: 'Luxury gift collections',
    ratingCount: 276,
  },
    // New stores with ratingCount < 50 for "New Launches" section
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Sweet Delights Bakery',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.5,
    delivery: '1-2 days',
    location: 'Delhi',
    category: 'Chocolates & Sweets',
    tagline: 'Artisan chocolates and gourmet sweets',
    ratingCount: 32,
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Flower Boutique',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.7,
    delivery: 'Same day',
    location: 'Pune',
    category: 'Flowers',
    tagline: 'Fresh flowers for every occasion',
    ratingCount: 28,
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    name: 'Tech Gift Hub',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.4,
    delivery: '3-5 days',
    location: 'Hyderabad',
    category: 'Tech Gifts',
    tagline: 'Latest gadgets and tech accessories',
    ratingCount: 45,
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Gourmet Treats Box',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.3,
    delivery: '2-3 days',
    location: 'Kolkata',
    category: 'Food & Beverage',
    tagline: 'Curated gourmet selections',
    ratingCount: 18,
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'Books & Beyond',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    rating: 4.6,
    delivery: '3-4 days',
    location: 'Delhi',
    category: 'Books',
    tagline: 'Curated book collections',
    ratingCount: 25,
  },
];

const mockItems: Item[] = [
  {
    id: '00000000-0000-0000-0001-000000000001',
    name: 'Premium Gift Hamper',
    description: 'Curated selection of premium items including gourmet treats, artisan chocolates, and luxury accessories. Perfect for any special occasion.',
    shortDesc: 'Premium treats & chocolates for special occasions – ideal for corporate gifting and celebrations',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1606800052052-a08af7148866?w=400&h=400&fit=crop'],
    price: 2499,
    rating: 4.6,
    ratingCount: 234,
    store_id: '00000000-0000-0000-0000-000000000001',
    sponsored: true,
    mrp: 2999,
    personalizations: [
      { id: 'card', label: 'Greeting Card', price: 99, instructions: 'Add a personalized message' },
      { id: 'wrap', label: 'Premium Gift Wrap', price: 149, instructions: 'Elegant wrapping with ribbon' },
      { id: 'express', label: 'Express Delivery', price: 199, instructions: 'Delivery within 24 hours' }
    ],
    preparationTime: '2-3 hours',
    deliveryTime: '3-5 days',
    isCustomizable: true,
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop'],
    price: 1299,
    rating: 4.8,
    ratingCount: 189,
    badge: 'trending',
    store_id: '00000000-0000-0000-0000-000000000001',
    mrp: 1499,
    variants: {
      sizes: [
        { id: 'small', label: 'Small (12 pcs)', available: true },
        { id: 'medium', label: 'Medium (24 pcs)', available: true },
        { id: 'large', label: 'Large (36 pcs)', available: false }
      ]
    },
    preparationTime: '1-2 hours',
    deliveryTime: '1-2 days',
  },
  {
    id: '00000000-0000-0000-0001-000000000003',
    name: 'Custom Photo Frame',
    description: 'Personalized photo frame with custom engraving. Perfect for capturing special memories.',
    shortDesc: 'Personalized frame for cherished memories – custom engraving available',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    price: 899,
    rating: 4.5,
    ratingCount: 98,
    store_id: '00000000-0000-0000-0000-000000000001',
    mrp: 1199,
    variants: {
      colors: [
        { id: 'black', name: 'Black', hex: '#000000' },
        { id: 'white', name: 'White', hex: '#FFFFFF' },
        { id: 'gold', name: 'Gold', hex: '#FFD700' },
        { id: 'silver', name: 'Silver', hex: '#C0C0C0' }
      ]
    },
    personalizations: [
      { id: 'engrave', label: 'Custom Engraving', price: 299, instructions: 'Add name or message (max 50 chars)' }
    ],
    preparationTime: '3-5 days',
    deliveryTime: '5-7 days',
    isCustomizable: true,
  },
  {
    id: '00000000-0000-0000-0001-000000000004',
    name: 'Luxury Perfume Set',
    description: 'Premium fragrance collection from renowned brands. Elegant packaging for gifting.',
    shortDesc: 'Premium fragrances in elegant packaging – perfect for special occasions',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    price: 3999,
    rating: 4.7,
    ratingCount: 167,
    store_id: '00000000-0000-0000-0000-000000000001',
    sponsored: true,
  },
  {
    id: '00000000-0000-0000-0001-000000000005',
    name: 'Gourmet Snack Cart',
    description: 'Curated selection of international and local gourmet snacks. Perfect for food lovers.',
    shortDesc: 'International snacks for food enthusiasts – exotic flavors from around the world',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    price: 1799,
    rating: 4.4,
    ratingCount: 124,
    store_id: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '00000000-0000-0000-0001-000000000006',
    name: 'Wireless Earbuds',
    description: 'Premium wireless earbuds with noise cancellation. Perfect gift for music lovers.',
    shortDesc: 'Wireless audio for music lovers – noise cancellation and premium sound quality',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    price: 4999,
    rating: 4.9,
    ratingCount: 312,
    badge: 'bestseller',
    store_id: '00000000-0000-0000-0000-000000000001',
  },
];

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
  
  // Fallback to mock data with starting prices
  return mockStores.map(p => ({
    ...p,
    startingPrice: p.startingPrice || 299
  }));
};

export const fetchStoreById = async (id: string): Promise<Store | null> => {
  // Map simple numeric IDs to mock data
  if (id === '1' || id === '2' || id === '3' || id === '4' || id === '5' || id === '6' || id === '7' || id === '8') {
    // Return corresponding mock store based on ID
    const mockIndex = parseInt(id) - 1;
    if (mockIndex >= 0 && mockIndex < mockStores.length) {
      return mockStores[mockIndex];
    }
  }
  
  // Check if ID is UUID format (for Supabase) or simple ID (for mock data)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (isUUID) {
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
      // Handle database errors silently
      console.error('Error fetching store:', error);
    }
  }
  
  // Fallback to mock data for non-UUID or failed lookups
  return mockStores.find(p => p.id === id) || mockStores[0];
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
    // Handle error silently in production
  }
  
  // Fallback to mock data
  return mockItems;
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
    // Handle error silently in production
  }
  
  // Fallback to mock data
  return mockItems.find(i => i.id === id) || mockItems[0];
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
export const searchItems = async (query: string): Promise<Item[]> => {
  if (!query || query.trim().length < 2) {
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
  
  // Fallback to client-side search if all backend attempts fail
  // Fallback to client-side search
  return mockItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.shortDesc?.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchStores = async (query: string): Promise<Store[]> => {
  if (!query || query.trim().length < 2) {
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
  
  // Fallback to client-side search
  return mockStores.filter(store =>
    store.name.toLowerCase().includes(query.toLowerCase()) ||
    store.tagline?.toLowerCase().includes(query.toLowerCase()) ||
    store.category?.toLowerCase().includes(query.toLowerCase())
  );
};

// Mock data getters (for fallback)
export const getMockStores = () => mockStores;
export const getMockItems = () => mockItems;

// ============================================
