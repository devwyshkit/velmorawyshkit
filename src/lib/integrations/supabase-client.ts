import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create client if real credentials are provided
const hasRealCredentials = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = hasRealCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

import { secureStorage } from '@/lib/security/encryption';

// Guest mode: Store cart in encrypted localStorage
export const getGuestCart = async (): Promise<any[]> => {
  try {
    const cart = await secureStorage.getItem('wyshkit_guest_cart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error loading guest cart:', error);
    return [];
  }
};

export const setGuestCart = async (items: unknown[]) => {
  try {
    await secureStorage.setItem('wyshkit_guest_cart', JSON.stringify(items));
  } catch (error) {
    console.error('Error saving guest cart:', error);
  }
};

export const clearGuestCart = async () => {
  try {
    await secureStorage.removeItem('wyshkit_guest_cart');
  } catch (error) {
    console.error('Error clearing guest cart:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  // If no real Supabase credentials, always return false (guest mode)
  if (!hasRealCredentials) {
    return false;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    // Handle error silently in production
    return false;
  }
};
