import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SkeletonComponents } from "@/components/ui/skeleton-screen";
import { getLoginPath } from "@/utils/roleUtils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'seller' | 'admin' | 'kam';
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Provides authentication and role-based access control for routes.
 * 
 * Features:
 * - Authentication check (user must be logged in)
 * - Role-based access control (user.role must match requiredRole)
 * - Automatic redirect to appropriate login page
 * - Loading state while checking authentication
 * - Unauthorized page for wrong roles
 * 
 * Usage:
 * ```tsx
 * <Route path="/partner" element={
 *   <ProtectedRoute requiredRole="seller">
 *     <PartnerLayout />
 *   </ProtectedRoute>
 * }>
 * ```
 */
export const ProtectedRoute = ({ 
  children, 
  requiredRole,
  redirectTo 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Wait for authentication to load
    if (loading) return;
    
    // Redirect if not authenticated
    if (!user) {
      const loginPath = redirectTo || getLoginPath(requiredRole);
      navigate(loginPath, { replace: true });
      return;
    }
    
    // Redirect if wrong role
    if (requiredRole && user.role !== requiredRole) {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [user, loading, requiredRole, redirectTo, navigate]);
  
  // Show loading while checking authentication
  if (loading) {
    return <SkeletonComponents.Dashboard />;
  }
  
  // Don't render if not authenticated
  if (!user) {
    return null;
  }
  
  // Don't render if wrong role
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }
  
  return <>{children}</>;
};
