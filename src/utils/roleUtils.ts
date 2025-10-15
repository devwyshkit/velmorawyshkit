export type UserRole = 'customer' | 'seller' | 'admin' | 'kam';

export const ROLE_HIERARCHIES: Record<UserRole, readonly UserRole[]> = {
  admin: ['admin', 'kam', 'seller', 'customer'],
  kam: ['kam', 'seller'],
  seller: ['seller'],
  customer: ['customer']
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  customer: {
    canOrder: true,
    canCustomize: true,
    canViewProducts: true,
    canManageProfile: true,
    canViewOrders: true
  },
  seller: {
    canManageProducts: true,
    canViewOrders: true,
    canUploadPreviews: true,
    canManageInventory: true,
    canViewAnalytics: true,
    canManageProfile: true
  },
  admin: {
    canManageVendors: true,
    canManageUsers: true,
    canViewAllOrders: true,
    canManageFinances: true,
    canManageDisputes: true,
    canViewPlatformAnalytics: true,
    canManageSystem: true
  },
  kam: {
    canManageVendorRelationships: true,
    canViewVendorPerformance: true,
    canManageContracts: true,
    canViewReports: true,
    canManageAccounts: true
  }
} as const;

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'customer':
      return 'Customer';
    case 'seller':
      return 'Seller';
    case 'admin':
      return 'Administrator';
    case 'kam':
      return 'Key Account Manager';
    default:
      return 'User';
  }
};

export const canUserAccessRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  const userHierarchy = ROLE_HIERARCHIES[userRole];
  return userHierarchy.includes(targetRole);
};

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions && rolePermissions[permission] === true;
};

export const getDefaultDashboardPath = (role: UserRole): string => {
  switch (role) {
    case 'seller':
      return '/seller/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'kam':
      return '/kam/dashboard';
    case 'customer':
    default:
      return '/role-switcher'; // Customer UI removed - redirect to role switcher
  }
};

export const getLoginPath = (role?: UserRole): string => {
  const isBusinessRole = role === 'seller' || role === 'admin' || role === 'kam';
  return isBusinessRole ? '/auth/business-login' : '/auth/customer-login';
};

export const getRegisterPath = (role?: UserRole): string => {
  const isBusinessRole = role === 'seller' || role === 'admin' || role === 'kam';
  return isBusinessRole ? '/auth/business-register' : '/auth/customer-register';
};

export const isBusinessRole = (role: UserRole): boolean => {
  return role === 'seller' || role === 'admin' || role === 'kam';
};

export const isCustomerRole = (role: UserRole): boolean => {
  return role === 'customer';
};