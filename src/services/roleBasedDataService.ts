import { UserRole } from '@/utils/roleUtils';

export interface DashboardStats {
  id: string;
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  role: UserRole[];
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'pending' | 'info';
  role: UserRole[];
  actionUrl?: string;
}

export interface AlertItem {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  role: UserRole[];
  actionUrl?: string;
}

// Role-based data filtering service
class RoleBasedDataService {
  getProductsForRole(role: UserRole) {
    const baseProducts = [
      { id: '1', name: 'Corporate Cotton T-Shirt', category: 'Apparel', price: 199, stock: 156, status: 'active' as const, sales: 89, views: 1247, rating: 4.7, image: '/placeholder.svg', sku: 'TSH-001', customizable: true, createdAt: '2024-01-15' },
      { id: '2', name: 'Premium Coffee Mug', category: 'Drinkware', price: 299, stock: 23, status: 'active' as const, sales: 156, views: 892, rating: 4.5, image: '/placeholder.svg', sku: 'MUG-002', customizable: true, createdAt: '2024-01-10' }
    ];
    switch (role) {
      case 'seller': return baseProducts;
      case 'admin': case 'kam': return baseProducts;
      case 'customer': default: return baseProducts.filter(p => p.status === 'active' && p.stock > 0);
    }
  }

  getVendorsForRole(role: UserRole) {
    const baseVendors = [
      { id: '1', name: 'Rajesh Kumar', businessName: 'QuickGifts Electronics', email: 'rajesh@quickgifts.com', phone: '+91-98765-43210', location: 'Mumbai, Maharashtra', status: 'approved' as const, kycScore: 98, revenue: 240000, orders: 156, rating: 4.6, joinDate: '2023-03-15', category: 'Electronics', documents: { gst: { status: 'verified' as const, file: 'gst-cert.pdf' }, pan: { status: 'verified' as const, file: 'pan-card.pdf' }, address: { status: 'verified' as const, file: 'address-proof.pdf' } }, lastContact: '2 days ago', assignedKAM: 'Priya Sharma' }
    ];
    switch (role) {
      case 'admin': return baseVendors;
      default: return baseVendors.filter(v => v.status === 'approved');
    }
  }

  // Dashboard stats filtered by role
  getDashboardStats(userRole: UserRole): DashboardStats[] {
    const allStats: DashboardStats[] = [
      // Seller Stats
      {
        id: 'pending-orders',
        title: 'Pending Orders',
        value: '23',
        change: '+5 today',
        icon: 'Package2',
        color: 'text-blue-600',
        role: ['seller']
      },
      {
        id: 'seller-revenue',
        title: 'Revenue This Month',
        value: '₹1,24,567',
        change: '+12% ↗',
        icon: 'DollarSign', 
        color: 'text-green-600',
        role: ['seller']
      },
      {
        id: 'rating',
        title: 'Average Rating',
        value: '4.3/5',
        change: '+0.2 this month',
        icon: 'Star',
        color: 'text-yellow-600',
        role: ['seller']
      },
      {
        id: 'views',
        title: 'Views Today',
        value: '1,245',
        change: '+15%',
        icon: 'TrendingUp',
        color: 'text-purple-600',
        role: ['seller']
      },
      
      // Admin Stats
      {
        id: 'gmv',
        title: 'GMV',
        value: '₹2.4L',
        change: '+15% ↗',
        icon: 'DollarSign',
        color: 'text-green-600',
        role: ['admin']
      },
      {
        id: 'users',
        title: 'Users',
        value: '1,245',
        change: '+23 ↗',
        icon: 'Users',
        color: 'text-blue-600',
        role: ['admin']
      },
      {
        id: 'vendors',
        title: 'Vendors',
        value: '89',
        change: '+2 ↗',
        icon: 'Store',
        color: 'text-purple-600',
        role: ['admin']
      },
      {
        id: 'admin-orders',
        title: 'Orders',
        value: '234',
        change: '+45 ↗',
        icon: 'Package',
        color: 'text-orange-600',
        role: ['admin']
      },
      
      // KAM Stats
      {
        id: 'kam-revenue',
        title: 'Revenue',
        value: '₹45.6L',
        change: 'Target: 85%',
        icon: 'DollarSign',
        color: 'text-green-600',
        role: ['kam']
      },
      {
        id: 'top-vendor',
        title: 'Top Vendor',
        value: 'QuickGifts',
        change: '₹12.4L GMV',
        icon: 'Star',
        color: 'text-yellow-600',
        role: ['kam']
      },
      {
        id: 'active-accounts',
        title: 'Active Accounts',
        value: '8/12',
        change: 'Active Vendors',
        icon: 'Users',
        color: 'text-blue-600',
        role: ['kam']
      },
      {
        id: 'growth',
        title: 'Growth',
        value: '+23% ↗',
        change: 'YoY Trend',
        icon: 'TrendingUp',
        color: 'text-purple-600',
        role: ['kam']
      }
    ];

    return allStats.filter(stat => stat.role.includes(userRole));
  }

