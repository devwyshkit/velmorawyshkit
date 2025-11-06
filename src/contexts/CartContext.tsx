import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
// Phase 1 Cleanup: Removed Supabase imports - pure mock mode
import { CartItemData } from "@/lib/integrations/supabase-data";
import {
  getCartItems,
  addToCart as addToCartStorage,
  updateCartQuantity as updateCartQuantityStorage,
  removeFromCart as removeFromCartStorage,
  clearCart as clearCartStorage,
  getCartCount,
  getCartTotal,
  prePopulateCart,
} from "@/lib/mock-cart";

interface CartContextType {
  cartCount: number;
  cartTotal: number;
  currentStoreId: string | null;
  refreshCartCount: () => Promise<void>;
  clearCart: () => Promise<void>;
  addToCart: (item: CartItemData) => Promise<boolean>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeCartItem: (itemId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to initialize cart state synchronously (Swiggy 2025 pattern)
const initializeCartState = () => {
  try {
    // Pre-populate cart if empty (synchronous check)
    const items = getCartItems();
    if (items.length === 0) {
      prePopulateCart();
      // Re-fetch after pre-population
      const updatedItems = getCartItems();
      const totalCount = getCartCount();
      const total = getCartTotal();
      const storeId = updatedItems.length > 0 && updatedItems[0].store_id ? updatedItems[0].store_id : null;
      return { cartCount: totalCount, cartTotal: total, currentStoreId: storeId };
    }
    
    // Cart already has items - load synchronously
    const totalCount = getCartCount();
    const total = getCartTotal();
    const storeId = items.length > 0 && items[0].store_id ? items[0].store_id : null;
    return { cartCount: totalCount, cartTotal: total, currentStoreId: storeId };
  } catch (error) {
    // Silent error handling - return empty state (Swiggy 2025 pattern)
    return { cartCount: 0, cartTotal: 0, currentStoreId: null };
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Swiggy 2025: Initialize cart state synchronously to prevent flash
  const initialCartState = initializeCartState();
  const [cartCount, setCartCount] = useState(initialCartState.cartCount);
  const [cartTotal, setCartTotal] = useState(initialCartState.cartTotal);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(initialCartState.currentStoreId);
  // Debounce refs to prevent flickering (Swiggy 2025 pattern)
  const storageDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const customEventDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const refreshCartCount = async () => {
    try {
      // Phase 1 Cleanup: Always use mock cart - no conditionals
      const items = getCartItems();
      const totalCount = getCartCount();
      const total = getCartTotal();
      
      setCartCount(totalCount);
      setCartTotal(total);
      
      // Set currentStoreId from first item
      if (items.length > 0 && items[0].store_id) {
        setCurrentStoreId(items[0].store_id);
      } else {
        setCurrentStoreId(null);
      }
    } catch (error) {
      // Silent error handling - show empty state (Swiggy 2025 pattern)
      setCartCount(0);
      setCartTotal(0);
      setCurrentStoreId(null);
    }
  };

  const clearCart = async () => {
    // Phase 1 Cleanup: Always use mock cart - no conditionals
    clearCartStorage();
    setCartCount(0);
    setCartTotal(0);
    setCurrentStoreId(null);
  };

  // Common cart operations (DRY principle - single source of truth)
  const addToCart = async (item: CartItemData): Promise<boolean> => {
    try {
      // Phase 1 Cleanup: Always use mock cart - no conditionals
      const success = addToCartStorage(item);
      if (success) {
        await refreshCartCount();
      }
      return success;
    } catch (error) {
      // Silent error handling (Swiggy 2025 pattern)
      return false;
    }
  };

  const updateCartQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    try {
      // Phase 1 Cleanup: Always use mock cart - no conditionals
      const success = updateCartQuantityStorage(itemId, quantity);
      if (success) {
        await refreshCartCount();
      }
      return success;
    } catch (error) {
      // Silent error handling (Swiggy 2025 pattern)
      return false;
    }
  };

  const removeCartItem = async (itemId: string): Promise<boolean> => {
    try {
      // Phase 1 Cleanup: Always use mock cart - no conditionals
      const success = removeFromCartStorage(itemId);
      if (success) {
        await refreshCartCount();
      }
      return success;
    } catch (error) {
      // Silent error handling (Swiggy 2025 pattern)
      return false;
    }
  };

  useEffect(() => {
    // Swiggy 2025: Only sync cross-tab changes and event listeners
    // Cart state is already initialized synchronously above
    // No need to call refreshCartCount() here - it's already initialized
    
    // Listen for storage changes (cross-tab sync) with debouncing (Swiggy 2025 pattern)
    const handleStorageChange = (e: StorageEvent) => {
      // Phase 1 Cleanup: Always sync mock storage - no conditionals
      // Sync cart across tabs with 200ms debounce to prevent flickering
      if (e.key === 'wyshkit_mock_cart') {
        if (storageDebounceRef.current) {
          clearTimeout(storageDebounceRef.current);
        }
        storageDebounceRef.current = setTimeout(() => {
          refreshCartCount();
        }, 200);
      }
      // Sync orders across tabs
      if (e.key === 'wyshkit_mock_orders') {
        // Orders page will handle its own refresh
      }
      // Sync addresses across tabs
      if (e.key === 'wyshkit_mock_addresses') {
        // AddressSelectionSheet will handle its own refresh
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for same-tab changes (CustomEvent) with debouncing
    const handleCustomStorageChange = (e: CustomEvent) => {
      // Phase 1 Cleanup: Always sync mock storage - no conditionals
      // Debounce to prevent flickering (Swiggy 2025 pattern)
      if (e.detail?.key === 'wyshkit_mock_cart') {
        if (customEventDebounceRef.current) {
          clearTimeout(customEventDebounceRef.current);
        }
        customEventDebounceRef.current = setTimeout(() => {
          refreshCartCount();
        }, 200);
      }
    };
    
    window.addEventListener('mockStorageChange', handleCustomStorageChange as EventListener);
    
    return () => {
      // Clear debounce timeouts on cleanup
      if (storageDebounceRef.current) {
        clearTimeout(storageDebounceRef.current);
      }
      if (customEventDebounceRef.current) {
        clearTimeout(customEventDebounceRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mockStorageChange', handleCustomStorageChange as EventListener);
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, cartTotal, currentStoreId, refreshCartCount, clearCart, addToCart, updateCartQuantity, removeCartItem }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

