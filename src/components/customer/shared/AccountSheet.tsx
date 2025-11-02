import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Package, Heart, MapPin, LogOut, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useAuth } from "@/contexts/AuthContext";

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSheet = ({ isOpen, onClose }: AccountSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // User data
  const userData = {
    name: user?.name || user?.full_name || 'User',
    email: user?.email || 'user@example.com',
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
    
    onClose();
    navigate(RouteMap.login());
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 overflow-y-auto">
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <SheetHeader className="text-left pb-4">
          <SheetTitle>Account</SheetTitle>
          <SheetDescription>Manage your account settings and preferences</SheetDescription>
        </SheetHeader>

        {/* User Profile Section */}
        <div className="flex items-center gap-4 p-4 bg-gradient-primary text-white rounded-lg mb-6">
          <Avatar className="h-16 w-16 border-2 border-white/20">
            <AvatarImage src={userData.avatar} />
            <AvatarFallback className="bg-white/20 text-white text-xl">
              {userData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{userData.name}</h2>
            <p className="text-sm opacity-90">{userData.email}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 mb-6">
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={() => handleNavigate(RouteMap.orders())}
          >
            <Package className="mr-3 h-5 w-5" />
            <span>Orders</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={() => handleNavigate(RouteMap.favorites())}
          >
            <Heart className="mr-3 h-5 w-5" />
            <span>Favourites</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={() => handleNavigate(RouteMap.addresses())}
          >
            <MapPin className="mr-3 h-5 w-5" />
            <span>My Addresses</span>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={() => handleNavigate(RouteMap.help())}
          >
            <HelpCircle className="mr-3 h-5 w-5" />
            <span>Help & Support</span>
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Account Actions */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

