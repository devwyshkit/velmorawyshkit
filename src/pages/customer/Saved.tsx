import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { ProductSheet } from "@/components/customer/shared/ProductSheet";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStates } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { fetchSavedItems, removeFromSavedItemsSupabase, addToSavedItemsSupabase, type SavedItemData } from "@/lib/integrations/supabase-data";
// Note: fetchSavedItems is now an alias to fetchFavoriteProducts from favorites service

export const Saved = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<SavedItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    setLoading(true);
    try {
      // Load saved items from Supabase (route is already protected by ProtectedRoute)
      const savedData = await fetchSavedItems();
      setItems(savedData);
    } catch (error) {
      console.error('Failed to load favourites:', error);
      toast({
        title: "Loading error",
        description: "Failed to load favourites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromSaved = async (itemId: string) => {
    // Optimistic update
    setItems(items.filter(item => item.id !== itemId));
    
    // Remove from Supabase
    const success = await removeFromSavedItemsSupabase(itemId);
    
    if (!success) {
      // Revert on failure
      await loadSaved();
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="Favourites" />
        
        <main className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-1 p-2">
                <Skeleton className="aspect-square rounded-lg mb-2" />
                <Skeleton className="h-4 w-3/4" />  {/* Name */}
                <Skeleton className="h-3 w-2/3" />  {/* Short desc */}
                <Skeleton className="h-4 w-1/3" />  {/* Price + Rating */}
              </div>
            ))}
          </div>
        </main>

        <CustomerBottomNav />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="Favourites" />
        
        <main className="max-w-screen-xl mx-auto px-4 py-6">
          <EmptyStates.Favourites />
        </main>

        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader showBackButton title="Favourites" />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'favourite' : 'favourites'}
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
                isFavourited={true}
                onFavouriteToggle={async (itemId: string, isFavourited: boolean) => {
                  if (!isFavourited) {
                    await handleRemoveFromSaved(itemId);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </main>

      <CustomerBottomNav />
      
      {/* Product Sheet for items */}
      {selectedItemId && (
        <Sheet open={!!selectedItemId} onOpenChange={(open) => !open && setSelectedItemId(null)} modal={false}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Product Details</SheetTitle>
              <SheetDescription>View product information, customize options, and add to cart</SheetDescription>
            </SheetHeader>
            <ProductSheet
              itemId={selectedItemId}
              onClose={() => setSelectedItemId(null)}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

