import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RouteMap } from "@/routes";
import { ArrowLeft, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { SearchBar } from "@/components/customer/shared/SearchBar";
import { ProductSheet } from "@/components/customer/shared/ProductSheet";
import { searchItems, searchStores, fetchSavedItems, addToSavedItemsSupabase, removeFromSavedItemsSupabase } from "@/lib/integrations/supabase-data";
import { EmptyStates } from "@/components/ui/empty-state";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  type: 'item' | 'store';
  badge?: 'bestseller' | 'trending';
  ratingCount?: number;
  shortDesc?: string;
  sponsored?: boolean;
}

export const CustomerMobileSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [favouritedItems, setFavouritedItems] = useState<Set<string>>(new Set());

  // Get query params
  const occasionParam = searchParams.get('occasion');
  const viewParam = searchParams.get('view');
  const queryParam = searchParams.get('q');

  // Mock trending searches
  const trendingSearches = [
    'Birthday Gifts',
    'Chocolate Hampers',
    'Custom Mugs',
    'Corporate Gifts',
    'Wedding Favors',
  ];

  // Handle query parameters (occasion or view=stores or q=)
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    } else if (occasionParam) {
      // Auto-search for occasion
      setSearchQuery(occasionParam);
    } else if (viewParam === 'stores') {
      // Show all stores
      setSearchQuery(''); // Will show trending instead
    }
  }, [occasionParam, viewParam, queryParam]);

  // Load favourites on mount
  useEffect(() => {
    const loadFavourites = async () => {
      const items = await fetchSavedItems();
      setFavouritedItems(new Set(items.map(i => i.id)));
    };
    loadFavourites();
  }, []);

  // Backend search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim() && searchQuery.length > 2) {
        try {
          // Search both items and stores
          const [itemResults, storeResults] = await Promise.all([
            searchItems(searchQuery),
            searchStores(searchQuery),
          ]);
          
          // Transform items to search results
          const itemSearchResults: SearchResult[] = itemResults.map(item => ({
            id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            rating: item.rating,
            ratingCount: item.ratingCount,
            type: 'item' as const,
            badge: item.badge,
            shortDesc: item.shortDesc,
            sponsored: item.sponsored,
          }));
          
          // Transform stores to search results
          const storeSearchResults: SearchResult[] = storeResults.map(store => ({
            id: store.id,
            name: store.name,
            image: store.image,
            price: -1, // Use -1 to indicate "no price" for stores (will be hidden in UI)
            rating: store.rating,
            ratingCount: store.ratingCount,
            type: 'store' as const,
            badge: store.badge,
            shortDesc: store.tagline,
            sponsored: store.sponsored,
          }));
          
          // Combine results: stores first (if any), then items
          setResults([...storeSearchResults, ...itemSearchResults]);
        } catch (error) {
          // Handle error silently in production
          setResults([]);
        }
      } else {
        setResults([]);
      }
    };

    // Debounce search by 300ms
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle search from SearchBar component
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Update URL with query param
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
    } else {
      navigate(RouteMap.search(), { replace: true });
    }
  };

  const handleItemClick = (item: SearchResult) => {
    if (item.type === 'item') {
      setSelectedItemId(item.id);
    } else if (item.type === 'store') {
      navigate(RouteMap.store(item.id));
    }
  };

  const handleFavouriteToggle = async (itemId: string, isFavourited: boolean) => {
    if (isFavourited) {
      const success = await addToSavedItemsSupabase(itemId);
      if (success) {
        setFavouritedItems(prev => new Set([...prev, itemId]));
        toast({ title: "Added to favourites" });
      }
    } else {
      const success = await removeFromSavedItemsSupabase(itemId);
      if (success) {
        setFavouritedItems(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        toast({ title: "Removed from favourites" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Header with Back Button */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(RouteMap.home())}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <SearchBar
              variant="fullpage"
              placeholder="Search for gifts, stores..."
              onSearch={handleSearch}
              showSuggestions={true}
              showVoiceSearch={true}
              defaultValue={searchQuery}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {searchQuery && results.length > 0 ? (
          /* Search Results */
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Results for "{searchQuery}"
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {results.map((item) => (
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
                  isFavourited={item.type === 'item' ? favouritedItems.has(item.id) : false}
                  onFavouriteToggle={item.type === 'item' ? handleFavouriteToggle : undefined}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </div>
        ) : searchQuery && results.length === 0 ? (
          /* No Results Found */
          <EmptyStates.Search
            action={{
              label: "Clear Search",
              onClick: () => setSearchQuery("")
            }}
          />
        ) : (
          /* Trending Searches (Recent searches are now handled by SearchBar dropdown) */
          <div className="space-y-4 md:space-y-6">
            {/* Trending Searches */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Trending</h2>
              </div>
              <div className="space-y-2">
              {trendingSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(term)}
                  className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
                >
                  <span className="text-sm">{term}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              </div>
            </div>

            {/* Search Tips */}
            <div className="mt-8 p-4 bg-primary/5 rounded-lg">
              <h3 className="text-sm font-semibold mb-2 text-primary">
                Search Tips
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Try searching for occasions like "birthday" or "wedding"</li>
                <li>• Search by product type like "chocolates" or "hampers"</li>
                <li>• Look for stores by name</li>
                <li>• Use keywords like "custom" or "personalized"</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />
      
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
    </div>
  );
};

