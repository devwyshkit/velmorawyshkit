// =====================================================
// ORDER STATUS MANAGEMENT
// State machine for order status transitions
// Following Swiggy patterns: simplified customer-facing statuses
// =====================================================

import { supabase } from './supabase-client';

// Customer-facing order statuses (simplified)
export type CustomerOrderStatus = 
  | 'placed'
  | 'confirmed'
  | 'preview_pending'
  | 'in_production'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

// Internal order statuses (for backend/vendor)
export type InternalOrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preview_pending'
  | 'preview_ready'
  | 'preview_approved'
  | 'revision_requested'
  | 'in_production'
  | 'production_complete'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'return_picked_up'
  | 'returned'
  | 'refunded';

// Map internal statuses to customer-facing statuses
export const STATUS_DISPLAY_MAP: Record<InternalOrderStatus, {
  label: string;
  icon: string;
  color: string;
}> = {
  placed: { label: 'Order placed', icon: '✓', color: 'blue' },
  confirmed: { label: 'Order confirmed', icon: '✓', color: 'blue' },
  preview_pending: { label: 'Awaiting preview', icon: '🎨', color: 'orange' },
  preview_ready: { label: 'Preview ready', icon: '🎨', color: 'orange' },
  preview_approved: { label: 'In production', icon: '⚙️', color: 'blue' },
  revision_requested: { label: 'In production', icon: '⚙️', color: 'blue' },
  in_production: { label: 'In production', icon: '⚙️', color: 'blue' },
  production_complete: { label: 'Out for delivery', icon: '🚗', color: 'green' },
  ready_for_pickup: { label: 'Out for delivery', icon: '🚗', color: 'green' },
  picked_up: { label: 'Out for delivery', icon: '🚗', color: 'green' },
  out_for_delivery: { label: 'Out for delivery', icon: '🚗', color: 'green' },
  delivery_attempted: { label: 'Out for delivery', icon: '🚗', color: 'orange' },
  delivered: { label: 'Delivered', icon: '✓', color: 'green' },
  cancelled: { label: 'Cancelled', icon: '✕', color: 'red' },
  return_requested: { label: 'Return requested', icon: '↩️', color: 'orange' },
  return_picked_up: { label: 'Return in progress', icon: '↩️', color: 'orange' },
  returned: { label: 'Returned', icon: '↩️', color: 'gray' },
  refunded: { label: 'Refunded', icon: '₹', color: 'gray' }
};

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preview_pending', 'cancelled'],
  preview_pending: ['preview_ready', 'cancelled'],
  preview_ready: ['preview_approved', 'revision_requested', 'cancelled'],
  revision_requested: ['preview_pending', 'cancelled'],
  preview_approved: ['in_production', 'cancelled'],
  in_production: ['production_complete', 'cancelled'],
  production_complete: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['picked_up', 'cancelled'],
  picked_up: ['out_for_delivery'],
  out_for_delivery: ['delivery_attempted', 'delivered'],
  delivery_attempted: ['out_for_delivery', 'cancelled'],
  delivered: ['return_requested'],
  cancelled: ['refunded'],
  return_requested: ['return_picked_up', 'delivered'],
  return_picked_up: ['returned'],
  returned: ['refunded'],
  refunded: []
};

/**
 * Update order status with validation
 * @param orderId Order ID
 * @param newStatus Target status
 * @param context Who/when/why this status change happened
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: InternalOrderStatus,
  context: {
    changedBy: { type: string; id: string };
    notes?: string;
    metadata?: object;
  }
): Promise<boolean> {
  try {
    // Get current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new Error('Order not found');
    }

    // Validate transition
    const validTransitions = STATUS_TRANSITIONS[order.status] || [];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`Invalid transition: ${order.status} → ${newStatus}`);
    }

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        [`${newStatus}_at`]: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // Log status change history (trigger handles this, but we can also log manually)
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        from_status: order.status,
        to_status: newStatus,
        changed_by_type: context.changedBy.type,
        changed_by_id: context.changedBy.id,
        notes: context.notes,
        metadata: context.metadata
      });

    return true;
  } catch (error) {
    console.error('Failed to update order status:', error);
    return false;
  }
}

/**
 * Get status display info for customer-facing UI
 */
export function getStatusDisplay(status: InternalOrderStatus) {
  return STATUS_DISPLAY_MAP[status] || {
    label: status,
    icon: '•',
    color: 'gray'
  };
}

/**
 * Get status history for an order
 */
export async function getOrderStatusHistory(orderId: string) {
  const { data, error } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch status history:', error);
    return [];
  }

  return data || [];
}

