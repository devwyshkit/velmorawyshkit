/**
 * Admin Sidebar Navigation
 * Reusable nav component for both desktop sidebar and mobile drawer
 */

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  AlertCircle,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AdminSidebarNavProps {
  onNavigate?: () => void; // Callback for mobile drawer close
}

export const AdminSidebarNav = ({ onNavigate }: AdminSidebarNavProps) => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Partners", path: "/admin/partners", badge: 18 },
    { icon: Package, label: "Product Approvals", path: "/admin/product-approvals", badge: 12 },
    { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
    { icon: AlertCircle, label: "Disputes", path: "/admin/disputes", badge: 5 },
    { icon: DollarSign, label: "Payouts", path: "/admin/payouts", badge: 120 },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: FileText, label: "Content", path: "/admin/content" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <nav className="space-y-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge variant={isActive ? "secondary" : "default"} className="text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

