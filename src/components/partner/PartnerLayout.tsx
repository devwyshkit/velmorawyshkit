import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { 
  Home, Package, ShoppingBag, DollarSign, User, Bell, LogOut, Menu,
  Star, HelpCircle
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
import { PartnerBottomNav } from "@/components/partner/PartnerBottomNav";
import { StockAlertListener } from "@/components/StockAlertListener";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { SkeletonComponents } from "@/components/ui/skeleton-screen";

/**
 * Partner Dashboard Layout
 * Mobile: Bottom navigation (Swiggy pattern)
 * Desktop: Left sidebar navigation (Zomato pattern)
 * Responsive container for all partner pages
 */
export const PartnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();

  // 🔒 CRITICAL: Authentication Guard
  useEffect(() => {
    // Wait for auth to load
    if (loading) return;
    
    // Redirect if not authenticated
    if (!user) {
      navigate('/partner/login', { replace: true });
      return;
    }
    
    // Redirect if wrong role
    if (user.role !== 'seller') {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return <SkeletonComponents.Dashboard />;
  }

  // Don't render if not authenticated or wrong role
  if (!user || user.role !== 'seller') {
    return null;
  }

  // Partner navigation items - Swiggy 2025 pattern (only core features)
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/partner/dashboard" },
    { icon: Package, label: "Products", path: "/partner/products" },
    { icon: ShoppingBag, label: "Orders", path: "/partner/orders", badge: 0 }, // TODO: Real-time count
    { icon: DollarSign, label: "Earnings", path: "/partner/earnings" },
    { icon: Star, label: "Reviews", path: "/partner/reviews" },
    { icon: HelpCircle, label: "Help", path: "/partner/help" },
    { icon: User, label: "Profile", path: "/partner/profile" },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // 🔒 SECURITY: Clear sensitive data
      sessionStorage.clear();
      localStorage.removeItem('wyshkit_guest_cart');
      localStorage.removeItem('wyshkit_location');
      
      // 🔒 SECURITY: Prevent back button from showing cached data
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
      });
      
      // Silent success - navigation implies success (Swiggy 2025 pattern)
      navigate("/partner/login", { replace: true });
    } catch (error: any) {
      // Silent error - logout should always succeed or redirect
      console.error('Logout error:', error);
      navigate("/partner/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar (≥768px) */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r z-40">
          <div className="flex flex-col h-full">
            {/* Logo - Properly sized */}
            <div className="p-4 border-b flex items-center justify-center">
              <Link to="/partner/dashboard">
                <img
                  src="/wyshkit-logo.png"
                  alt="Wyshkit Partner"
                  className="h-8 w-auto object-contain"
                  width="120"
                  height="32"
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
                      "flex items-center gap-3 px-3 py-2 rounded-lg relative",
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
        {/* Mobile Header - Mobile-First Optimized */}
        {isMobile && (
          <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b">
            <div className="flex items-center justify-between h-14 px-3">
              {/* Logo - Properly sized for mobile */}
              <Link to="/partner/dashboard" className="flex items-center flex-shrink-0">
                <img
                  src="/wyshkit-logo.png"
                  alt="Wyshkit"
                  className="h-6 w-auto max-w-[120px] object-contain"
                  width="120"
                  height="30"
                />
              </Link>
              
              {/* Right Actions - Compact */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name || 'Partner'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/partner/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
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
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </header>
        )}

        {/* Page Content - Mobile-First Padding */}
        <main className="p-3 sm:p-4 md:p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation - Optimized to 5 items */}
      <PartnerBottomNav />

      {/* Stock Alert Listener - Feature 3 (PROMPT 10) */}
      <StockAlertListener />
    </div>
  );
};

