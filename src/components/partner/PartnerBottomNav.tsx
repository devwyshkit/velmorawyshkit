import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Home,
  Package,
  ShoppingBag,
  DollarSign,
  MoreHorizontal,
  Star,
  HelpCircle,
  User,
} from "lucide-react";

/**
 * Optimized Partner Bottom Navigation - Swiggy/Zomato Pattern
 * Consolidated to 5 items maximum (was 11 - overcrowded!)
 * "More" menu contains less-used features
 * 
 * Swiggy Partner App: 4 items (Home, Orders, Menu, More)
 * Zomato Partner App: 4 items (Home, Orders, Earnings, More)
 * Wyshkit: 5 items (Home, Products, Orders, Earnings, More)
 */
export const PartnerBottomNav = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // Only render on mobile (< 768px)
  if (!isMobile) return null;

  // Primary navigation items (most used)
  const primaryNavItems = [
    { icon: Home, label: "Home", path: "/partner/dashboard" },
    { icon: Package, label: "Products", path: "/partner/products" },
    { icon: ShoppingBag, label: "Orders", path: "/partner/orders", badge: 0 }, // TODO: Real count
    { icon: DollarSign, label: "Earnings", path: "/partner/earnings" },
  ];

  // Secondary navigation items (in "More" menu) - Swiggy 2025 pattern
  const secondaryNavItems = [
    { icon: Star, label: "Reviews", path: "/partner/reviews" },
    { icon: HelpCircle, label: "Help", path: "/partner/help" },
    { icon: User, label: "Profile", path: "/partner/profile" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-14 max-w-screen-xl mx-auto px-2">
          {/* Primary Items */}
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const showBadge = item.badge !== undefined && item.badge > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full relative",
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
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <Sheet open={showMoreSheet} onOpenChange={setShowMoreSheet}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full",
                  secondaryNavItems.some(item => location.pathname === item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="More options"
              >
                <MoreHorizontal className="h-6 w-6" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
              <SheetHeader>
                <SheetTitle>More Options</SheetTitle>
                <SheetDescription>
                  Additional partner features and account management options
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMoreSheet(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
};

