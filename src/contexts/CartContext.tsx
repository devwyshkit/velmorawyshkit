import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getGuestCart } from "@/lib/integrations/supabase-client";

interface CartContextType {
  cartCount: number;
  refreshCartCount: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = () => {
    const cart = getGuestCart();
    const count = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
    setCartCount(count);
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
    <CartContext.Provider value={{ cartCount, refreshCartCount }}>
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

