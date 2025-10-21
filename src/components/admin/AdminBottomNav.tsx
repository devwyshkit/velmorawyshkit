/**
 * Admin Bottom Navigation (Mobile)
 * 5 key items + More menu
 * Follows same pattern as PartnerBottomNav
 */

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  MoreHorizontal,
  AlertCircle,
  BarChart3,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const AdminBottomNav = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  // Main 5 navigation items
  const mainNavItems = [
    { icon: LayoutDashboard, label: "Home", path: "/admin/dashboard" },
    { icon: Users, label: "Partners", path: "/admin/partners", badge: 18 },
    { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
    { icon: DollarSign, label: "Payouts", path: "/admin/payouts", badge: 120 },
  ];

  // Additional items in "More" menu
  const moreNavItems = [
    { icon: Package, label: "Product Approvals", path: "/admin/product-approvals", badge: 12 },
    { icon: AlertCircle, label: "Disputes", path: "/admin/disputes", badge: 5 },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: FileText, label: "Content", path: "/admin/content" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <>
      {/* Bottom Navigation Bar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t">
        <div className="grid grid-cols-5 h-16">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 relative transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute top-1 right-4 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              showMore
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="More options"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <Sheet open={showMore} onOpenChange={setShowMore}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
          <SheetHeader className="pb-4">
            <SheetTitle>More Options</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pb-6">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant={isActive ? "secondary" : "default"}>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={() => setShowMore(false)}
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};

