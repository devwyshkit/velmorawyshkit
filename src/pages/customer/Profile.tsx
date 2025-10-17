import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Moon, Sun, Package, Heart, MapPin, LogOut, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { useToast } from "@/hooks/use-toast";
import { supabase, isAuthenticated } from "@/lib/integrations/supabase-client";
import { useTheme } from "@/components/theme-provider";

interface Order {
  id: string;
  date: string;
  items: number;
  total: number;
  status: string;
}

export const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Mock user data
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '',
    phone: '+91 98765 43210',
  };

  // Mock orders
  const recentOrders: Order[] = [
    {
      id: 'ORD-001',
      date: 'Today, 2:30 PM',
      items: 3,
      total: 7796,
      status: 'Out for Delivery',
    },
    {
      id: 'ORD-002',
      date: 'Yesterday',
      items: 2,
      total: 4998,
      status: 'Delivered',
    },
    {
      id: 'ORD-003',
      date: '2 days ago',
      items: 1,
      total: 2499,
      status: 'Delivered',
    },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);
      
      if (isAuth) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
    navigate("/customer/login");
  };

  const handleToggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4">
          <User className="h-20 w-20 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to your account</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Access your orders, wishlist, and personalized recommendations
          </p>
          <div className="space-y-3 w-full max-w-sm">
            <Button
              onClick={() => navigate("/customer/login")}
              className="w-full h-12"
              size="lg"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/customer/signup")}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              Create Account
            </Button>
          </div>
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />
      
      {/* Profile Header */}
      <header className="bg-gradient-primary text-white py-8 px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={userData.avatar} />
              <AvatarFallback className="bg-background dark:bg-card text-primary text-xl">
                {userData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{userData.name}</h1>
              <p className="text-sm opacity-90">{userData.email}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => toast({ title: "Coming Soon", description: "Order management feature will be available soon" })}
          >
            <Package className="h-5 w-5" />
            <span className="text-xs">Orders</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => navigate("/customer/wishlist")}
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Wishlist</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex flex-col gap-2"
            onClick={() => toast({ title: "Coming Soon", description: "Address management feature will be available soon" })}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-xs">Addresses</span>
          </Button>
        </div>

        {/* Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                  <span className="text-sm">Dark Mode</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={handleToggleDarkMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Orders</h3>
              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                onClick={() => toast({ title: "Coming Soon", description: "Full order history will be available soon" })}
              >
                See all
              </Button>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => navigate(`/customer/track/${order.id}`)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{order.id}</p>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items} items • ₹{order.total.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'Delivered' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Options */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Account</h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => toast({ title: "Coming Soon", description: "Account settings will be available soon" })}
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => toast({ title: "Coming Soon", description: "Help & support center will be available soon" })}
              >
                <HelpCircle className="h-5 w-5 mr-3" />
                Help & Support
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};

