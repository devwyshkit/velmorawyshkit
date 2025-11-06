/**
 * Order Type Definitions - Swiggy 2025 Pattern
 * 
 * Shared type definitions for order-related data structures
 * Extracted from existing types for consistency
 */

// Re-export Order from mock-orders for convenience
export { Order, type Order } from '../mock-orders';

// Order item type (simplified)
export interface OrderItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_image_url?: string;
  personalizations?: Array<{
    id: string;
    label?: string;
    price?: number;
    [key: string]: unknown;
  }>;
  preview_status?: string | null;
  preview_url?: string | string[] | null;
  preview_generated_at?: string | null;
  preview_approved_at?: string | null;
  preview_deadline?: string | null;
  revision_count?: number;
  revision_notes?: string | null;
  revision_requested_at?: string | null;
  customization_files?: string | string[] | null;
}

