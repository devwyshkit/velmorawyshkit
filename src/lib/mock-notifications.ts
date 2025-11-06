/**
 * Mock Notifications Storage
 * 
 * Manages in-app notifications in localStorage for mock mode.
 * Swiggy 2025 Pattern: Bell icon with notification center
 */

import { safeGetItem, safeSetItem } from './mock-storage';

const NOTIFICATIONS_STORAGE_KEY = 'wyshkit_mock_notifications';

export interface Notification {
  id: string;
  type: 'order_update' | 'preview_ready' | 'payment_confirmation' | 'delivery' | 'promotional';
  title: string;
  message: string;
  orderId?: string;
  orderItemId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

import { generateNotificationId } from './utils/id-generator';

/**
 * Generate a notification ID
 * Swiggy 2025: Use centralized ID generator
 */
// Function is now imported from id-generator.ts

/**
 * Get all notifications from localStorage
 */
export const getNotifications = (): Notification[] => {
  const notifications = safeGetItem<Notification[]>(NOTIFICATIONS_STORAGE_KEY, {
    defaultValue: [],
  });
  return notifications || [];
};

/**
 * Get unread notification count
 */
export const getUnreadCount = (): number => {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
};

/**
 * Add a new notification
 */
export const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification => {
  const notifications = getNotifications();
  
  const newNotification: Notification = {
    ...notification,
    id: generateNotificationId(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(newNotification); // Add to beginning
  safeSetItem(NOTIFICATIONS_STORAGE_KEY, notifications);

  return newNotification;
};

/**
 * Mark notification as read
 */
export const markAsRead = (notificationId: string): boolean => {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
    return safeSetItem(NOTIFICATIONS_STORAGE_KEY, notifications);
  }

  return false;
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = (): boolean => {
  const notifications = getNotifications();
  notifications.forEach(n => n.read = true);
  return safeSetItem(NOTIFICATIONS_STORAGE_KEY, notifications);
};

/**
 * Delete a notification
 */
export const deleteNotification = (notificationId: string): boolean => {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  return safeSetItem(NOTIFICATIONS_STORAGE_KEY, filtered);
};

/**
 * Clear all notifications
 */
export const clearNotifications = (): boolean => {
  return safeSetItem(NOTIFICATIONS_STORAGE_KEY, []);
};



