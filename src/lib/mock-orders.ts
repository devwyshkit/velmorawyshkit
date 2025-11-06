/**
 * Mock Orders Storage
 * 
 * Manages orders in localStorage for mock mode.
 * Provides order operations without backend dependency.
 * 
 * Swiggy 2025 Pattern: localStorage-based orders for development testing
 */

import { safeGetItem, safeSetItem } from './mock-storage';
// Phase 1 Cleanup: Removed mock-data-validator - simplified validation

const ORDERS_STORAGE_KEY = 'wyshkit_mock_orders';

// Swiggy 2025 Pattern: Clean type names without "Mock" prefix
export interface Order {
  id: string;
  order_number?: string;
  customer_id: string;
  store_id?: string;
  status: string;
  total_amount: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  delivery_address: {
    house: string;
    area: string;
    city: string;
    pincode: string;
    name: string;
    phone: string;
    label?: string;
  };
  payment_method: string;
  gstin?: string;
  is_business_order?: boolean;
  order_items: Array<{
    id: string;
    item_id: string;
    item_name: string;
    item_image_url?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    personalizations?: Array<{ id: string; label?: string; price?: number; [key: string]: unknown }>;
    preview_status?: string | null;
    preview_url?: string | string[] | null;
    preview_generated_at?: string | null;
    preview_approved_at?: string | null;
    preview_deadline?: string | null;
    revision_count?: number;
    revision_notes?: string | null;
    revision_requested_at?: string | null;
    customization_files?: string | string[] | null;
  }>;
}

import { generateOrderId } from './utils/id-generator';

/**
 * Generate a mock order ID
 * Swiggy 2025: Use centralized ID generator
 */
const generateMockOrderId = (): string => {
  return generateOrderId();
};

/**
 * Get all orders from localStorage
 */
export const getOrders = (): Order[] => {
  // Phase 1 Cleanup: Simplified validation - removed validator dependency
  const orders = safeGetItem<Order[]>(ORDERS_STORAGE_KEY, {
    defaultValue: [],
  });
  return orders || [];
};

/**
 * Get order by ID
 */
export const getOrderById = (orderId: string): Order | null => {
  const orders = getOrders();
  return orders.find((order) => order.id === orderId || order.order_number === orderId) || null;
};

/**
 * Get orders for a specific customer
 */
export const getOrdersByCustomer = (customerId: string): Order[] => {
  const orders = getOrders();
  return orders.filter((order) => order.customer_id === customerId);
};

/**
 * Create a new mock order
 */
export const createOrder = (orderData: {
  customer_id: string;
  store_id?: string;
  items: Array<{
    id: string;
    name: string;
    image?: string;
    quantity: number;
    price: number;
    personalizations?: any[];
  }>;
  delivery_address: {
    house: string;
    area: string;
    city: string;
    pincode: string;
    name: string;
    phone: string;
    label?: string;
  };
  payment_method: string;
  gstin?: string;
  total_amount: number;
  status?: string;
}): Order => {
  const orders = getOrders();
  const now = new Date().toISOString();
  
  const orderId = generateMockOrderId();
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
  
  const subtotal = orderData.total_amount;
  // Simplified rule: If personalizations exist, preview required
  const needsFiles = orderData.items.some((item) =>
    item.personalizations?.length > 0
  );

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    customer_id: orderData.customer_id,
    store_id: orderData.store_id,
    status: orderData.status || (needsFiles ? 'preview_pending' : 'confirmed'),
    total_amount: orderData.total_amount,
    subtotal: subtotal,
    created_at: now,
    updated_at: now,
    delivery_address: orderData.delivery_address,
    payment_method: orderData.payment_method,
    gstin: orderData.gstin,
    is_business_order: !!orderData.gstin,
    order_items: orderData.items.map((item) => ({
      id: generateId('mock_order_item'),
      item_id: item.id,
      item_name: item.name,
      item_image_url: item.image,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      personalizations: item.personalizations || [],
      preview_status: item.personalizations?.length > 0
        ? 'pending'
        : null,
    })),
  };

  orders.unshift(newOrder); // Add to beginning
  const success = safeSetItem(ORDERS_STORAGE_KEY, orders);
  
  // Log for debugging (can be removed later)
  console.log('Mock order created:', {
    id: newOrder.id,
    order_number: newOrder.order_number,
    status: newOrder.status,
    total_amount: newOrder.total_amount,
    items_count: newOrder.order_items.length,
    saved: success
  });
  
  // Dispatch custom event for same-tab sync
  if (success && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mockStorageChange', {
      detail: { key: ORDERS_STORAGE_KEY }
    }));
  }

  if (!success) {
    console.error('Failed to save order to localStorage');
  }

  return newOrder;
};

