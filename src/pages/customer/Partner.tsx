import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Clock } from "lucide-react";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { FloatingCartButton } from "@/components/customer/shared/FloatingCartButton";
import { FilterChips, type Filter } from "@/components/customer/shared/FilterChips";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemSheetContent } from "@/components/customer/ItemSheetContent";
import { fetchPartnerById, fetchItemsByPartner, type Item as ItemType, type Partner as PartnerType } from "@/lib/integrations/supabase-data";
import { useToast } from "@/hooks/use-toast";

export const Partner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partner, setPartner] = useState<PartnerType | null>(null);
  const [items, setItems] = useState<ItemType[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isItemSheetOpen, setIsItemSheetOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<ItemType[]>([]);
  const [sortedItems, setSortedItems] = useState<ItemType[]>([]);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPartnerData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Load partner details
        const partnerData = await fetchPartnerById(id);
        setPartner(partnerData);

        // Load partner items
        const itemsData = await fetchItemsByPartner(id);
        setItems(itemsData);
        setFilteredItems(itemsData);
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

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsItemSheetOpen(true);
  };

  const handleCloseItemSheet = () => {
    setIsItemSheetOpen(false);
    setSelectedItemId(null);
  };

  // Track browsing history for better OpenAI recommendations
  useEffect(() => {
    if (selectedItemId && isItemSheetOpen) {
      try {
        const history = JSON.parse(localStorage.getItem('wyshkit_browsing_history') || '[]');
        const updated = [selectedItemId, ...history.filter((id: string) => id !== selectedItemId).slice(0, 19)]; // Keep last 20, avoid duplicates
        localStorage.setItem('wyshkit_browsing_history', JSON.stringify(updated));
      } catch (error) {
        // Handle error silently in production
      }
    }
  }, [selectedItemId, isItemSheetOpen]);

  const handleFilterChange = (activeFilters: Filter[]) => {
    if (activeFilters.length === 0) {
      setFilteredItems(items);
      return;
    }

    // Filter items based on active filters
    let filtered = [...items];

    activeFilters.forEach(filter => {
      if (filter.category === 'price') {
        const [min, max] = filter.value.split('-').map(Number);
        filtered = filtered.filter(item => item.price >= min && item.price <= max);
      }
      // Add occasion and category filtering when backend supports it
    });

    setFilteredItems(filtered);
  };

  // Sort items based on selected sort option
  useEffect(() => {
    let sorted = [...filteredItems];
    
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popularity':
      default:
        sorted.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    }
    
    setSortedItems(sorted);
  }, [sortBy, filteredItems]);

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

        {/* Partner Info */}
        <section className="px-4 py-4 bg-card border-b border-border">
          <div className="flex gap-3">
            <img
              src={partner.image}
              alt={partner.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h2 className="text-base font-semibold mb-1">{partner.name}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {partner.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {partner.delivery}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Chips - Sticky on scroll for better UX */}
        <section className="sticky top-14 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 border-b border-border transition-shadow mb-4">
          <FilterChips onFilterChange={handleFilterChange} />
        </section>

        {/* Items Grid - Global E-commerce Standard: Grid layout for product browsing */}
        <main className="mt-4">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-lg font-semibold">
              Browse Items 
              {filteredItems.length !== items.length && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredItems.length} results)
                </span>
              )}
            </h2>
            
            {/* Sort Dropdown - Swiggy/Zomato Pattern */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="price-low">Price: Low-High</SelectItem>
                <SelectItem value="price-high">Price: High-Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-3 lg:grid-cols-4">
            {sortedItems.map((item) => (
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
                moq={item.moq}
                eta={item.eta || "1-2 days"}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </div>
        </main>

        <ComplianceFooter />
        <FloatingCartButton />
        <CustomerBottomNav />
      </div>

      {/* Item Bottom Sheet - Material Design 3 */}
      <Sheet open={isItemSheetOpen} onOpenChange={setIsItemSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-xl p-0 overflow-y-auto sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
          {/* Drag Handle - Material Design 3 */}
          <div className="flex justify-center py-2">
            <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
          {selectedItemId && (
            <ItemSheetContent
              itemId={selectedItemId}
              onClose={handleCloseItemSheet}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

