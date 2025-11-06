import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { RouteMap } from "@/routes";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { CartSheet } from "@/components/customer/shared/CartSheet";
import { AccountSheet } from "@/components/customer/shared/AccountSheet";
import { useScrollVisibility } from "@/contexts/ScrollContext";

/**
 * CustomerBottomNav - Swiggy 2025 Pattern
 * 
 * Behavior:
 * - Fixed at bottom with 8px gap from screen edge
 * - Height: 56px (h-14)
 * - Hides on scroll down, shows on scroll up
 * - Z-index: 50 (highest for nav)
 * - Rounded top corners (rounded-t-lg)
 * - 5 items: Home, Search, Favourites, Cart, Account
 */
export const CustomerBottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { cartCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", path: RouteMap.home() },
    { icon: Search, label: "Search", path: RouteMap.search() },
    { icon: Heart, label: "Favourites", path: RouteMap.favorites() },
  ];

  // Swiggy 2025: Nav hides on scroll down, shows on scroll up
  const { isHidden } = useScrollVisibility();

  // Only render on mobile (Swiggy 2025 pattern)
  if (!isMobile) return null;

  return (
    <>
      <nav
        role="navigation"
        aria-label="Primary navigation"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "h-14 bg-white border-t border-border shadow-lg",
          "pwa-safe-bottom transition-transform duration-200",
          isHidden ? "translate-y-full" : "translate-y-0"
        )}
      >
        <div className="flex items-center justify-around h-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                  "transition-colors relative",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Cart button - opens sheet (Swiggy 2025 pattern) */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full",
              "transition-colors relative",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              "text-muted-foreground hover:text-foreground"
            )}
            aria-label={cartCount > 0 ? `Cart with ${cartCount} items` : "Cart"}
          >
            <div className="relative">
              <ShoppingBag className="h-6 w-6" />
              {cartCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs pointer-events-none"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">Cart</span>
          </button>
          
          {/* Account button - opens bottom sheet (Swiggy 2025 pattern) */}
          <button
            onClick={() => setIsAccountOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full",
              "transition-colors relative",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isAccountOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Account"
          >
            <div className="relative">
              <User className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">Account</span>
          </button>
        </div>
      </nav>
      
      {/* Cart Sheet Modal */}
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Account Sheet Modal (Swiggy 2025 pattern - bottom sheet) */}
      <AccountSheet isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
    </>
  );
};
