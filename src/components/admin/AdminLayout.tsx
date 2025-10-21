import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
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
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Mobile Hamburger */}
          <AdminMobileNav />

          {/* Logo */}
          <Link to="/admin/dashboard" className="flex items-center mr-4 md:mr-8">
            <img
              src={isDark ? "/horizontal-no-tagline-fff-transparent-3000x750.png" : "/wyshkit-logo.png"}
              alt="Wyshkit Admin"
              className="h-6 md:h-8"
            />
            <span className="ml-2 md:ml-3 text-xs md:text-sm font-semibold text-muted-foreground">ADMIN</span>
          </Link>

          {/* Main Navigation (Desktop only) */}
          <nav className="hidden md:flex items-center space-x-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors relative",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
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

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>

            {/* Admin User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">Admin</span>
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
      <main className="container mx-auto p-4 md:p-6 max-w-screen-2xl pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <AdminBottomNav />
    </div>
  );
};

