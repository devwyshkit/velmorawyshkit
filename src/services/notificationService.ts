// Simple notification service - browser notifications only (like Swiggy)
// No over-engineering, just basic browser notifications

import { pwaNavigationService } from './pwaNavigationService';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

// Check if URL is internal (same origin) or external
const isInternalUrl = (url: string): boolean => {
  if (!url) return false;
  // If it starts with /, it's internal
  if (url.startsWith('/')) return true;
  // If it's same origin, it's internal
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
};

class NotificationService {
  private isSupported = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async sendNotification(options: NotificationOptions): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: true,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          const url = options.data.url;
          // Use pwaNavigationService for internal routes, window.location.href for external
          if (isInternalUrl(url)) {
            pwaNavigationService.navigateTo(url);
          } else {
            // External URL - use window.location.href
            window.location.href = url;
          }
        }
        notification.close();
      };
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async sendOrderNotification(type: string, orderId: string): Promise<void> {
    let title = 'Order Update';
    let body = 'Your order status has been updated';

    switch (type) {
      case 'order_accepted':
        title = 'Order Confirmed';
        body = '🎉 Your order has been accepted!';
        break;
      case 'preview_ready':
        title = 'Preview Ready';
        body = '📸 Your preview is ready for review';
        break;
      case 'order_shipped':
        title = 'Order Shipped';
        body = '🚚 Your order is on the way!';
        break;
      case 'out_for_delivery':
        title = 'Out for Delivery';
        body = '🚚 Your order is out for delivery';
        break;
      case 'order_delivered':
        title = 'Order Delivered';
        body = '✅ Your order has been delivered!';
        break;
    }

    await this.sendNotification({
      title,
      body,
      tag: `order-${orderId}`,
      data: { orderId, type },
    });
  }

  get isNotificationSupported(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  get permissionStatus(): NotificationPermission {
    return this.permission;
  }
}

export const notificationService = new NotificationService();
export default notificationService;