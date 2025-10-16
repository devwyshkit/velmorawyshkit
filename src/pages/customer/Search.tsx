import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft, X, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";

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
}

export const CustomerMobileSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock trending searches
  const trendingSearches = [
    'Birthday Gifts',
    'Chocolate Hampers',
    'Custom Mugs',
    'Corporate Gifts',
    'Wedding Favors',
  ];

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      name: 'Premium Gift Hamper',
      image: '/placeholder.svg',
      price: 2499,
      rating: 4.6,
      ratingCount: 234,
      type: 'item',
      badge: 'bestseller',
      shortDesc: 'Premium treats & chocolates for special occasions',
    },
    {
      id: '2',
      name: 'Artisan Chocolate Box',
      image: '/placeholder.svg',
      price: 1299,
      rating: 4.8,
      ratingCount: 189,
      type: 'item',
      badge: 'trending',
      shortDesc: 'Belgian chocolates perfect for sweet lovers',
    },
    {
      id: '3',
      name: 'Custom Photo Frame',
      image: '/placeholder.svg',
      price: 899,
      rating: 4.5,
      ratingCount: 98,
      type: 'item',
      shortDesc: 'Personalized frame for cherished memories',
    },
    {
      id: '4',
      name: 'Gourmet Delights',
      image: '/placeholder.svg',
      price: 1999,
      rating: 4.7,
      ratingCount: 145,
      type: 'partner',
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      // Simulate search
      setResults(mockResults);
    } else {
      setResults([]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setResults([]);
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
              type="search"
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
        {results.length > 0 ? (
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
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Trending Searches */
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

