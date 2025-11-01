// =====================================================
// NOTIFICATION SERVICE
// Multi-channel notifications with batching
// Following Swiggy patterns: batched notifications
// =====================================================

import { supabase } from './supabase-client';

export interface Notification {
  type: string;
  title: string;
  body: string;
  action_url?: string;
  related_type?: string;
  related_id?: string;
  metadata?: object;
}

interface NotificationBatch {
  notifications: Notification[];
  timeout: NodeJS.Timeout | null;
}

class NotificationService {
  private static instance: NotificationService;
  private batches: Map<string, NotificationBatch> = new Map();
  private readonly BATCH_WINDOW = 5 * 60 * 1000; // 5 minutes

  static getInstance(): NotificationService {
    if (!this.instance) {
      this.instance = new NotificationService();
    }
    return this.instance;
  }

  /**
   * Queue a notification for batched delivery
   */
  async queue(userId: string, notification: Notification): Promise<void> {
    const existing = this.batches.get(userId);

    if (existing) {
      // Add to existing batch
      existing.notifications.push(notification);
      if (existing.timeout) {
        clearTimeout(existing.timeout);
      }
    } else {
      // Create new batch
      this.batches.set(userId, {
        notifications: [notification],
        timeout: null
      });
    }

    // Schedule batch send
    const batch = this.batches.get(userId)!;
    batch.timeout = setTimeout(() => this.sendBatch(userId), this.BATCH_WINDOW);
  }

  /**
   * Send notification immediately
   */
  async sendImmediate(userId: string, notification: Notification): Promise<void> {
    await this.sendSingle(userId, notification);
  }

  private async sendBatch(userId: string): Promise<void> {
    const batch = this.batches.get(userId);
    if (!batch || batch.notifications.length === 0) {
      return;
    }

    const { notifications } = batch;

    if (notifications.length === 1) {
      await this.sendSingle(userId, notifications[0]);
    } else {
      await this.sendGrouped(userId, notifications);
    }

    this.batches.delete(userId);
  }

  private async sendSingle(userId: string, notification: Notification): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        action_url: notification.action_url,
        related_type: notification.related_type,
        related_id: notification.related_id,
        metadata: notification.metadata || {}
      });

    if (error) {
      console.error('Failed to save notification:', error);
    }
  }

  private async sendGrouped(userId: string, notifications: Notification[]): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'batch',
        title: `${notifications.length} updates on your order`,
        body: notifications.map(n => n.title).join(', '),
        action_url: '/orders',
        metadata: { notifications }
      });

    if (error) {
      console.error('Failed to save batched notification:', error);
    }
  }

  /**
   * Fetch notifications for a user
   */
  async fetch(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      read?: boolean;
      type?: string;
    } = {}
  ): Promise<any[]> {
    const { page = 1, limit = 20, read, type } = options;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (read !== undefined) {
      query = query.eq('read', read);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);
  }
}

export const notificationService = NotificationService.getInstance();

