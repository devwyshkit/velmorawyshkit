import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
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
  LogOut,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/customer/shared/ThemeToggle";
import { AdminMobileNav } from "./AdminMobileNav";
import { AdminBottomNav } from "./AdminBottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useTheme } from "@/components/theme-provider";

/**
 * Admin Layout
 * Desktop-first (no mobile optimization)
 * Top navigation bar (different from partner sidebar)
 * Following Swiggy/Zomato admin console patterns
 */
export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Admin navigation items (horizontal top nav)
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Partners", path: "/admin/partners", badge: 18 }, // Pending approvals
    { icon: Package, label: "Products", path: "/admin/product-approvals", badge: 12 }, // Pending products
    { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
    { icon: AlertCircle, label: "Disputes", path: "/admin/disputes", badge: 5 }, // Escalated
    { icon: DollarSign, label: "Payouts", path: "/admin/payouts", badge: 120 }, // Due
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: FileText, label: "Content", path: "/admin/content" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out",
        description: "You've been logged out of admin console",
      });

      navigate("/admin/login");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar (Responsive) */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center px-2 md:px-4 lg:px-6">
          {/* Mobile Hamburger */}
          <AdminMobileNav />

          {/* Logo - Compact on mobile */}
          <Link to="/admin/dashboard" className="flex items-center mr-auto md:mr-8">
            <img
              src={isDark ? "/horizontal-no-tagline-fff-transparent-3000x750.png" : "/wyshkit-logo.png"}
              alt="Wyshkit Admin"
              className="h-5 md:h-8 w-auto object-contain"
              width="120"
              height="32"
            />
            <span className="hidden md:inline ml-3 text-sm font-semibold text-muted-foreground">ADMIN</span>
          </Link>

          {/* Medium Screen Navigation (Tablet) */}
          <nav className="hidden md:flex lg:hidden items-center space-x-1 flex-1 overflow-x-auto">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1 px-2 py-2 text-sm font-medium rounded-md transition-colors relative whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "destructive"}
                      className="ml-1 px-1.5 py-0 text-xs h-5 min-w-5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Main Navigation (Desktop only) */}
          <nav className="hidden lg:flex items-center space-x-1 flex-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md transition-colors relative whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge
                      variant={isActive ? "secondary" : "destructive"}
                      className="ml-1 px-1.5 py-0 text-xs h-5 min-w-5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions - Compact on mobile */}
          <div className="flex items-center gap-1 md:gap-2">
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 p-0 flex items-center justify-center text-[10px]">
                3
              </Badge>
            </Button>

            {/* Admin User Dropdown - Icon only on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Console</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                  <Users className="mr-2 h-4 w-4" />
                  Admin Users
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/audit")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Audit Logs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area (with mobile bottom nav padding) */}
      <main className="container mx-auto p-4 md:p-6 max-w-screen-2xl">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
};

