import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, X, TrendingUp, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { searchItems, searchPartners } from "@/lib/integrations/supabase-data";
import { EmptyStates } from "@/components/ui/empty-state";
import { SkeletonComponents } from "@/components/ui/skeleton-screen";

interface SearchResult {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  type: 'item' | 'partner';
  badge?: 'bestseller' | 'trending';
  ratingCount?: number;
  shortDesc?: string;
  sponsored?: boolean;
}

const RECENT_SEARCHES_KEY = 'wyshkit_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const CustomerMobileSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Get query params
  const occasionParam = searchParams.get('occasion');
  const viewParam = searchParams.get('view');

  // Mock trending searches
  const trendingSearches = [
    'Birthday Gifts',
    'Chocolate Hampers',
    'Custom Mugs',
    'Corporate Gifts',
    'Wedding Favors',
  ];

  // Handle query parameters (occasion or view=partners)
  useEffect(() => {
    if (occasionParam) {
      // Auto-search for occasion
      setSearchQuery(occasionParam);
    } else if (viewParam === 'partners') {
      // Show all partners
      setSearchQuery(''); // Will show trending instead
    }
  }, [occasionParam, viewParam]);

  // Backend search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim() && searchQuery.length > 2) {
        try {
          // Search both items and partners
          const [itemResults, partnerResults] = await Promise.all([
            searchItems(searchQuery),
            searchPartners(searchQuery),
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
          
          // Transform partners to search results
          const partnerSearchResults: SearchResult[] = partnerResults.map(partner => ({
            id: partner.id,
            name: partner.name,
            image: partner.image,
            price: -1, // Use -1 to indicate "no price" for partners (will be hidden in UI)
            rating: partner.rating,
            ratingCount: partner.ratingCount,
            type: 'partner' as const,
            badge: partner.badge,
            shortDesc: partner.tagline,
            sponsored: partner.sponsored,
          }));
          
          // Combine results: partners first (if any), then items
          setResults([...partnerSearchResults, ...itemSearchResults]);
        } catch (error) {
          console.error('Search failed:', error);
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

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      saveRecentSearch(query);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setResults([]);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleItemClick = (item: SearchResult) => {
    if (item.type === 'item') {
      navigate(`/customer/items/${item.id}`);
    } else {
      navigate(`/customer/partners/${item.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Custom Search Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-card border-b border-border">
        <div className="flex items-center gap-3 h-14 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer/home")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for gifts, partners..."
              className="pl-9 pr-9"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleClearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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
          /* Recent & Trending Searches */
          <div className="space-y-4 md:space-y-6">
            {/* Recent Searches (Swiggy/Zomato pattern) */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <SearchIcon className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Recent Searches</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-auto p-0 text-sm"
                    onClick={clearRecentSearches}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="space-y-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(term)}
                      className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-sm">{term}</span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
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
                <li>• Look for partners by name</li>
                <li>• Use keywords like "custom" or "personalized"</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};

