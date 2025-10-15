import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  BarChart3, 
  Settings,
  Users,
  Store,
  AlertTriangle,
  Target,
  Phone,
  User
} from "lucide-react";

interface BusinessSidebarProps {
  role: "seller" | "admin" | "kam";
}

export function BusinessSidebar({ role }: BusinessSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const getNavigationItems = () => {
    switch (role) {
      case "seller":
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/seller/dashboard" },
          { icon: Package, label: "Products", path: "/seller/products" },
          { icon: ShoppingBag, label: "Orders", path: "/seller/orders" },
          { icon: BarChart3, label: "Analytics", path: "/seller/analytics" },
        ];
      case "admin":
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
          { icon: Store, label: "Vendors", path: "/admin/vendor-management" },
          { icon: Users, label: "KAM Mgmt", path: "/admin/kam-management" },
          { icon: Settings, label: "Platform", path: "/admin/platform-config" },
          { icon: AlertTriangle, label: "Disputes", path: "/admin/dispute-escalations" },
          { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
        ];
      case "kam":
        return [
          { icon: LayoutDashboard, label: "Dashboard", path: "/kam/dashboard" },
          { icon: Users, label: "Vendors", path: "/kam/vendors" },
          { icon: Target, label: "Onboarding", path: "/kam/onboarding" },
          { icon: Phone, label: "Disputes", path: "/kam/disputes" },
          { icon: BarChart3, label: "Analytics", path: "/kam/analytics" },
        ];
      default:
        return [];
    }
  };

  const getBrandInfo = () => {
    switch (role) {
      case "seller":
        return { title: "WYSHKIT", subtitle: "Seller Central" };
      case "admin":
        return { title: "WYSHKIT", subtitle: "Admin Panel" };
      case "kam":
        return { title: "WYSHKIT", subtitle: "KAM Dashboard" };
      default:
        return { title: "WYSHKIT", subtitle: "Dashboard" };
    }
  };

  const navigationItems = getNavigationItems();
  const brandInfo = getBrandInfo();
  
  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigationItems.some((item) => isActive(item.path));
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar>
      {/* Header with WYSHKIT Branding */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <img 
            src="/wyshkit-business-logo.png" 
            alt="Wyshkit Business" 
            className="w-12 h-12 rounded-xl object-contain flex-shrink-0"
          />
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-primary">{brandInfo.title}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {brandInfo.subtitle}
              </p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    // Navigate to role-specific settings
                    if (role === 'seller') navigate('/seller/account');
                    else if (role === 'kam') navigate('/kam/vendors');
                    else if (role === 'admin') navigate('/admin/platform-config');
                  }}
                >
                  <User className="h-4 w-4" />
                  {!isCollapsed && <span>Settings</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}