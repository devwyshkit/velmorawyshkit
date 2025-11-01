import { Link } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Package, Heart, MapPin, LogOut, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { useToast } from "@/hooks/use-toast";
import { supabase, isAuthenticated } from "@/lib/integrations/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Mock user data
  const userData = {
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    avatar: user?.avatar || '',
  };

  const handleLogout = async () => {
    // Check if using mock auth
    const hasRealCredentials = import.meta.env.VITE_SUPABASE_URL && 
                               import.meta.env.VITE_SUPABASE_ANON_KEY &&
                               import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';
    
    if (hasRealCredentials) {
    await supabase.auth.signOut();
    } else {
      // Clear mock auth
      localStorage.removeItem('mock_session');
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_auth_phone');
      localStorage.removeItem('mock_otp');
      window.dispatchEvent(new Event('mockAuthChange'));
    }
    
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
    navigate(RouteMap.login());
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />
      
      {/* Profile Header */}
      <header className="bg-gradient-primary text-white py-8 px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={userData.avatar} />
              <AvatarFallback className="bg-background text-primary text-xl">
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
        <div className="space-y-2">
          <Link to={RouteMap.orders()}>
            <Button variant="outline" className="w-full justify-start">
              <Package className="mr-2" />
              Orders
            </Button>
          </Link>
          <Link to={RouteMap.favorites()}>
            <Button variant="outline" className="w-full justify-start">
              <Heart className="mr-2" />
              Favourites
          </Button>
          </Link>
          <Link to={RouteMap.addresses()}>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="mr-2" />
              My Addresses
          </Button>
          </Link>
          <Link to={RouteMap.help()}>
            <Button variant="outline" className="w-full justify-start">
              <HelpCircle className="mr-2" />
              Help & Support
          </Button>
          </Link>
        </div>


        {/* Account Options */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Account</h3>
            <div className="space-y-1">
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

