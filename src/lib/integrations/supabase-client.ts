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

// Guest mode: Store cart in localStorage
export const getGuestCart = () => {
  const cart = localStorage.getItem('wyshkit_guest_cart');
  return cart ? JSON.parse(cart) : [];
};

export const setGuestCart = (items: any[]) => {
  localStorage.setItem('wyshkit_guest_cart', JSON.stringify(items));
};

export const clearGuestCart = () => {
  localStorage.removeItem('wyshkit_guest_cart');
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
    console.warn('Supabase auth check failed, using guest mode');
    return false;
  }
};
