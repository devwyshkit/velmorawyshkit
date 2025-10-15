import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: 'customer' | 'seller' | 'admin' | 'kam';
  name: string;
  avatar?: string;
  phone?: string;
  businessName?: string;
  lastLogin?: Date;
  isEmailVerified?: boolean;
  mfaEnabled?: boolean;
  socialProvider?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    businessName?: string;
    marketingOptIn?: boolean;
    rememberMe?: boolean;
  }) => Promise<void>;
  socialLogin: (provider: string, role: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  enableMFA: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  sessionExpiry?: Date;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  // Initialize user from storage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('wyshkit_user') || sessionStorage.getItem('wyshkit_user');
        const storedExpiry = localStorage.getItem('wyshkit_session') || sessionStorage.getItem('wyshkit_session');
        
        if (storedUser && storedExpiry) {
          const parsedUser = JSON.parse(storedUser);
          const expiryDate = new Date(storedExpiry);
          
          if (expiryDate > new Date()) {
            setUser(parsedUser);
            setSessionExpiry(expiryDate);
          } else {
            // Session expired, clear storage
            clearAuthStorage();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthStorage();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthStorage = () => {
    localStorage.removeItem('wyshkit_user');
    localStorage.removeItem('wyshkit_session');
    sessionStorage.removeItem('wyshkit_user');
    sessionStorage.removeItem('wyshkit_session');
  };

  const login = async (email: string, password: string, role: string, rememberMe = false) => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Validate credentials (mock validation)
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Mock user data based on role and email
      const getUserData = (email: string, role: string): User => {
        const baseData = {
          id: `${role}_${Date.now()}`,
          email,
          role: role as 'customer' | 'seller' | 'admin' | 'kam',
          phone: '+91 9876543210',
          avatar: '',
          lastLogin: new Date(),
          isEmailVerified: true,
          mfaEnabled: false
        };

        switch (role) {
          case 'seller':
            return {
              ...baseData,
              name: 'Rajesh Kumar',
              businessName: 'QuickGifts Electronics'
            };
          case 'admin':
            return {
              ...baseData,
              name: 'Admin User',
              businessName: 'Wyshkit Platform'
            };
          case 'kam':
            return {
              ...baseData,
              name: 'Sarah Johnson',
              businessName: 'Wyshkit KAM'
            };
          default: // customer
            return {
              ...baseData,
              name: 'John Doe'
            };
        }
      };

      const userData = getUserData(email, role);
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + (rememberMe ? 24 * 7 : 8)); // 7 days or 8 hours

      setUser(userData);
      setSessionExpiry(expiry);

      // Store in appropriate storage
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('wyshkit_user', JSON.stringify(userData));
      storage.setItem('wyshkit_session', expiry.toISOString());
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
    businessName?: string;
    marketingOptIn?: boolean;
    rememberMe?: boolean;
  }) => {
    setLoading(true);
    
    // Mock registration - replace with Supabase later
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: userData.email,
      role: userData.role as User['role'],
      name: userData.name,
      phone: userData.phone,
      businessName: userData.businessName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
      lastLogin: new Date(),
      isEmailVerified: false, // Require email verification for new users
      mfaEnabled: false
    };
    
    setUser(mockUser);
    const storage = userData.rememberMe ? localStorage : sessionStorage;
    storage.setItem('wyshkit_user', JSON.stringify(mockUser));
    
    // Set session expiry
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + (userData.rememberMe ? 720 : 24));
    storage.setItem('wyshkit_session_expiry', expiry.toISOString());
    
    setLoading(false);
  };

  const socialLogin = async (provider: string, role: string) => {
    setLoading(true);
    
    // Mock social authentication - replace with Supabase later
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: `user@${provider}.com`,
      role: role as User['role'],
      name: `${provider} User`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
      lastLogin: new Date(),
      isEmailVerified: true,
      mfaEnabled: false,
      socialProvider: provider
    };
    
    setUser(mockUser);
    localStorage.setItem('wyshkit_user', JSON.stringify(mockUser));
    
    // Set session expiry for social logins (30 days)
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 720);
    localStorage.setItem('wyshkit_session_expiry', expiry.toISOString());
    
    setLoading(false);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('wyshkit_user', JSON.stringify(updatedUser));
    setLoading(false);
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock password reset email
    setLoading(false);
  };

  const verifyEmail = async (token: string) => {
    if (!user) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedUser = { ...user, isEmailVerified: true };
    setUser(updatedUser);
    localStorage.setItem('wyshkit_user', JSON.stringify(updatedUser));
    setLoading(false);
  };

  const enableMFA = async () => {
    if (!user) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedUser = { ...user, mfaEnabled: true };
    setUser(updatedUser);
    localStorage.setItem('wyshkit_user', JSON.stringify(updatedUser));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setSessionExpiry(null);
    clearAuthStorage();
  };

  const value = {
    user,
    login,
    register,
    socialLogin,
    logout,
    updateProfile,
    requestPasswordReset,
    verifyEmail,
    enableMFA,
    loading,
    isAuthenticated: !!user,
    sessionExpiry
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};