// Simple notification service - browser notifications only (like Swiggy)
// No over-engineering, just basic browser notifications

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

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
          window.location.href = options.data.url;
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