/**
 * Update order status
 */
export const updateOrderStatus = (orderId: string, status: string, metadata?: Record<string, any>): boolean => {
  const orders = getOrders();
  const orderIndex = orders.findIndex((order) => order.id === orderId || order.order_number === orderId);

  if (orderIndex >= 0) {
    orders[orderIndex].status = status;
    orders[orderIndex].updated_at = new Date().toISOString();
    
    // Add metadata if provided (e.g., cancellation_reason, cancellation_notes, etc.)
    if (metadata) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        ...metadata,
      };
    }
    
    // Dispatch custom event for same-tab sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockStorageChange', {
        detail: { key: ORDERS_STORAGE_KEY }
      }));
    }
    
    return safeSetItem(ORDERS_STORAGE_KEY, orders);
  }

  return false;
};

/**
 * Update order item preview status (for approval/revision)
 */
export const updateOrderItemPreview = (
  orderItemId: string,
  updates: {
    preview_status?: string | null;
    preview_approved_at?: string | null;
    preview_url?: string | string[] | null;
    preview_generated_at?: string | null;
    preview_deadline?: string | null;
    revision_count?: number;
    revision_notes?: string | null;
    revision_requested_at?: string | null;
    customization_files?: string | string[] | null;
  }
): boolean => {
  const orders = getOrders();
  
  for (const order of orders) {
    const itemIndex = order.order_items.findIndex((item: any) => item.id === orderItemId);
    if (itemIndex >= 0) {
      // Update the item
      order.order_items[itemIndex] = {
        ...order.order_items[itemIndex],
        ...updates,
      };
      
      // Update order status if all items are approved
      if (updates.preview_status === 'preview_approved') {
        const allApproved = order.order_items.every((item: any) => 
          item.preview_status === 'preview_approved' || item.preview_status === null
        );
        if (allApproved && order.status === 'preview_pending') {
          order.status = 'in_production';
        }
      }
      
      order.updated_at = new Date().toISOString();
      
      // Dispatch custom event for same-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mockStorageChange', {
          detail: { key: ORDERS_STORAGE_KEY }
        }));
      }
      
      return safeSetItem(ORDERS_STORAGE_KEY, orders);
    }
  }
  
  return false;
};

/**
 * Get order item by ID
 */
export const getOrderItemById = (orderItemId: string): any | null => {
  const orders = getOrders();
  
  for (const order of orders) {
    const item = order.order_items.find((item: any) => item.id === orderItemId);
    if (item) {
      return {
        ...item,
        order_id: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          created_at: order.created_at,
        },
      };
    }
  }
  
  return null;
};

/**
 * Generate mock preview for an order item (simulate vendor creating preview)
 * Updates status from 'pending' → 'preview_ready' with sample preview URLs
 */
export const generatePreview = (orderItemId: string): boolean => {
  const orders = getOrders();
  
  for (const order of orders) {
    const itemIndex = order.order_items.findIndex((item: any) => item.id === orderItemId);
    if (itemIndex >= 0) {
      const item = order.order_items[itemIndex];
      
      // Only generate preview if status is 'pending'
      if (item.preview_status !== 'pending') {
        return false;
      }
      
      // Generate sample preview URLs (using placeholder images)
      const previewUrls = [
        `https://picsum.photos/seed/${orderItemId}/800/600`,
        `https://picsum.photos/seed/${orderItemId}_2/800/600`,
      ];
      
      // Set preview deadline (48 hours from now)
      const previewDeadline = new Date();
      previewDeadline.setHours(previewDeadline.getHours() + 48);
      
      // Update the item
      order.order_items[itemIndex] = {
        ...item,
        preview_status: 'preview_ready',
        preview_url: previewUrls,
        preview_generated_at: new Date().toISOString(),
        preview_deadline: previewDeadline.toISOString(),
      };
      
      // Update order status if needed
      if (order.status === 'preview_pending') {
        // Keep as preview_pending until user approves
        // Status will change to 'in_production' after approval
      }
      
      order.updated_at = new Date().toISOString();
      
      // Dispatch custom event for same-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mockStorageChange', {
          detail: { key: ORDERS_STORAGE_KEY }
        }));
      }
      
      return safeSetItem(ORDERS_STORAGE_KEY, orders);
    }
  }
  
  return false;
};

