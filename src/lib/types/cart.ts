/**
 * Cart Type Definitions - Swiggy 2025 Pattern
 * 
 * Shared type definitions for cart-related data structures
 * Extracted from existing types for consistency
 */

import { CartItemData } from '../integrations/supabase-data';

// Re-export CartItemData as CartItem for convenience
export type CartItem = CartItemData;

// Personalization/Add-on type
export interface Personalization {
  id: string;
  label: string;
  name?: string;
  price: number;
}

// Cart summary type
export interface CartSummary {
  itemCount: number;
  total: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount?: number;
}

