import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/lib/integrations/supabase-client";
import { fetchWishlistItems, removeFromWishlistSupabase, type WishlistItemData } from "@/lib/integrations/supabase-data";

export const Wishlist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<WishlistItemData[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadWishlist();
  }, []);

  const checkAuthAndLoadWishlist = async () => {
    setLoading(true);
    try {
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);

      if (!isAuth) {
        setLoading(false);
        return;
      }

      // Load wishlist from Supabase
      const wishlistData = await fetchWishlistItems();
      setItems(wishlistData);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      toast({
        title: "Loading error",
        description: "Failed to load wishlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (itemId: string) => {
    // Optimistic update
    setItems(items.filter(item => item.id !== itemId));
    
    // Remove from Supabase
    const success = await removeFromWishlistSupabase(itemId);
    
    if (success) {
      toast({
        title: "Removed from wishlist",
        description: "Item removed from your wishlist",
      });
    } else {
      // Revert on failure
      await checkAuthAndLoadWishlist();
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleItemClick = (itemId: string) => {
    navigate(`/customer/items/${itemId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="Wishlist" />
        
        <main className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </main>

        <CustomerBottomNav />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="Wishlist" />
        
        <div className="flex flex-col items-center justify-center h-[70vh] px-4">
          <Heart className="h-20 w-20 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to save items</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Create an account to save your favorite items
          </p>
          <div className="space-y-3 w-full max-w-sm">
            <Button onClick={() => navigate("/customer/login")} className="w-full">
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/customer/home")}
              variant="outline"
              className="w-full"
            >
              Browse Partners
            </Button>
          </div>
        </div>

        <CustomerBottomNav />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="Wishlist" />
        
        <div className="flex flex-col items-center justify-center h-[70vh] px-4">
          <Heart className="h-20 w-20 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Save items you love for later
          </p>
          <Button onClick={() => navigate("/customer/home")} className="w-full max-w-sm">
            Browse Partners
          </Button>
        </div>

        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader showBackButton title="Wishlist" />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <CustomerItemCard
                id={item.id}
                name={item.name}
                image={item.image}
                price={item.price}
                rating={item.rating}
                badge={item.badge}
                onClick={() => handleItemClick(item.id)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFromWishlist(item.id);
                }}
              >
                <Heart className="h-4 w-4 fill-primary text-primary" />
              </Button>
            </div>
          ))}
        </div>
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};

