import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Home, Package, ShoppingBag, DollarSign, User, Bell, LogOut, Menu } from "lucide-react";
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
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { ThemeToggle } from "@/components/customer/shared/ThemeToggle";
import { StockAlertListener } from "@/components/StockAlertListener";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";

/**
 * Partner Dashboard Layout
 * Mobile: Bottom navigation (Swiggy pattern)
 * Desktop: Left sidebar navigation (Zomato pattern)
 * Responsive container for all partner pages
 */
export const PartnerLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Partner navigation items (Swiggy/Zomato pattern: Home, Menu, Orders, Earnings, Profile)
  const navItems = [
    { icon: Home, label: "Home", path: "/partner/dashboard" },
    { icon: Package, label: "Products", path: "/partner/products" },
    { icon: ShoppingBag, label: "Orders", path: "/partner/orders", badge: 0 }, // TODO: Real-time count
    { icon: DollarSign, label: "Earnings", path: "/partner/earnings" },
    { icon: User, label: "Profile", path: "/partner/profile" },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You've been logged out successfully",
      });
      
      navigate("/partner/login");
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
      {/* Desktop Sidebar (≥768px) */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40">
          <div className="flex flex-col h-full">
            {/* Logo - Using Customer UI Logo (Consistent Branding) */}
            <div className="p-6 border-b border-border flex items-center">
              <Link to="/partner/dashboard" className="flex items-center">
                <img
                  src={isDark ? "/horizontal-no-tagline-fff-transparent-3000x750.png" : "/wyshkit-logo.png"}
                  alt="Wyshkit Partner"
                  className="h-10"
                />
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="p-4 border-t border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{user?.name || 'Partner'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/partner/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/partner/help")}>
                    <Bell className="mr-2 h-4 w-4" />
                    Help & Support
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
        </aside>
      )}

      {/* Main Content */}
      <div className={cn(
        "min-h-screen",
        !isMobile && "ml-64",  // Offset for desktop sidebar
        isMobile && "pb-20"     // Offset for mobile bottom nav
      )}>
        {/* Mobile Header - Fixed with Customer UI Logo */}
        {isMobile && (
          <header className="sticky top-0 z-40 bg-background border-b border-border">
            <div className="flex items-center justify-between h-16 px-4">
              <Link to="/partner/dashboard" className="flex items-center">
                <img
                  src={isDark ? "/horizontal-no-tagline-fff-transparent-3000x750.png" : "/wyshkit-logo.png"}
                  alt="Wyshkit Partner"
                  className="h-10"
                />
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {user?.name || 'Partner'}
                    </DropdownMenuLabel>
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
        )}

        {/* Desktop Header - Professional Layout */}
        {!isMobile && (
          <header className="sticky top-0 z-30 bg-background border-b border-border">
            <div className="flex items-center justify-end h-16 px-6 gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="p-4 md:p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav items={navItems} />

      {/* Stock Alert Listener - Feature 3 (PROMPT 10) */}
      <StockAlertListener />
    </div>
  );
};

