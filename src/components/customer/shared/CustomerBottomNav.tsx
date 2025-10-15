import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export const CustomerBottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    { icon: Home, label: "Home", path: "/customer/home" },
    { icon: Search, label: "Search", path: "/customer/search" },
    { icon: ShoppingBag, label: "Cart", path: "/customer/cart" },
    { icon: Heart, label: "Wishlist", path: "/customer/wishlist" },
    { icon: User, label: "Account", path: "/customer/profile" },
  ];

  // Only render on mobile - following original pattern
  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

