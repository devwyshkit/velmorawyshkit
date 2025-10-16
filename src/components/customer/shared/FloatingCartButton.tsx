import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface FloatingCartButtonProps {
  className?: string;
}

export const FloatingCartButton = ({ className }: FloatingCartButtonProps) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  // Only show if cart has items
  if (cartCount === 0) return null;

  return (
    <Button
      onClick={() => navigate("/customer/cart")}
      className={cn(
        "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110",
        "bg-primary text-primary-foreground",
        "md:bottom-4",
        className
      )}
      size="icon"
      aria-label={`View cart with ${cartCount} items`}
    >
      <div className="relative">
        <ShoppingBag className="h-6 w-6" />
        {cartCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-3 -right-3 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold rounded-full"
          >
            {cartCount > 9 ? '9+' : cartCount}
          </Badge>
        )}
      </div>
    </Button>
  );
};

