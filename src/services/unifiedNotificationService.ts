import { UserRole } from '@/utils/roleUtils';

/**
 * Unified Notification Service - Single source of truth for all notifications
 * Replaces multiple notification contexts and systems
 * Supabase-ready with role-based filtering and security
 */

export interface UnifiedNotification {
  id: string;
  type: 'order' | 'vendor' | 'system' | 'security' | 'payment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole: UserRole;
  actionUrl?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  category: string;
}

export interface NotificationFilter {
  role: UserRole;
  userId?: string;
  category?: string;
  priority?: string[];
  unreadOnly?: boolean;
  limit?: number;
}

class UnifiedNotificationService {
  private notifications: UnifiedNotification[] = [];
  private listeners: Set<(notifications: UnifiedNotification[]) => void> = new Set();

  /**
   * Get role-based notifications with server-side filtering pattern
   * This will be replaced with Supabase RLS queries
   */
  async getNotifications(filter: NotificationFilter): Promise<UnifiedNotification[]> {
    // TODO: Replace with Supabase query with RLS
    // SELECT * FROM notifications WHERE user_role = $1 AND (user_id = $2 OR user_id IS NULL)
    
    let filtered = this.notifications.filter(notification => {
      // Role-based filtering (server-side in Supabase)
      if (notification.targetRole !== filter.role && notification.targetRole !== 'customer') {
        return false;
      }

      // Category filtering
      if (filter.category && notification.category !== filter.category) {
        return false;
      }

      // Priority filtering
      if (filter.priority && !filter.priority.includes(notification.priority)) {
        return false;
      }

      // Unread filtering
      if (filter.unreadOnly && notification.read) {
        return false;
      }

      // Expiration check
      if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
        return false;
      }

      return true;
    });

    // Apply limit
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Add notification with role-based targeting
   * Server-side validation required for security
   */
  async addNotification(notification: Omit<UnifiedNotification, 'id' | 'timestamp'>): Promise<string> {
    const newNotification: UnifiedNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    // TODO: Replace with Supabase INSERT with RLS
    // INSERT INTO notifications (...) VALUES (...) RETURNING id
    
    this.notifications.unshift(newNotification);
    this.notifyListeners();
    
    return newNotification.id;
  }

  /**
   * Mark notification as read (user-specific)
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // TODO: Replace with Supabase UPDATE with user validation
    // UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2
    
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string, role: UserRole): Promise<void> {
    // TODO: Replace with Supabase batch UPDATE
    // UPDATE notifications SET read = true WHERE user_id = $1 AND user_role = $2
    
    this.notifications.forEach(notification => {
      if (notification.targetRole === role) {
        notification.read = true;
      }
    });
    
    this.notifyListeners();
  }

  /**
   * Delete notification (soft delete with audit trail)
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // TODO: Replace with Supabase soft delete
    // UPDATE notifications SET deleted_at = NOW() WHERE id = $1 AND user_id = $2
    
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: UnifiedNotification[]) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get unread count for role
   */
  async getUnreadCount(role: UserRole, userId?: string): Promise<number> {
    const notifications = await this.getNotifications({ role, userId, unreadOnly: true });
    return notifications.length;
  }

  /**
   * Initialize with role-based seed data
   * This simulates what Supabase RLS would return
   */
  initializeForRole(role: UserRole): void {
    this.notifications = this.getRoleSeedData(role);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback([...this.notifications]));
  }

  private getRoleSeedData(role: UserRole): UnifiedNotification[] {
    const baseNotifications: UnifiedNotification[] = [];
    const now = new Date();

    switch (role) {
      case 'customer':
        baseNotifications.push(
          {
            id: 'cust_001',
            type: 'order',
            priority: 'high',
            title: 'Order Update',
            message: 'Your custom t-shirt order #WY001234 is ready for preview approval',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            targetRole: 'customer',
            actionUrl: '/preview-approval/WY001234',
            category: 'order_updates',
            metadata: { orderId: 'WY001234', vendorId: 'quickgifts' }
          },
          {
            id: 'cust_002',
            type: 'system',
            priority: 'medium',
            title: 'Special Offer',
            message: 'Get 20% off on corporate gifts this Diwali season',
            timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            read: false,
            targetRole: 'customer',
            category: 'promotions',
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        );
        break;

      case 'seller':
        baseNotifications.push(
          {
            id: 'sell_001',
            type: 'order',
            priority: 'urgent',
            title: 'Preview Required',
            message: 'Customer waiting for preview of Order #WY001234 (2 hours overdue)',
            timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
            read: false,
            targetRole: 'seller',
            actionUrl: '/seller/orders',
            category: 'order_management',
            metadata: { orderId: 'WY001234', customerId: 'cust_123', priority: 'high' }
          },
          {
            id: 'sell_002',
            type: 'vendor',
            priority: 'medium',
            title: 'Low Stock Alert',
            message: 'Corporate t-shirts running low (5 units left)',
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
            read: false,
            targetRole: 'seller',
            category: 'inventory',
            metadata: { productId: 'prod_tshirt_corp', stockLevel: 5 }
          }
        );
        break;

      case 'admin':
        baseNotifications.push(
          {
            id: 'admin_001',
            type: 'security',
            priority: 'urgent',
            title: 'Vendor Verification Required',
            message: '3 new vendors pending KYC approval',
            timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
            read: false,
            targetRole: 'admin',
            actionUrl: '/admin/vendor-management?filter=pending',
            category: 'vendor_management',
            metadata: { pendingCount: 3, urgentCount: 1 }
          },
          {
            id: 'admin_002',
            type: 'system',
            priority: 'high',
            title: 'High-Value Dispute',
            message: 'Order #WY001245 (₹45,000) disputed - customer claims quality issue',
            timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
            read: false,
            targetRole: 'admin',
            actionUrl: '/admin/dispute-escalations/WY001245',
            category: 'dispute_resolution',
            metadata: { orderId: 'WY001245', amount: 45000, type: 'quality' }
          }
        );
        break;

      case 'kam':
        baseNotifications.push(
          {
            id: 'kam_001',
            type: 'vendor',
            priority: 'medium',
            title: 'Performance Alert',
            message: 'QuickGifts performance dropped 15% - schedule review call',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            targetRole: 'kam',
            actionUrl: '/kam/vendors',
            category: 'performance_monitoring',
            metadata: { vendorId: 'quickgifts', performanceDrop: 15, trend: 'declining' }
          },
          {
            id: 'kam_002',
            type: 'system',
            priority: 'low',
            title: 'Monthly Report Ready',
            message: 'Q4 vendor performance report is now available',
            timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
            read: true,
            targetRole: 'kam',
            actionUrl: '/kam/analytics',
            category: 'reports',
            metadata: { reportType: 'quarterly', period: 'Q4-2024' }
          }
        );
        break;
    }

    return baseNotifications;
  }
}

export const unifiedNotificationService = new UnifiedNotificationService();