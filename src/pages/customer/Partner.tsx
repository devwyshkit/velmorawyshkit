import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Clock, Search } from "lucide-react";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { FloatingCartButton } from "@/components/customer/shared/FloatingCartButton";
import { SmartFilters, type SortOption, type FilterOption } from "@/components/customer/shared/SmartFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPartnerById, fetchItemsByPartner, type Item as ItemType, type Partner as PartnerType } from "@/lib/integrations/supabase-data";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EmptyStates } from "@/components/ui/empty-state";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { ProductSheet } from "@/components/customer/shared/ProductSheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Partner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partner, setPartner] = useState<PartnerType | null>(null);
  const [items, setItems] = useState<ItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    items: ItemType[];
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    const loadPartnerData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Load partner details
        const partnerData = await fetchPartnerById(id);
        setPartner(partnerData);

        // Track vendor view in localStorage (for Visited Vendors section)
        if (partnerData) {
          const visitedKey = 'wyshkit_visited_vendors';
          const visited = JSON.parse(localStorage.getItem(visitedKey) || '[]');
          const vendorEntry = {
            id: partnerData.id,
            name: partnerData.name,
            image: partnerData.image,
            rating: partnerData.rating,
            ratingCount: partnerData.ratingCount,
            delivery: partnerData.delivery,
            category: partnerData.category,
            tagline: partnerData.tagline,
            badge: partnerData.badge,
            sponsored: partnerData.sponsored,
            viewedAt: new Date().toISOString(),
            viewCount: (visited.find((v: any) => v.id === partnerData.id)?.viewCount || 0) + 1
          };
          // Remove if exists, add to beginning
          const filtered = visited.filter((v: any) => v.id !== partnerData.id);
          const updated = [vendorEntry, ...filtered].slice(0, 20); // Keep last 20
          localStorage.setItem(visitedKey, JSON.stringify(updated));
        }

        // Load partner items
        const itemsData = await fetchItemsByPartner(id);
        setItems(itemsData);
      } catch (error) {
        // Handle error silently in production
        toast({
          title: "Loading error",
          description: "Failed to load partner information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPartnerData();
  }, [id, toast]);



  // Scroll to category
  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      const top = element.offsetTop - 160;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Group items by category
  useEffect(() => {
    if (items.length === 0) {
      setCategories([]);
      return;
    }
    
    // Group by item properties
    const bestsellers = items.filter(item => item.badge === 'bestseller');
    const customizable = items.filter(item => item.isCustomizable);
    const readyToShip = items.filter(item => !item.isCustomizable);
    
    const grouped = [
      { id: "bestsellers", name: "Bestsellers", items: bestsellers },
      { id: "customizable", name: "Customizable Gifts", items: customizable },
      { id: "ready", name: "Ready to Ship", items: readyToShip },
    ].filter(cat => cat.items.length > 0);
    
    if (grouped.length === 0 && items.length > 0) {
      grouped.push({ id: "all", name: "All Items", items });
    }
    
    setCategories(grouped);
    setActiveCategory(grouped[0]?.id || "all");
  }, [items]);

  // Track active category on scroll
  useEffect(() => {
    const handleScroll = () => {
      const offset = 180;
      for (const cat of categories) {
        const element = document.getElementById(cat.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom > offset) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // Apply search, filters, and sort
  useEffect(() => {
    let filtered = [...items];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDesc?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // SmartFilters
    if (filters.includes('offers')) {
      filtered = filtered.filter(item => item.campaignDiscount);
    }
    if (filters.includes('fast-delivery')) {
      filtered = filtered.filter(item => 
        item.estimatedDeliveryDays?.includes('1') || 
        item.estimatedDeliveryDays?.includes('Same')
      );
    }
    if (filters.includes('new')) {
      filtered = filtered.filter(item => (item.ratingCount || 0) < 50);
    }
    
    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'delivery':
        filtered.sort((a, b) => {
          const aTime = parseInt(a.estimatedDeliveryDays || '999');
          const bTime = parseInt(b.estimatedDeliveryDays || '999');
          return aTime - bTime;
        });
        break;
      case 'cost-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'cost-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'relevance':
      default:
        filtered.sort((a, b) => 
          (b.rating * (b.ratingCount || 1)) - (a.rating * (a.ratingCount || 1))
        );
    }
    
    // Re-group
    const bestsellers = filtered.filter(item => item.badge === 'bestseller');
    const customizable = filtered.filter(item => item.isCustomizable);
    const readyToShip = filtered.filter(item => !item.isCustomizable);
    
    const grouped = [
      { id: "bestsellers", name: "Bestsellers", items: bestsellers },
      { id: "customizable", name: "Customizable Gifts", items: customizable },
      { id: "ready", name: "Ready to Ship", items: readyToShip },
    ].filter(cat => cat.items.length > 0);
    
    if (grouped.length === 0 && filtered.length > 0) {
      grouped.push({ id: "all", name: "All Items", items: filtered });
    }
    
    setCategories(grouped);
  }, [items, searchQuery, filters, sortBy]);

  if (loading || !partner) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title="Loading..." />
        
        <main className="max-w-screen-xl mx-auto px-4 py-6">
          {/* Partner Info Skeleton */}
          <div className="flex gap-3 mb-6">
            <Skeleton className="w-16 h-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>

          {/* Items Skeleton - Matches CustomerItemCard with aspect-ratio to prevent CLS */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="relative cursor-pointer overflow-hidden rounded-xl border-0 shadow-sm">
                <div className="p-2">
                  {/* Image skeleton - matches aspect-square */}
                  <Skeleton className="w-full aspect-square rounded-lg mb-2" />
                  
                  {/* Content skeleton - matches actual card structure */}
                  <div className="space-y-1">
                    {/* Name skeleton - text-base font-bold */}
                    <Skeleton className="h-4 w-3/4" />
                    
                    {/* Short description skeleton - text-xs, 3 lines */}
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    
                    {/* Price and rating skeleton */}
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-1/3" />  {/* Price */}
                      <Skeleton className="h-3 w-1/4" />  {/* Rating */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <CustomerMobileHeader showBackButton title={partner?.name || 'Partner'} />

        {/* Partner Header - Scrolls away */}
        <section className="px-4 py-4 bg-card">
          <div className="flex gap-3">
            <img
              src={partner.image}
              alt={partner.name}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold mb-1 truncate">{partner.name}</h1>
              {partner.tagline && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{partner.tagline}</p>
              )}
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{partner.rating}</span>
                  {partner.ratingCount && (
                    <span className="text-muted-foreground">({partner.ratingCount})</span>
                  )}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{partner.delivery}</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Category tags */}
          {partner.category && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mt-3">
              {partner.category.split('•').map((cat, i) => (
                <Badge key={i} variant="secondary" className="text-xs whitespace-nowrap">
                  {cat.trim()}
                </Badge>
              ))}
            </div>
          )}
        </section>

        {/* Search Bar - Sticky top-0 (Swiggy pattern) */}
        <div className="sticky top-0 z-30 bg-background border-b">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search in ${partner.name}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Smart Filters - Reuse from Home (sticky top-14) */}
        <SmartFilters
          sortBy={sortBy}
          filters={filters}
          onSortChange={setSortBy}
          onFilterChange={setFilters}
          sticky={true}
        />

        {/* Category Pills - Sticky top-28 (Swiggy pattern) */}
        {categories.length > 1 && (
          <div className="sticky top-28 z-20 bg-background border-b">
            <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items - Vertical Grid (Swiggy 2025 pattern) */}
        <main className="pb-20">
          {categories.length === 0 ? (
            <EmptyStates.Products />
          ) : (
            categories.map((category) => (
              <section key={category.id} id={category.id} className="mb-6">
                {/* Category Header - Sticky */}
                <div className="sticky top-40 z-10 bg-background px-4 py-3 border-b">
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {category.items.length} items
                  </p>
                </div>
                
                {/* Items Grid - Vertical Cards */}
                <div className="grid grid-cols-2 gap-4 px-4 mt-3 md:grid-cols-3 lg:grid-cols-4">
                  {category.items.map((item) => (
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
                      moq={item.moq}
                      eta={item.eta || "1-2 days"}
                      onClick={() => setSelectedItemId(item.id)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
        <FloatingCartButton />
        <CustomerBottomNav />
      </div>

      {/* Product Sheet for items */}
      {selectedItemId && (
        <Sheet open={!!selectedItemId} onOpenChange={(open) => !open && setSelectedItemId(null)}>
          <SheetContent 
            side="bottom" 
            className="h-[90vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 p-0"
            hideCloseButton
          >
            <ProductSheet
              itemId={selectedItemId}
              onClose={() => setSelectedItemId(null)}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

