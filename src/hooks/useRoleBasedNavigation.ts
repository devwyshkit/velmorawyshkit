import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { getDefaultDashboardPath, getLoginPath, getRegisterPath, UserRole } from '@/utils/roleUtils';

export const useRoleBasedNavigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navigateToRoleDashboard = useCallback((role?: UserRole) => {
    const path = getDefaultDashboardPath(role || user?.role || 'customer');
    navigate(path);
  }, [navigate, user?.role]);

  const navigateToRoleDefault = useCallback(() => {
    if (user?.role) {
      navigateToRoleDashboard(user.role);
    }
  }, [user?.role, navigateToRoleDashboard]);

  const navigateToLogin = useCallback((role?: UserRole) => {
    const path = getLoginPath(role || user?.role);
    navigate(path);
  }, [navigate, user?.role]);

  const navigateToRegister = useCallback((role?: UserRole) => {
    const path = getRegisterPath(role || user?.role);
    navigate(path);
  }, [navigate, user?.role]);

  return {
    navigateToRoleDashboard,
    navigateToRoleDefault,
    navigateToLogin,
    navigateToRegister,
    getDefaultDashboardPath: (role?: UserRole) => getDefaultDashboardPath(role || user?.role || 'customer'),
    getLoginPath: (role?: UserRole) => getLoginPath(role || user?.role),
    getRegisterPath: (role?: UserRole) => getRegisterPath(role || user?.role),
    currentRole: user?.role
  };
};