import { supabase, isAuthenticated } from './supabase-client';
import { ValidationSchemas } from '@/lib/validation/schemas';

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
  // New partners with ratingCount < 50 for "New Launches" section
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+photo-1481391319762-47dff72954d9?w=400&h=400&fit=crop'],
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
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
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE4NS42IDE1MCAxNzQgMTYxLjYgMTc0IDE3NkMxNzQgMTkwLjQgMTg1LjYgMjAyIDE5OSAyMDJDMjEyLjQgMjAyIDIyNCAxOTAuNCAyMjQgMTc2QzIyNCAxNjEuNiAyMTIuNCAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4MCAyMDBMMjAwIDE4MEwyMjAgMjAwTDIwMCAyMjBMMTgwIDIwMFoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+',
    price: 4999,
    rating: 4.9,
    ratingCount: 312,
    badge: 'bestseller',
    partner_id: '00000000-0000-0000-0000-000000000001',
  },
];

// Helper function to group partners by delivery time
export const groupPartnersByDelivery = (partners: Partner[], selectedDate: Date) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const tomorrowPartners = partners.filter(p => 
    p.delivery?.includes('1-2') || 
    p.delivery?.includes('Tomorrow') || 
    p.delivery?.includes('Same day') ||
    p.delivery?.includes('Today')
  );
  
  const regionalPartners = partners.filter(p => 
    p.delivery?.includes('2-3') || 
    p.delivery?.includes('3-4') || 
    p.delivery?.includes('Regional')
  );
  
  const panIndiaPartners = partners.filter(p => 
    p.delivery?.includes('5-7') || 
    p.delivery?.includes('7+') || 
    p.delivery?.includes('Pan-India')
  );
  
  return {
    tomorrow: tomorrowPartners,
    regional: regionalPartners,
    panIndia: panIndiaPartners
  };
};

// Data fetching functions
export const fetchPartners = async (location?: string): Promise<Partner[]> => {
  try {
    // Query partners table with items to calculate starting price
    const { data, error } = await supabase
      .from('partners')
      .select(`
        *,
        items!inner(price)
      `)
      .order('rating', { ascending: false });

    if (error) throw error;
    
    if (data && data.length > 0) {
      return data.map(p => {
        // Calculate starting price from cheapest item
        const startingPrice = p.items && p.items.length > 0 
          ? Math.min(...p.items.map((item: any) => item.price))
          : 299; // Default fallback price
        
        return {
          id: p.id,
          name: p.name,
          image: p.image || 'https://picsum.photos/seed/partner/400/400',
          rating: p.rating || 4.5,
          delivery: p.delivery_time || '3-5 days',
          location: p.location,
          category: p.category,
          ratingCount: 100, // Default until we have actual data
          startingPrice,
        };
      });
    }
  } catch (error) {
    // Handle error silently in production
  }
  
  // Fallback to mock data with starting prices
  return mockPartners.map(p => ({
    ...p,
    startingPrice: p.startingPrice || 299
  }));
};

export const fetchPartnerById = async (id: string): Promise<Partner | null> => {
  // Map simple numeric IDs to mock data
  if (id === '1' || id === '2' || id === '3' || id === '4' || id === '5' || id === '6' || id === '7' || id === '8') {
    // Return corresponding mock partner based on ID
    const mockIndex = parseInt(id) - 1;
    if (mockIndex >= 0 && mockIndex < mockPartners.length) {
      return mockPartners[mockIndex];
    }
  }
  
  // Check if ID is UUID format (for Supabase) or simple ID (for mock data)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (isUUID) {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) return data;
    } catch (error) {
      // Handle database errors silently
      console.error('Error fetching partner:', error);
    }
  }
  
  // Fallback to mock data for non-UUID or failed lookups
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
    // Handle error silently in production
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
    // Handle error silently in production
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
    // Handle error silently in production
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
    // Handle error silently in production
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
    // Handle error silently in production
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
    // Handle error silently in production
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
    // Handle error silently in production
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
    // Handle error silently in production
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
    // Handle error silently in production
    return false;
  }
};

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
        .from('items')
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

export const searchPartners = async (query: string): Promise<Partner[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
