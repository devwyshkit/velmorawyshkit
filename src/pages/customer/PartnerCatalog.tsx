import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
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
// Swiggy 2025: Removed AddToCartNotification - using ONLY StickyCartBar for consistency
import { LoginPromptSheet } from "@/components/customer/shared/LoginPromptSheet";
import { CartReplacementModal } from "@/components/customer/shared/CartReplacementModal";
import { RouteMap } from "@/routes";
import { supabase } from "@/lib/integrations/supabase-client";
import { fetchStoreById, fetchItemsByStore, removeCartItemByProductId, CartItemData } from "@/lib/integrations/supabase-data";
import { isAuthenticated } from "@/lib/integrations/supabase-client";
// Swiggy 2025: Removed toast - using ONLY StickyCartBar for feedback
import { OptimizedImage } from "@/components/ui/skeleton-screen";
import { EmptyStates } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Store, Item } from "@/lib/integrations/supabase-data";

export const PartnerCatalog = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCartCount, currentStoreId, clearCart, addToCart, cartCount, cartTotal } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Swiggy 2025: Removed notification state - using ONLY StickyCartBar for consistency
  
  // Login prompt and cart replacement modals
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCartReplacementModal, setShowCartReplacementModal] = useState(false);
  const [currentStoreName, setCurrentStoreName] = useState<string>("");
  const [pendingAddToCart, setPendingAddToCart] = useState<{
    itemId: string;
    quantity: number;
    storeId: string;
    itemName: string;
  } | null>(null);
  
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
        // 2025 Pattern: Parallelize store and items queries for performance
        const [storeResult, itemsResult] = await Promise.all([
          fetchStoreById(storeId),
          supabase
            .from('store_items')
            .select('id, name, description, price, images, is_customizable, customization_options, category, tags, is_active, created_at, image_url, short_desc')
            .eq('store_id', storeId)
            .eq('is_active', true)
            .eq('status', 'approved')
            .order('created_at', { ascending: false }),
        ]);
        
        // Process store
        if (storeResult) {
          setStore(storeResult);
        } else {
          setStore(null);
        }
        
        // Process items - map database response to Item interface (Swiggy 2025 pattern)
        const { data: itemsData, error } = itemsResult;
        if (!error && itemsData && itemsData.length > 0) {
          // Map database fields to Item interface (camelCase conversion)
          const mappedItems: Item[] = itemsData.map((dbItem: {
            id: string;
            name: string;
            description?: string;
            image_url?: string;
            images?: string[];
            price: number;
            short_desc?: string;
            is_customizable?: boolean;
            customization_options?: any[];
            category?: string;
            tags?: string[];
          }) => ({
            id: dbItem.id,
            name: dbItem.name,
            description: dbItem.description || '',
            image: dbItem.image_url || dbItem.images?.[0] || '/placeholder.svg',
            images: dbItem.images || [],
            price: dbItem.price || 0,
            rating: 0, // Default - can be fetched separately if needed
            store_id: storeId, // Use storeId from params
            shortDesc: dbItem.short_desc || '',
            isCustomizable: dbItem.is_customizable || false, // Convert snake_case to camelCase
            personalizations: dbItem.customization_options || [],
            category: dbItem.category || '',
            tags: dbItem.tags || [],
          }));
          setItems(mappedItems);
        } else {
          // No items found - show empty state
          setItems([]);
        }
      } catch (error) {
        // Silent error handling - show empty state (Swiggy 2025 pattern)
        // Swiggy 2025: Silent error - show empty state instead of toast
        setItems([]);
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    loadStoreCatalog();
  }, [storeId]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  // Quick add to cart handler (Swiggy 2025 pattern - for non-customizable items)
  const handleQuickAddToCart = async (itemId: string, quantity: number, storeId: string) => {
    // Check authentication
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      setShowLoginPrompt(true);
      return;
    }

    // Find item details
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Check store mismatch
    if (currentStoreId && currentStoreId !== storeId) {
      // Fetch store names for modal
      try {
        const currentStore = await fetchStoreById(currentStoreId);
        setCurrentStoreName(currentStore?.name || "Current Store");
        setPendingAddToCart({ itemId, quantity, storeId, itemName: item.name });
        setShowCartReplacementModal(true);
        return;
      } catch (error) {
        // Silent error - proceed with add
      }
    }

    // Handle quantity 0 (remove from cart)
    if (quantity === 0) {
      try {
        const success = await removeCartItemByProductId(itemId, storeId);
        if (success) {
          await refreshCartCount();
        }
      } catch (error) {
        // Silent error handling
      }
      return;
    }

    // Proceed with add to cart (using CartContext handler - DRY principle)
    try {
      const cartItem: CartItemData = {
        id: itemId,
        item_id: itemId, // Set item_id for product matching (CustomerItemCard looks for this)
        name: item.name,
        price: item.price,
        quantity,
        store_id: storeId,
        addOns: [],
        isCustomizable: false,
        personalizations: [],
      };

      const success = await addToCart(cartItem);

      // Swiggy 2025: No separate notification - StickyCartBar will update automatically
      // Cart count change triggers banner update
    } catch (error) {
      // Silent error handling - notification will show on success only
    }
  };

  // Handle cart replacement confirmation
  const handleReplaceCart = async () => {
    if (!pendingAddToCart) return;
    
    // Clear existing cart
    await clearCart();
    setShowCartReplacementModal(false);

    // Proceed with adding new item
    const item = items.find(i => i.id === pendingAddToCart.itemId);
    if (!item) return;

    try {
      const cartItem: CartItemData = {
        id: pendingAddToCart.itemId,
        name: item.name,
        price: item.price,
        quantity: pendingAddToCart.quantity,
        store_id: pendingAddToCart.storeId,
        addOns: [],
        isCustomizable: false,
        personalizations: [],
      };

      // Swiggy 2025: No separate notification - StickyCartBar will update automatically
      await addToCart(cartItem);
    } catch (error) {
      // Silent error handling
    }
    
    setPendingAddToCart(null);
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Store | Wyshkit</title>
        </Helmet>
        <div className="min-h-screen bg-background pb-[112px]">
          <CustomerMobileHeader showBackButton={true} title={store?.name || "Loading..."} />
        {/* Swiggy 2025: Tighter mobile spacing - 16px mobile, 24px desktop */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-6 space-y-4 md:space-y-6">
          {/* Store Header Skeleton */}
          <div className="space-y-4">
            {/* Swiggy 2025: Compact store header on mobile - 120px mobile, 160px desktop */}
            <Skeleton className="w-full h-[120px] md:h-[160px] rounded-lg" />
            <div className="px-4 md:px-6 lg:px-8 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Items Grid Skeleton */}
          {/* Swiggy 2025: 12px gap on all screens - consistent spacing */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="w-full aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <CustomerBottomNav />
      </div>
      </>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
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
    <>
      <Helmet>
        <title>{store?.name ? `${store.name} | Wyshkit` : 'Store | Wyshkit'}</title>
        <meta name="description" content={store?.description || `Browse products from ${store?.name || 'this store'}`} />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader showBackButton={true} title={store.name} />
      
      {/* Store Header - Swiggy 2025 Pattern (No Overlap) */}
      <div className="bg-card border-b border-border">
        {/* Banner Image (full-width) */}
        {/* Swiggy 2025: Compact store header on mobile - 120px mobile, 160px desktop */}
        <div className="relative w-full h-[120px] md:h-[160px] overflow-hidden bg-muted">
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
        {/* Swiggy 2025: Reduced mobile padding - 12px mobile, 16px desktop */}
        <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
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
        <div className="sticky top-14 z-30 bg-background px-4 md:px-6 lg:px-8 py-3 border-b">
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
      {/* Swiggy 2025: Reduced mobile padding - 12px mobile, 24px desktop */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-6">
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
            
            {/* Swiggy 2025: Tighter mobile gap - 12px mobile, 24px desktop */}
            <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
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
                  eta={item.eta}
                  store_id={item.store_id}
                  onClick={() => handleItemClick(item.id)}
                  onAddToCart={handleQuickAddToCart}
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
              onClose={(productName?: string, quantity?: number) => {
                setSelectedItemId(null);
                // Swiggy 2025: No separate notification - StickyCartBar will update automatically
                // Cart count change triggers banner update
              }}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Swiggy 2025: Removed AddToCartNotification - using ONLY StickyCartBar for consistency */}

      {/* Login Prompt Sheet */}
      <LoginPromptSheet
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      {/* Cart Replacement Modal - Swiggy 2025 Pattern */}
      {store && (
        <CartReplacementModal
          isOpen={showCartReplacementModal}
          currentPartner={currentStoreName}
          newPartner={store.name}
          currentCartCount={cartCount}
          currentCartTotal={cartTotal}
          onConfirm={handleReplaceCart}
          onCancel={() => {
            setShowCartReplacementModal(false);
            setPendingAddToCart(null);
          }}
        />
      )}
      </div>
    </>
  );
};

