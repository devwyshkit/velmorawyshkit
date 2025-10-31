import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/integrations/supabase-client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { initializeCSRFProtection, cleanupCSRFProtection } from '@/lib/security/csrf';
// Removed OneSignal complexity - using simple browser notifications only

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  role: 'customer' | 'seller' | 'admin' | 'kam';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for mock authentication first (for development without Supabase)
    const checkMockAuth = () => {
      try {
        const mockSession = localStorage.getItem('mock_session');
        const mockUserStr = localStorage.getItem('mock_user');
        
        if (mockSession === 'true' && mockUserStr) {
          const mockUser = JSON.parse(mockUserStr);
          setUser(mockUser);
          setLoading(false);
          return true; // Mock auth found
        }
      } catch (error) {
        console.error('Error reading mock auth:', error);
      }
      return false; // No mock auth
    };

    // Check if Supabase has real credentials
    const hasRealCredentials = import.meta.env.VITE_SUPABASE_URL && 
                               import.meta.env.VITE_SUPABASE_ANON_KEY &&
                               import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';

    if (!hasRealCredentials) {
      // No real Supabase - use mock auth
      const mockAuthFound = checkMockAuth();
      if (!mockAuthFound) {
        setUser(null);
        setLoading(false);
      }
      
      // Listen for localStorage changes (mock auth state changes)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'mock_session' || e.key === 'mock_user') {
          checkMockAuth();
        }
      };
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically for mock auth changes (same-tab updates)
      // Use custom event to trigger immediate check when mock auth changes in same tab
      const handleMockAuthChange = () => {
        checkMockAuth();
      };
      window.addEventListener('mockAuthChange', handleMockAuthChange);
      
      const interval = setInterval(() => {
        checkMockAuth();
      }, 500); // Check every 500ms for responsiveness
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('mockAuthChange', handleMockAuthChange);
        clearInterval(interval);
      };
    } else {
      // Real Supabase - use normal auth flow
    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        } else {
          // Fallback to mock if no Supabase session
          checkMockAuth();
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const userData = mapSupabaseUser(session.user);
          setUser(userData);
        } else {
            // Check for mock auth as fallback
            if (!checkMockAuth()) {
          setUser(null);
            }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    }
  }, []);

  // 🔒 SESSION TIMEOUT: Auto logout after inactivity (15 min for admin, 30 min for others)
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      
      // Admin users get shorter session timeout for security
      const timeoutMs = user.role === 'admin' ? 15 * 60 * 1000 : 30 * 60 * 1000;
      
      timeoutId = setTimeout(async () => {
        // Auto logout after inactivity
        await supabase.auth.signOut();
        setUser(null);
        
        // Cleanup CSRF protection
        cleanupCSRFProtection();
        
        toast({
          title: "Session expired",
          description: "Please login again for security",
          variant: "destructive",
        });
      }, timeoutMs);
    };
    
    // Reset on any user activity
    const handleActivity = () => resetTimeout();
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    resetTimeout();
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [user, toast]);

  // Map Supabase user to our User interface
  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    // Extract role from app_metadata (set by admin) or user_metadata (fallback)
    const role = (supabaseUser.app_metadata?.role || 
                  supabaseUser.user_metadata?.role || 
                  'customer') as 'customer' | 'seller' | 'admin' | 'kam';
    
    const user = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.email?.split('@')[0] || 
            'User',
      avatar: supabaseUser.user_metadata?.avatar_url,
      phone: supabaseUser.phone || supabaseUser.user_metadata?.phone,
      isEmailVerified: !!supabaseUser.email_confirmed_at,
      isPhoneVerified: !!supabaseUser.phone_confirmed_at || !!supabaseUser.user_metadata?.phone_verified,
      role,
    };
    
    // Initialize CSRF protection for authenticated users
    if (user.id) {
      initializeCSRFProtection();
    }
    
    return user;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
