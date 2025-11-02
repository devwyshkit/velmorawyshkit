import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCartItems } from "@/lib/integrations/supabase-data";

interface CartContextType {
  cartCount: number;
  currentStoreId: string | null;
  refreshCartCount: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);

  const refreshCartCount = async () => {
    try {
      const items = await fetchCartItems();
      const totalCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(totalCount);
      
      // Set currentStoreId from first item
      if (items.length > 0 && items[0].store_id) {
        setCurrentStoreId(items[0].store_id);
      } else {
        setCurrentStoreId(null);
      }
    } catch (error) {
      console.error('Error refreshing cart count:', error);
      setCartCount(0);
      setCurrentStoreId(null);
    }
  };

  const clearCart = async () => {
    // Clear both localStorage and state
    try {
      localStorage.removeItem('mock_cart');
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
    setCartCount(0);
    setCurrentStoreId(null);
  };

  useEffect(() => {
    refreshCartCount();
    
    return () => {};
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, currentStoreId, refreshCartCount, clearCart }}>
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

