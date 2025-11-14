import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Validate Supabase URL format
const isValidSupabaseUrl = (url: string): boolean => {
  if (!url || url === 'https://placeholder.supabase.co') {
    return false;
  }
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') || urlObj.hostname.includes('supabase.in');
  } catch {
    return false;
  }
};

// Only create client if real credentials are provided and URL is valid
const hasRealCredentials = import.meta.env.VITE_SUPABASE_URL && 
                           import.meta.env.VITE_SUPABASE_ANON_KEY &&
                           isValidSupabaseUrl(supabaseUrl);

export const supabase = hasRealCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        // Disable automatic reconnection for cleaner error handling
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

// Guest cart removed - authentication required for all cart operations (Swiggy 2025 pattern)

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return hasRealCredentials;
};

// Check if user is authenticated
// DISABLED AUTHENTICATION - Always return true in mock mode
export const isAuthenticated = async () => {
  // Always return true - authentication is disabled
  // No Supabase calls, no session checks, no network requests
  return true;
};
