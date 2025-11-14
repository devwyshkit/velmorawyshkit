import { createContext, useContext, ReactNode } from 'react';
import { getMockUser } from '@/lib/mock-mode';

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

// Mock user - always available, no loading, no checks
const mockUser = getMockUser();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // DISABLED ALL AUTHENTICATION - Always return mock user immediately
  // No loading, no checks, no redirects, no session timeouts, no CSRF
  const value = {
    user: mockUser,
    loading: false,
    isAuthenticated: true,
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
