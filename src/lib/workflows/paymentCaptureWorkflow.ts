// Payment Capture Workflow
// Automatically captures payment after preview approval (Fiverr 2025 pattern)
// Phase 1 Cleanup: Mock version - will be replaced with real Edge Function later

import { getOrderById, getOrdersByCustomer, updateOrderStatus } from '@/lib/mock-orders';

export interface PaymentCaptureResult {
  success: boolean;
  orderId: string;
  paymentOrderId?: string;
  error?: string;
}

/**
 * Listen to order_items preview_status changes
 * When preview_status = 'preview_approved' → trigger payment capture
 * This should be called via Supabase Edge Function or webhook
 */
export async function handlePreviewApproved(orderItemId: string): Promise<PaymentCaptureResult> {
  try {
    // Phase 1 Cleanup: Mock version - find order item from mock storage
    // In production, this will call Edge Function
    
    // Find order item by searching through all mock orders
    // Get user ID from mock user (will be replaced with actual user context in production)
    const mockUserId = 'mock-user-123'; // From getMockUser() - consistent across app
    const allMockOrders = getOrdersByCustomer(mockUserId);
    let orderItem: any = null;
    let order: any = null;
    
    for (const mockOrder of allMockOrders) {
      const item = mockOrder.order_items.find((item: any) => item.id === orderItemId);
      if (item) {
        orderItem = item;
        order = mockOrder;
        break;
      }
    }
    
    if (!orderItem || !order) {
      return {
        success: false,
        orderId: '',
        error: 'Order item not found',
      };
    }
    
    const orderId = order.id;
    
    // Check if all items in order have approved previews
    // Simplified rule: If personalizations exist, preview required
    const itemsNeedingPreview = order.order_items.filter((item: any) => 
      item.personalizations && 
      Array.isArray(item.personalizations) &&
      item.personalizations.length > 0
    ) || [];
    
    // If order has items needing preview, check if all are approved
    if (itemsNeedingPreview.length > 0) {
      const allApproved = itemsNeedingPreview.every((item: any) => 
        item.preview_status === 'preview_approved'
      );
      
      if (!allApproved) {
        // Not all previews approved yet, wait
        return {
          success: false,
          orderId,
          error: 'Waiting for all previews to be approved',
        };
      }
    }
    
    // All previews approved - trigger payment capture (mock)
    // Phase 6: This will call Edge Function to capture Razorpay payment
    // For now, just update order status to production
    updateOrderStatus(orderId, 'in_production');
    
    return {
      success: true,
      orderId,
      paymentOrderId: `mock_payment_${orderId}`,
    };
  } catch (error: any) {
    return {
      success: false,
      orderId: '',
      error: error.message || 'Failed to capture payment',
    };
  }
}

/**
 * Setup polling for preview status changes (Phase 1 Cleanup)
 * Phase 6: Will be replaced with real-time subscription or Edge Function trigger
 */
export function setupPreviewStatusPolling(
  onPreviewApproved: (orderItemId: string) => void,
  orderItemId: string
) {
  // Poll every 5 seconds to check if preview is approved
  const intervalId = setInterval(async () => {
    const result = await handlePreviewApproved(orderItemId);
    if (result.success) {
      onPreviewApproved(orderItemId);
      clearInterval(intervalId);
    }
  }, 5000);
  
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Manual payment capture (for admin use)
 */
export async function manualCapturePayment(orderId: string): Promise<PaymentCaptureResult> {
  try {
    // Phase 1 Cleanup: Mock version
    const mockOrder = getOrderById(orderId);
    
    if (!mockOrder) {
      return {
        success: false,
        orderId,
        error: 'Order not found',
      };
    }
    
    // Update order status to production (simulating payment capture)
    updateOrderStatus(orderId, 'in_production');
    
    return {
      success: true,
      orderId,
      paymentOrderId: `mock_payment_${orderId}`,
    };
  } catch (error: any) {
    return {
      success: false,
      orderId,
      error: error.message || 'Failed to capture payment',
    };
  }
}
