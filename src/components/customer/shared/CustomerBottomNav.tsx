import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { RouteMap } from "@/routes";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

export const CustomerBottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { cartCount } = useCart();

  const navItems = [
    { icon: Home, label: "Home", path: RouteMap.home() },
    { icon: Search, label: "Search", path: RouteMap.search() },
    { icon: ShoppingBag, label: "Cart", path: RouteMap.cart() },
    { icon: Heart, label: "Wishlist", path: RouteMap.wishlist() },
    { icon: User, label: "Account", path: RouteMap.profile() },
  ];

  // Only render on mobile - following original pattern
  if (!isMobile) return null;

  // Scroll-aware hide/reveal
  const [hidden, setHidden] = useState(false as boolean);
  const lastY = (globalThis as any).__bn_lastY || { current: 0 };
  ;(globalThis as any).__bn_lastY = lastY;
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY.current + 4;
      const goingUp = y < lastY.current - 4;
      if (goingDown && y > 24) setHidden(true);
      else if (goingUp) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-border safe-bottom transition-transform duration-200", hidden ? "translate-y-full" : "translate-y-0") }>
      <div className="flex items-center justify-around h-14 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          const showBadge = item.label === "Cart" && cartCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={showBadge ? `${item.label} with ${cartCount} items` : item.label}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs pointer-events-none"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

