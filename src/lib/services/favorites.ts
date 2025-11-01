/**
 * Favorites Service
 * 
 * Production-ready favorites API following Swiggy pattern.
 * Supports polymorphic favorites (stores + products).
 * 
 * Display: "Favourites" (UK English)
 * Code: "favorites" (US English)
 */

import { supabase } from '@/lib/integrations/supabase-client';
import { isAuthenticated } from '@/lib/integrations/supabase-client';

export type FavoritableType = 'store' | 'product';

export interface Favorite {
  id: string;
  user_id: string;
  favoritable_type: FavoritableType;
  favoritable_id: string;
  created_at: string;
}

export interface FavoriteStore {
  favorite_id: string;
  user_id: string;
  favorited_at: string;
  id: string;
  name: string;
  image: string;
  rating: number;
  delivery: string;
  badge?: 'bestseller' | 'trending';
  category?: string;
  tagline?: string;
  ratingCount?: number;
  sponsored?: boolean;
}

export interface FavoriteProduct {
  favorite_id: string;
  user_id: string;
  favorited_at: string;
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  badge?: 'bestseller' | 'trending';
  ratingCount?: number;
  sponsored?: boolean;
}

/**
 * Fetch all favorites for current user
 */
export async function fetchFavorites(): Promise<Favorite[]> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return [];

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
    return [];
  }
}

/**
 * Fetch favorite stores
 */
export async function fetchFavoriteStores(): Promise<FavoriteStore[]> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return [];

  try {
    const { data, error } = await supabase
      .from('favorite_stores')
      .select('*')
      .order('favorited_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch favorite stores:', error);
    return [];
  }
}

/**
 * Fetch favorite products
 */
export async function fetchFavoriteProducts(): Promise<FavoriteProduct[]> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return [];

  try {
    const { data, error } = await supabase
      .from('favorite_products')
      .select('*')
      .order('favorited_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch favorite products:', error);
    return [];
  }
}

/**
 * Add to favorites
 */
export async function addToFavorites(
  type: FavoritableType,
  id: string
): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { error } = await supabase
      .from('favorites')
      .insert({
        favoritable_type: type,
        favoritable_id: id,
      });

    return !error;
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return false;
  }
}

/**
 * Remove from favorites
 */
export async function removeFromFavorites(
  type: FavoritableType,
  id: string
): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({
        favoritable_type: type,
        favoritable_id: id,
      });

    return !error;
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return false;
  }
}

/**
 * Check if item is favorited
 */
export async function isFavorited(
  type: FavoritableType,
  id: string
): Promise<boolean> {
  const authenticated = await isAuthenticated();
  if (!authenticated) return false;

  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .match({
        favoritable_type: type,
        favoritable_id: id,
      })
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  type: FavoritableType,
  id: string
): Promise<boolean> {
  const favorited = await isFavorited(type, id);
  
  if (favorited) {
    return await removeFromFavorites(type, id);
  } else {
    return await addToFavorites(type, id);
  }
}

// Legacy aliases for backward compatibility
export const fetchSavedItems = fetchFavoriteProducts;
export const addToSavedItemsSupabase = (id: string) => addToFavorites('product', id);
export const removeFromSavedItemsSupabase = (id: string) => removeFromFavorites('product', id);

