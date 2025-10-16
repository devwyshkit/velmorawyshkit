import { useNavigate } from "react-router-dom";
import { MapPin, User, ShoppingBag, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

interface CustomerMobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
  onBackClick?: () => void;
}

export const CustomerMobileHeader = ({
  showBackButton = false,
  title,
  onBackClick,
}: CustomerMobileHeaderProps) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1">
          {showBackButton ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleBackClick}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {title && <h1 className="text-lg font-semibold line-clamp-1">{title}</h1>}
            </>
          ) : (
            <>
              <img src="/wyshkit-customer-logo.png" alt="Wyshkit" className="h-8" />
              {/* Location with city name - Swiggy pattern */}
              <button 
                onClick={() => {}}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium max-w-[120px] truncate">Bangalore</span>
              </button>
            </>
          )}
        </div>
        
        {/* Desktop Only: Cart, Wishlist, Account icons (mobile uses bottom nav) */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/customer/cart")}
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer/wishlist")}
            aria-label="Wishlist"
          >
            <Heart className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer/profile")}
            aria-label="Account"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};

