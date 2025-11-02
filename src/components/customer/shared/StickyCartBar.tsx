import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/customer/shared/CartSheet";

export const StickyCartBar = () => {
  const { cartCount, cartTotal } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Only show if cart has items
  if (cartCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-primary text-primary-foreground shadow-lg md:bottom-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5" />
            <div>
              <span className="font-medium">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
              <span className="mx-2">|</span>
              <span className="font-semibold">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setIsCartOpen(true)}
            size="sm"
            className="font-semibold"
          >
            VIEW CART →
          </Button>
        </div>
      </div>
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

