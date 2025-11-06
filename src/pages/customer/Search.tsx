import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RouteMap } from "@/routes";
import { ArrowLeft, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { StickyCartBar } from "@/components/customer/shared/StickyCartBar";
import { SearchBar } from "@/components/customer/shared/SearchBar";
import { ProductSheet } from "@/components/customer/shared/ProductSheet";
import { searchItems, fetchSavedItems, addToSavedItemsSupabase, removeFromSavedItemsSupabase, getTrendingSearches, saveSearchHistory } from "@/lib/integrations/supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { generateSessionId } from "@/lib/utils/id-generator";
import { EmptyStates } from "@/components/ui/empty-state";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [favouritedItems, setFavouritedItems] = useState<Set<string>>(new Set());
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);

  // Get query params
  const occasionParam = searchParams.get('occasion');
  const viewParam = searchParams.get('view');
  const queryParam = searchParams.get('q');

  // Swiggy 2025: Fetch real trending searches from backend (not fake mock data)

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

  // Swiggy 2025: Load real trending searches from backend
  useEffect(() => {
    const loadTrending = async () => {
      const trending = await getTrendingSearches(10);
      setTrendingSearches(trending);
    };
    loadTrending();
  }, []);

  // Swiggy 2025: Backend search with 200ms debounce, 1+ character threshold
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim() && searchQuery.length >= 1) {
        try {
          // Search items only (Swiggy pattern - no direct store pages)
          const itemResults = await searchItems(searchQuery);
          
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
          
          setResults(itemSearchResults);
          
          // Swiggy 2025: Save search to history (sync across devices)
          const sessionId = user ? undefined : generateSessionId();
          await saveSearchHistory(searchQuery, user?.id || null, sessionId, {
            searchSource: 'search_bar',
            resultCount: itemSearchResults.length,
          });
        } catch (error) {
          // Handle error silently in production
          setResults([]);
        }
      } else {
        setResults([]);
      }
    };

    // Swiggy 2025: Debounce search by 200ms (not 300ms)
    const timeoutId = setTimeout(performSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

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
      // Navigate to search with store filter (Swiggy pattern - no direct store pages)
      navigate(RouteMap.search(`store=${item.id}`));
    }
  };

  const handleFavouriteToggle = async (itemId: string, isFavourited: boolean) => {
    if (isFavourited) {
      const success = await addToSavedItemsSupabase(itemId);
      if (success) {
        setFavouritedItems(prev => new Set([...prev, itemId]));
      }
    } else {
      const success = await removeFromSavedItemsSupabase(itemId);
      if (success) {
        setFavouritedItems(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[112px]">
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
      {/* Swiggy 2025: Reduced mobile padding - 12px mobile, 24px desktop */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-6">
        {searchQuery && results.length > 0 ? (
          /* Search Results */
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Results for "{searchQuery}"
            </h2>
            {/* Swiggy 2025: Tighter mobile gap - 12px mobile */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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

          </div>
        )}
      </main>

      <StickyCartBar />
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

