import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

  const refreshCartCount = async () => {
    // Guest cart removed: default to server-backed count (not implemented yet)
    setCartCount(0);
    setCurrentPartnerId(null);
  };

  const clearCart = async () => {
    setCartCount(0);
    setCurrentPartnerId(null);
  };

  useEffect(() => {
    refreshCartCount();
    
    return () => {};
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

