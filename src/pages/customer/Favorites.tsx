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
import { useAuth } from "@/contexts/AuthContext";

interface SavedItemData {
  id: string;
  name: string;
  image: string;
  price: number;
  store_id: string;
  store_name?: string;
}

export const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Phase 1 Cleanup: Always use mock data - no conditionals
      // Mock favorites from localStorage
      const stored = localStorage.getItem('wyshkit_favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      } else {
        // Pre-populate with sample favorites
        const sampleFavorites: SavedItemData[] = [
          {
            id: 'fav-1',
            name: 'Custom Birthday Cake',
            image: 'https://via.placeholder.com/200',
            price: 89900,
            store_id: 'mock-store-1',
            store_name: 'Sweet Delights',
          },
          {
            id: 'fav-2',
            name: 'Anniversary Gift Box',
            image: 'https://via.placeholder.com/200',
            price: 149900,
            store_id: 'mock-store-1',
            store_name: 'Sweet Delights',
          },
        ];
        localStorage.setItem('wyshkit_favorites', JSON.stringify(sampleFavorites));
        setItems(sampleFavorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (itemId: string) => {
    const updated = items.filter(item => item.id !== itemId);
    setItems(updated);
    localStorage.setItem('wyshkit_favorites', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background pb-[112px]">
      <CustomerMobileHeader title="Favourites" showBackButton />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyStates
            type="no-favorites"
            title="No favorites yet"
            description="Items you favorite will appear here"
            actionLabel="Browse Products"
            onAction={() => navigate(RouteMap.home())}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{items.length} Favorites</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {items.map((item) => (
                <CustomerItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  image={item.image}
                  price={item.price}
                  store_id={item.store_id}
                  store_name={item.store_name}
                  onItemClick={() => setSelectedItemId(item.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <CustomerBottomNav />

      {selectedItemId && (
        <ProductSheet
          isOpen={!!selectedItemId}
          onClose={() => setSelectedItemId(null)}
          productId={selectedItemId}
        />
      )}
    </div>
  );
};

