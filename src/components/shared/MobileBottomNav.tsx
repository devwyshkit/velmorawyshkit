import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

interface MobileBottomNavProps {
  items: NavItem[];
}

/**
 * Generic mobile bottom navigation component
 * Reusable across Customer, Partner, and Admin platforms
 * Follows Swiggy/Zomato mobile-first pattern
 * 
 * Usage:
 * <MobileBottomNav items={[
 *   { icon: Home, label: "Home", path: "/partner/home" },
 *   { icon: Package, label: "Products", path: "/partner/products", badge: 5 }
 * ]} />
 */
export const MobileBottomNav = ({ items }: MobileBottomNavProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Only render on mobile (< 768px)
  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-14 max-w-screen-xl mx-auto px-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = item.badge !== undefined && item.badge > 0;

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
              aria-label={showBadge ? `${item.label} with ${item.badge} items` : item.label}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {showBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] rounded-full"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

