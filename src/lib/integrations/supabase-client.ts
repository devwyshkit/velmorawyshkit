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

// Guest cart deprecated and removed

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return hasRealCredentials;
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  // If no real Supabase credentials, always return false (guest mode)
  if (!hasRealCredentials) {
    return false;
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    // Handle network errors gracefully
    if (error) {
      // Check if it's a network/connection error
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('ERR_NAME_NOT_RESOLVED') ||
          error.message.includes('NetworkError')) {
        return false; // Silent fail for network errors
      }
      console.error('Auth error:', error);
      return false;
    }
    return !!session;
  } catch (error: any) {
    // Handle error silently in production
    // Don't log network errors as they're expected when Supabase is unavailable
    if (error?.message && 
        !error.message.includes('Failed to fetch') && 
        !error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      console.error('Auth exception:', error);
    }
    return false;
  }
};
