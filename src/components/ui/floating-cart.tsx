import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";

export const FloatingCart = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return (
    <Button
      onClick={() => navigate("/cart")}
      className={cn(
        "fixed bottom-20 right-4 z-floating-cart h-14 w-14 rounded-full shadow-lg",
        "bg-primary text-primary-foreground hover:shadow-xl",
        "transition-all duration-300 hover:scale-105",
        className
      )}
      size="icon"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs bg-white text-primary min-w-[24px] border-2 border-primary"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      </div>
    </Button>
  );
};