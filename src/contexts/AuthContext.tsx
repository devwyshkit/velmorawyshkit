import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/integrations/supabase-client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { initializeCSRFProtection, cleanupCSRFProtection } from '@/lib/security/csrf';
import { isMockModeEnabled, getMockUser } from '@/lib/mock-mode';
// Removed OneSignal complexity - using simple browser notifications only

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  role: 'customer' | 'seller' | 'admin';
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
    // Phase 1 Cleanup: Always return mock user - no auth checks
    // This simplifies the flow and removes all conditionals
    setUser(getMockUser());
    setLoading(false);
  }, []);

  // 🔒 SESSION TIMEOUT: Auto logout after inactivity (15 min for admin, 30 min for others)
  // Phase 1 Cleanup: Skip in mock mode - no timeout needed
  useEffect(() => {
    if (!user) return; // Skip timeout in mock mode

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
        
        // Swiggy 2025: Silent operation - redirect to login will show appropriate UI
        // Note: Could show inline banner instead of toast for better UX
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
    let role = (supabaseUser.app_metadata?.role || 
                supabaseUser.user_metadata?.role || 
                'customer') as string;
    
    // Normalize 'partner' to 'seller' for consistency (Swiggy 2025: partners are sellers)
    if (role === 'partner') {
      role = 'seller';
    }
    
    const normalizedRole = role as 'customer' | 'seller' | 'admin';
    
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
      role: normalizedRole,
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
