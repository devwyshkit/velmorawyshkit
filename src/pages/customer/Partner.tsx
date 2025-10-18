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
        console.error('Failed to load partner data:', error);
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

          {/* Items Skeleton - Matches CustomerItemCard */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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

        {/* Filter Chips */}
        <section className="px-4 py-3">
          <FilterChips onFilterChange={handleFilterChange} />
        </section>

        {/* Items Grid - Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
        <main className="space-y-3">
          <div className="flex items-center justify-between px-4">
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
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </div>
        </main>

        <ComplianceFooter />
        <FloatingCartButton />
        <CustomerBottomNav />
      </div>

      {/* Item Bottom Sheet */}
      <Sheet open={isItemSheetOpen} onOpenChange={setIsItemSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-xl p-0 overflow-y-auto sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
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