/**
 * Update customization files for an order item (after file upload)
 */
export const updateOrderItemFiles = (
  orderItemId: string,
  customizationFiles: string[]
): boolean => {
  const orders = getOrders();
  
  for (const order of orders) {
    const itemIndex = order.order_items.findIndex((item: any) => item.id === orderItemId);
    if (itemIndex >= 0) {
      order.order_items[itemIndex] = {
        ...order.order_items[itemIndex],
        customization_files: customizationFiles,
      };
      
      order.updated_at = new Date().toISOString();
      
      // Dispatch custom event for same-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mockStorageChange', {
          detail: { key: ORDERS_STORAGE_KEY }
        }));
      }
      
      return safeSetItem(ORDERS_STORAGE_KEY, orders);
    }
  }
  
  return false;
};

/**
 * Pre-populate orders with sample data for testing
 */
export const prePopulateOrders = (customerId: string): void => {
  const existingOrders = getOrdersByCustomer(customerId);
  if (existingOrders.length > 0) {
    // Don't overwrite existing orders
    return;
  }

  const now = new Date();
  const sampleOrders: Order[] = [
    {
      id: 'mock_order_sample_1',
      order_number: 'ORD-12345678',
      customer_id: customerId,
      store_id: 'mock-store-1',
      status: 'delivered',
      total_amount: 89900,
      subtotal: 89900,
      created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updated_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      delivery_address: {
        house: '123',
        area: 'MG Road',
        city: 'Bangalore',
        pincode: '560001',
        name: 'Test User',
        phone: '+919876543210',
        label: 'Home',
      },
      payment_method: 'card',
      order_items: [
        {
          id: 'mock_order_item_1',
          item_id: 'mock-item-1',
          item_name: 'Custom Birthday Cake',
          item_image_url: 'https://via.placeholder.com/200',
          quantity: 1,
          unit_price: 89900,
          total_price: 89900,
          personalizations: [],
          preview_status: null,
        },
      ],
    },
    {
      id: 'mock_order_sample_2',
      order_number: 'ORD-87654321',
      customer_id: customerId,
      store_id: 'mock-store-1',
      status: 'in_production',
      total_amount: 149900,
      subtotal: 149900,
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      delivery_address: {
        house: '456',
        area: 'Koramangala',
        city: 'Bangalore',
        pincode: '560095',
        name: 'Test User',
        phone: '+919876543210',
        label: 'Work',
      },
      payment_method: 'upi',
      order_items: [
        {
          id: 'mock_order_item_2',
          item_id: 'mock-item-2',
          item_name: 'Anniversary Gift Box',
          item_image_url: 'https://via.placeholder.com/200',
          quantity: 2,
          unit_price: 74950,
          total_price: 149900,
          personalizations: [
            { id: '1', label: 'Gift Wrap', type: 'addon' },
          ],
          preview_status: null,
        },
      ],
    },
    {
      id: 'mock_order_sample_3',
      order_number: 'ORD-11223344',
      customer_id: customerId,
      store_id: 'mock-store-1',
      status: 'preview_pending',
      total_amount: 299900,
      subtotal: 299900,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      delivery_address: {
        house: '789',
        area: 'Indiranagar',
        city: 'Bangalore',
        pincode: '560038',
        name: 'Test User',
        phone: '+919876543210',
        label: 'Home',
      },
      payment_method: 'card',
      order_items: [
        {
          id: 'mock_order_item_3',
          item_id: 'mock-item-3',
          item_name: 'Custom Wedding Gift',
          item_image_url: 'https://via.placeholder.com/200',
          quantity: 1,
          unit_price: 299900,
          total_price: 299900,
          personalizations: [
            { id: '1', label: 'Custom Engraving', type: 'personalization' },
          ],
          preview_status: 'pending',
        },
      ],
    },
  ];

  const allOrders = getOrders();
  allOrders.push(...sampleOrders);
  safeSetItem(ORDERS_STORAGE_KEY, allOrders);
};

