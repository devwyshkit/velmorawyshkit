import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'seller' | 'admin';
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * DISABLED ALL AUTHENTICATION CHECKS - Always allows access
 * No redirects, no loading, no role checks
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  redirectTo 
}: ProtectedRouteProps) => {
  // DISABLED - Always allow access, no checks, no redirects
  return <>{children}</>;
};