  // Activity feed filtered by role
  getActivityFeed(userRole: UserRole): ActivityItem[] {
    const allActivities: ActivityItem[] = [
      // Seller Activities
      {
        id: 'order-1',
        type: 'order',
        message: 'New order for T-shirts (50) - ₹13,719',
        time: '2 hours ago',
        status: 'pending',
        role: ['seller'],
        actionUrl: '/seller/orders'
      },
      {
        id: 'payment-1', 
        type: 'payment',
        message: 'Payment received for Order #WY001233',
        time: 'Yesterday',
        status: 'success',
        role: ['seller'],
        actionUrl: '/seller/analytics'
      },
      
      // Admin Activities
      {
        id: 'vendor-signup',
        type: 'vendor',
        message: 'New vendor signup: CraftStudio (pending)',
        time: '2h ago',
        status: 'pending',
        role: ['admin'],
        actionUrl: '/admin/vendor-management'
      },
      {
        id: 'high-order',
        type: 'order',
        message: 'High-value order: ₹45,000 from TechCorp',
        time: '3h ago',
        status: 'warning',
        role: ['admin'],
        actionUrl: '/admin/dashboard'
      },
      {
        id: 'dispute',
        type: 'dispute',
        message: 'Dispute raised: Order #WY001230',
        time: '5h ago',
        status: 'error',
        role: ['admin'],
        actionUrl: '/admin/dispute-escalations'
      },
      {
        id: 'payment-processed',
        type: 'payment',
        message: 'Payment processed: ₹15,000 to OfficeGifts',
        time: '1d ago',
        status: 'success',
        role: ['admin'],
        actionUrl: '/admin/platform-config'
      },
      
      // KAM Activities
      {
        id: 'vendor-performance',
        type: 'vendor',
        message: 'OfficeGifts uploaded 15 new products',
        time: '2h ago',
        status: 'info',
        role: ['kam'],
        actionUrl: '/kam/vendors'
      },
      {
        id: 'milestone',
        type: 'achievement',
        message: 'QuickGifts achieved 98% success rate milestone',
        time: '5h ago',
        status: 'success',
        role: ['kam'],
        actionUrl: '/kam/analytics'
      },
      {
        id: 'sla-miss',
        type: 'issue',
        message: 'CraftStudio missed SLA on Order #WY001245',
        time: '1d ago',
        status: 'warning',
        role: ['kam'],
        actionUrl: '/kam/vendors'
      }
    ];

    return allActivities.filter(activity => activity.role.includes(userRole));
  }

  // Alerts filtered by role
  getAlerts(userRole: UserRole): AlertItem[] {
    const allAlerts: AlertItem[] = [
      // Seller Alerts
      {
        id: 'low-stock',
        message: 'Low stock: Corporate T-shirts (5 left)',
        type: 'warning',
        role: ['seller'],
        actionUrl: '/seller/products'
      },
      {
        id: 'design-pending',
        message: '3 orders awaiting design preview upload',
        type: 'info',
        role: ['seller'],
        actionUrl: '/seller/orders'
      },
      
      // Admin Alerts
      {
        id: 'kyc-approval',
        message: '3 vendors pending KYC approval',
        type: 'warning',
        role: ['admin'],
        actionUrl: '/admin/vendor-management'
      },
      {
        id: 'disputes',
        message: '2 high-value disputes need attention',
        type: 'error',
        role: ['admin'],
        actionUrl: '/admin/dispute-escalations'
      },
      {
        id: 'server-load',
        message: 'Server load at 85% - consider scaling',
        type: 'info',
        role: ['admin'],
        actionUrl: '/admin/platform-config'
      },
      
      // KAM Alerts
      {
        id: 'declining-performance',
        message: 'PrintHub performance declining - action required',
        type: 'error',
        role: ['kam'],
        actionUrl: '/kam/vendors'
      },
      {
        id: 'overdue-call',
        message: 'Overdue call with CraftStudio - 1 week',
        type: 'warning',
        role: ['kam'],
        actionUrl: '/kam/disputes'
      }
    ];

    return allAlerts.filter(alert => alert.role.includes(userRole));
  }

  // Role-specific quick actions
  getQuickActions(userRole: UserRole) {
    const actions = {
      seller: [
        { id: 'add-product', label: 'Add Product', icon: 'Plus', url: '/seller/products' },
        { id: 'upload-inventory', label: 'Upload Inventory', icon: 'Upload', url: '/seller/products' },
        { id: 'view-analytics', label: 'View Analytics', icon: 'TrendingUp', url: '/seller/analytics' }
      ],
      admin: [
        { id: 'approve-vendors', label: 'Approve Vendors', icon: 'Users', url: '/admin/vendor-management' },
        { id: 'process-payouts', label: 'Process Payouts', icon: 'DollarSign', url: '/admin/platform-config' },
        { id: 'generate-reports', label: 'Generate Reports', icon: 'TrendingUp', url: '/admin/analytics' }
      ],
      kam: [
        { id: 'schedule-calls', label: 'Schedule Calls', icon: 'Phone', url: '/kam/disputes' },
        { id: 'generate-reports', label: 'Generate Reports', icon: 'TrendingUp', url: '/kam/analytics' },
        { id: 'review-targets', label: 'Review Targets', icon: 'Target', url: '/kam/onboarding' }
      ],
      customer: []
    };

    return actions[userRole] || [];
  }

  // Role-based page titles
  getPageTitle(userRole: UserRole): { title: string; subtitle: string } {
    const titles = {
      seller: {
        title: 'Seller Dashboard',
        subtitle: 'Manage your products and orders'
      },
      admin: {
        title: 'Admin Dashboard', 
        subtitle: 'Platform overview and management'
      },
      kam: {
        title: 'Key Account Management',
        subtitle: 'My Accounts: 12 • This Quarter'
      },
      customer: {
        title: 'Welcome back!',
        subtitle: 'Discover amazing gifts for every occasion'
      }
    };

    return titles[userRole] || titles.customer;
  }
}

export const roleBasedDataService = new RoleBasedDataService();