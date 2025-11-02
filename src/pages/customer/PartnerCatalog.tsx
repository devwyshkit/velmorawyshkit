import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Info, Star, MapPin, Clock, Store as StoreIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { StickyCartBar } from "@/components/customer/shared/StickyCartBar";
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

export const PartnerCatalog = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Search & Category filters (Swiggy 2025 pattern)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get unique categories from items
  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));
  
  // Filter items by search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shortDesc?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        <CustomerMobileHeader showBackButton={true} title={store?.name || "Loading..."} />
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
        <CustomerMobileHeader showBackButton={true} title="Store not found" />
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
      <CustomerMobileHeader showBackButton={true} title={store.name} />
      
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

      {/* Search Bar - Swiggy 2025 Pattern */}
      {items.length > 0 && (
        <div className="sticky top-14 z-30 bg-background px-3 md:px-4 py-3 border-b">
          <div className="relative max-w-7xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search in ${store.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Navigation - Swiggy 2025 Pattern */}
      {items.length > 0 && categories.length > 0 && (
        <div className="bg-background border-b border-border">
          <HorizontalScroll 
            cardType="category" 
            showArrows={false} 
            className="py-2"
            gap="sm"
            paddingX="md"
          >
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="flex-shrink-0"
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="flex-shrink-0"
              >
                {cat}
              </Button>
            ))}
          </HorizontalScroll>
        </div>
      )}

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
        ) : filteredItems.length === 0 ? (
          <EmptyStates.NoResults
            title="No items found"
            description={searchQuery || selectedCategory 
              ? "Try adjusting your search or category filter."
              : "No items available in this store."
            }
            action={{
              label: searchQuery || selectedCategory ? "Clear filters" : "Explore Stores",
              onClick: () => {
                setSearchQuery("");
                setSelectedCategory(null);
              },
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Products</h2>
              <span className="text-sm text-muted-foreground">
                {filteredItems.length} of {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredItems.map((item) => (
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

      <CustomerBottomNav />
      <StickyCartBar />
      
      {/* Product Sheet */}
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

