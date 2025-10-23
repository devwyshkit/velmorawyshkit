import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getGuestCart, setGuestCart, clearGuestCart } from "@/lib/integrations/supabase-client";

interface CartContextType {
  cartCount: number;
  currentPartnerId: string | null;
  refreshCartCount: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(null);

  const refreshCartCount = () => {
    const cart = getGuestCart();
    
    // Validate cart items - filter out items with invalid IDs (old data cleanup)
    const validCart = cart.filter((item: any) => {
      // Valid UUID format check (UUIDs are 36 chars with dashes)
      const isValidItemId = item.id && item.id.length >= 36;
      const isValidPartnerId = item.partner_id && item.partner_id.length >= 36;
      return isValidItemId && isValidPartnerId;
    });
    
    // Auto-clean invalid items from localStorage
    if (validCart.length !== cart.length) {
      setGuestCart(validCart);
    }
    
    const count = validCart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
    setCartCount(count);
    
    // Track current partner from valid cart
    if (validCart.length > 0 && validCart[0].partner_id) {
      setCurrentPartnerId(validCart[0].partner_id);
    } else {
      setCurrentPartnerId(null);
    }
  };

  const clearCart = () => {
    clearGuestCart();
    setCartCount(0);
    setCurrentPartnerId(null);
  };

  useEffect(() => {
    refreshCartCount();
    
    // Listen for storage changes (for cart updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wyshkit_guest_cart') {
        refreshCartCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, currentPartnerId, refreshCartCount, clearCart }}>
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

