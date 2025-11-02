import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Info, Star, MapPin, Clock, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ProductSheet } from "@/components/customer/shared/ProductSheet";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { RouteMap } from "@/routes";
import { supabase } from "@/lib/integrations/supabase-client";
import { fetchStoreById, getMockItems } from "@/lib/integrations/supabase-data";
import { useToast } from "@/hooks/use-toast";
import { OptimizedImage } from "@/components/ui/skeleton-screen";
import { EmptyStates } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { Store, Item } from "@/lib/integrations/supabase-data";

export const StoreCatalog = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Load store and items
  useEffect(() => {
    const loadStoreCatalog = async () => {
      if (!storeId) return;

      setLoading(true);
      try {
        // Try to fetch from Supabase first
        const storeData = await fetchStoreById(storeId);
        
        if (storeData) {
          setStore(storeData);
          
          // Fetch items from this store
          const { data: itemsData, error } = await supabase
            .from('store_items')
            .select('*')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (!error && itemsData && itemsData.length > 0) {
            setItems(itemsData);
          } else {
            // Fallback to mock items
            const mockItems = getMockItems();
            setItems(mockItems.slice(0, 8));
          }
        } else {
          // Fallback to mock data
          const mockItems = getMockItems();
          setItems(mockItems.slice(0, 8));
          
          // Create a mock store
          setStore({
            id: storeId,
            name: "Premium Gifts Co",
            image: "https://picsum.photos/seed/store/400/400",
            rating: 4.5,
            delivery: "1-2 days",
            category: "Gift Shop",
            tagline: "Premium gifts for every occasion",
            ratingCount: 234,
          });
        }
      } catch (error) {
        console.error('Error loading store catalog:', error);
        toast({
          title: "Error",
          description: "Failed to load store catalog. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStoreCatalog();
  }, [storeId, toast]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader />
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6 space-y-6">
          {/* Store Header Skeleton */}
          <div className="space-y-4">
            <Skeleton className="w-full h-[160px] rounded-lg" />
            <div className="px-3 md:px-4 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Items Grid Skeleton */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader />
        <EmptyStates.NoResults
          title="Store not found"
          description="This store doesn't exist or has been removed."
          action={{
            label: "Go Home",
            onClick: () => navigate(RouteMap.home()),
          }}
        />
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />
      
      {/* Store Header - Swiggy 2025 Pattern (No Overlap) */}
      <div className="bg-card border-b border-border">
        {/* Banner Image (full-width) */}
        <div className="relative w-full h-[160px] overflow-hidden bg-muted">
          {store.image && (
            <OptimizedImage
              src={store.image}
              alt={store.name}
              width={800}
              height={160}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        
        {/* Store Info Card (separate, no overlap) */}
        <div className="px-3 md:px-4 py-4">
          <div className="flex items-start gap-3">
            {/* Store Logo (circle) */}
            <div className="relative w-16 h-16 rounded-full border border-border bg-background overflow-hidden flex-shrink-0">
              <OptimizedImage
                src={store.image || "https://picsum.photos/seed/store-logo/200/200"}
                alt={store.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Store Details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-bold line-clamp-2 mb-1">{store.name}</h1>
              
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-2">
                {store.rating && (
                  <>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                      {store.rating}
                    </span>
                    {store.ratingCount && (
                      <span className="text-muted-foreground">
                        ({store.ratingCount})
                      </span>
                    )}
                    {store.delivery && (
                      <>
                        <span>•</span>
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        <span>{store.delivery}</span>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {/* Category & Tagline */}
              <div className="flex items-center gap-2 flex-wrap">
                {store.category && (
                  <Badge variant="secondary" className="text-xs">
                    {store.category}
                  </Badge>
                )}
                {store.tagline && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {store.tagline}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <main className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {items.length === 0 ? (
          <EmptyStates.NoResults
            title="No items available"
            description="This store doesn't have any items at the moment."
            action={{
              label: "Explore Stores",
              onClick: () => navigate(RouteMap.home()),
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Products</h2>
              <span className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <CustomerItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  image={item.image}
                  price={item.price}
                  rating={item.rating}
                  ratingCount={item.ratingCount}
                  badge={item.badge}
                  shortDesc={item.shortDesc}
                  sponsored={item.sponsored}
                  isCustomizable={item.isCustomizable}
                  campaignDiscount={item.campaignDiscount}
                  moq={item.moq}
                  eta={item.eta}
                  store_id={item.store_id}
                  onClick={() => handleItemClick(item.id)}
                  className="h-full"
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Product Sheet */}
      {selectedItemId && (
        <ProductSheet
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
        />
      )}

      <CustomerBottomNav />
    </div>
  );
};

