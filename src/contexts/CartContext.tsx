import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getGuestCart, clearGuestCart } from "@/lib/integrations/supabase-client";

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
    const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
    setCartCount(count);
    
    // Track current partner from cart
    if (cart.length > 0 && cart[0].partner_id) {
      setCurrentPartnerId(cart[0].partner_id);
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

