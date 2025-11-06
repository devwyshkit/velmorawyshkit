/**
 * Mock Cart Storage
 * 
 * Manages cart items in localStorage for mock mode.
 * Provides cart operations without backend dependency.
 * 
 * Swiggy 2025 Pattern: localStorage-based cart for development testing
 */

import { safeGetItem, safeSetItem, safeRemoveItem } from './mock-storage';
import type { CartItemData } from './integrations/supabase-data';
// Phase 1 Cleanup: Removed mock-data-validator - simplified validation

const CART_STORAGE_KEY = 'wyshkit_mock_cart';

// Swiggy 2025 Pattern: Clean type names without "Mock" prefix
export type CartItem = CartItemData;

/**
 * Get all cart items from localStorage
 */
export const getCartItems = (): CartItem[] => {
  // Phase 1 Cleanup: Simplified validation - removed validator dependency
  const items = safeGetItem<CartItem[]>(CART_STORAGE_KEY, { 
    defaultValue: [],
  });
  return items || [];
};

/**
 * Add item to cart
 */
export const addToCart = (item: CartItemData): boolean => {
  const cartItems = getCartItems();
  
  // Check if item already exists (same item_id and store_id)
  // Match by item_id (for product matching) or id (fallback)
  const existingIndex = cartItems.findIndex(
    (cartItem) => 
      (cartItem.item_id === item.item_id || cartItem.item_id === item.id || cartItem.id === item.id) &&
      cartItem.store_id === item.store_id
  );

  if (existingIndex >= 0) {
    // Update quantity
    cartItems[existingIndex].quantity += item.quantity || 1;
  } else {
    // Add new item
    const newItem: CartItem = {
      ...item,
      item_id: item.item_id || item.id, // Ensure item_id is set for product matching
      quantity: item.quantity || 1,
      price: item.price || 0,
      store_id: item.store_id || '',
      name: item.name || 'Product',
      image: item.image,
      personalizations: item.addOns?.map(addon => ({
        id: addon.id,
        label: addon.name,
        price: addon.price
      })) || [],
    };
    cartItems.push(newItem);
  }

  const success = safeSetItem(CART_STORAGE_KEY, cartItems);
  
  // Dispatch custom event for same-tab sync
  if (success && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mockStorageChange', {
      detail: { key: CART_STORAGE_KEY }
    }));
  }
  
  return success;
};

/**
 * Update cart item quantity
 */
export const updateCartQuantity = (itemId: string, quantity: number): boolean => {
  if (quantity <= 0) {
    return removeFromCart(itemId);
  }

  const cartItems = getCartItems();
  const itemIndex = cartItems.findIndex((item) => item.id === itemId);

  if (itemIndex >= 0) {
    cartItems[itemIndex].quantity = quantity;
    const success = safeSetItem(CART_STORAGE_KEY, cartItems);
    
    // Dispatch custom event for same-tab sync
    if (success && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mockStorageChange', {
        detail: { key: CART_STORAGE_KEY }
      }));
    }
    
    return success;
  }

  return false;
};

/**
 * Remove item from cart
 */
export const removeFromCart = (itemId: string): boolean => {
  const cartItems = getCartItems();
  const filtered = cartItems.filter((item) => item.id !== itemId);
  const success = safeSetItem(CART_STORAGE_KEY, filtered);
  
  // Dispatch custom event for same-tab sync
  if (success && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mockStorageChange', {
      detail: { key: CART_STORAGE_KEY }
    }));
  }
  
  return success;
};

/**
 * Clear all items from cart
 */
export const clearCart = (): boolean => {
  const success = safeSetItem(CART_STORAGE_KEY, []);
  
  // Dispatch custom event for same-tab sync
  if (success && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mockStorageChange', {
      detail: { key: CART_STORAGE_KEY }
    }));
  }
  
  return success;
};

/**
 * Get cart count (total quantity)
 */
export const getCartCount = (): number => {
  const cartItems = getCartItems();
  return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
};

/**
 * Get cart total price
 */
export const getCartTotal = (): number => {
  const cartItems = getCartItems();
  return cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0);
};

/**
 * Pre-populate cart with sample items for testing
 */
export const prePopulateCart = (): void => {
  const existingCart = getCartItems();
  if (existingCart.length > 0) {
    // Don't overwrite existing cart
    return;
  }

  const sampleItems: CartItem[] = [
    {
      id: 'mock-item-1',
      item_id: 'mock-item-1', // Set item_id for product matching
      name: 'Custom Birthday Cake',
      price: 89900, // ₹899 in paise
      quantity: 1,
      store_id: 'mock-store-1',
      image: 'https://via.placeholder.com/200',
      personalizations: [
        { id: '1', label: 'Gift Wrap', price: 0 },
        { id: '2', label: 'Personal Message', price: 0 },
      ],
    },
    {
      id: 'mock-item-2',
      item_id: 'mock-item-2', // Set item_id for product matching
      name: 'Anniversary Gift Box',
      price: 149900, // ₹1499 in paise
      quantity: 2,
      store_id: 'mock-store-1',
      image: 'https://via.placeholder.com/200',
      personalizations: [],
    },
  ];

  safeSetItem(CART_STORAGE_KEY, sampleItems);
};

