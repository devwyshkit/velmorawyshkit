import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Search as SearchIcon, Clock, TrendingUp, Mic, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "product" | "category" | "store" | "vendor" | "recent" | "trending";
  count?: number;
}

interface SearchBarProps {
  variant?: "homepage" | "fullpage" | "header" | "navigation";
  placeholder?: string;
  showVoiceSearch?: boolean;
  showSuggestions?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
}

const RECENT_SEARCHES_KEY = 'wyshkit_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export const SearchBar = ({
  variant = "homepage",
  placeholder = "Search for gifts, occasions, stores...",
  showVoiceSearch = true,
  showSuggestions = true,
  className,
  onSearch,
  defaultValue = ""
}: SearchBarProps) => {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock suggestions - In real app, this would be from API
  const mockSuggestions: SearchSuggestion[] = [
    { id: "1", text: "birthday gifts", type: "trending", count: 1234 },
    { id: "2", text: "corporate mugs", type: "product", count: 567 },
    { id: "3", text: "custom t-shirts", type: "product", count: 890 },
    { id: "4", text: "wedding hampers", type: "category", count: 345 },
    { id: "5", text: "QuickGifts", type: "vendor", count: 123 },
    { id: "6", text: "anniversary gifts", type: "trending", count: 678 },
    { id: "7", text: "office supplies", type: "category", count: 234 },
    { id: "8", text: "personalized gifts", type: "product", count: 456 }
  ];

  // Mock trending searches
  const trendingSearches = [
    'Birthday Gifts',
    'Chocolate Hampers',
    'Custom Mugs',
    'Corporate Gifts',
    'Wedding Favors',
  ];

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        // Handle error silently in production
      }
    }
  }, []);

  // Sync value with defaultValue prop changes (for controlled component behavior)
  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== value) {
      setValue(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  // Filter suggestions based on input
  useEffect(() => {
    if (showSuggestions && value.trim()) {
      const filtered = mockSuggestions.filter(s => 
        s.text.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
    } else if (showSuggestions) {
      // Show recent searches and trending when no input
      const recentSuggestions = recentSearches.slice(0, 3).map(search => ({
        id: `recent-${search}`, 
        text: search, 
        type: "recent" as const
      }));
      const trendingSuggestions = mockSuggestions
        .filter(s => s.type === "trending")
        .slice(0, 3);
      setSuggestions([...recentSuggestions, ...trendingSuggestions]);
    }
  }, [value, recentSearches, showSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      saveRecentSearch(query);
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setValue(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(value);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleVoiceSearch = async () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsVoiceActive(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setValue(transcript);
        handleSearch(transcript);
        setIsVoiceActive(false);
      };

      recognition.onerror = () => {
        setIsVoiceActive(false);
      };

      recognition.onend = () => {
        setIsVoiceActive(false);
      };

      recognition.start();
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "recent": return Clock;
      case "trending": return TrendingUp;
      default: return SearchIcon;
    }
  };

  // Header variant - icon only button (deprecated, use navigation variant instead)
  if (variant === "header") {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-11 w-11", className)}
        onClick={() => navigate(RouteMap.search())}
        aria-label="Search"
      >
        <SearchIcon className="h-6 w-6" />
      </Button>
    );
  }

  // Navigation variant - functional search bar for header (Swiggy 2025 pattern)
  if (variant === "navigation") {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full md:flex-1 md:max-w-md",
          className
        )}
      >
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            placeholder={placeholder || "Search for gifts, occasions..."}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 h-10 md:h-9 bg-muted/50 border-0 rounded-lg text-sm"
          />
          
          {/* Clear button */}
          {value && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setValue("");
                setIsOpen(false);
              }}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && showSuggestions && (suggestions.length > 0 || recentSearches.length > 0 || value.trim()) && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[400px] overflow-y-auto shadow-lg border w-full md:w-auto md:min-w-full">
            <CardContent className="p-2">
              {value.trim() ? (
                // Show filtered suggestions
                <div className="space-y-1">
                  {suggestions.map((suggestion) => {
                    const Icon = getSuggestionIcon(suggestion.type);
                    return (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 text-sm">{suggestion.text}</span>
                        {suggestion.count && (
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.count}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                // Show recent searches and trending when no input
                <div className="space-y-3">
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-3 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-primary hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.slice(0, 5).map((search) => (
                          <button
                            key={search}
                            onClick={() => handleSearch(search)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 text-sm">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {trendingSearches.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground px-3 py-1.5 block">Trending</span>
                      <div className="space-y-1">
                        {trendingSearches.slice(0, 5).map((search) => (
                          <button
                            key={search}
                            onClick={() => handleSearch(search)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-left transition-colors"
                          >
                            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="flex-1 text-sm">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Homepage variant - integrated search bar (read-only, navigates to search page)
  // Swiggy 2025 pattern: Search bar is part of main content, not sticky navigation tier
  if (variant === "homepage") {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "w-full",
          className
        )}
      >
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value=""
            onKeyPress={handleKeyPress}
            onFocus={() => {
              // Navigate to search page when focused on homepage variant
              navigate(RouteMap.search());
            }}
            onClick={() => {
              // Navigate to search page when clicked on homepage variant
              navigate(RouteMap.search());
            }}
            className="pl-10 pr-4 h-12 bg-muted/50 border-0 rounded-xl cursor-pointer shadow-sm"
            readOnly // Make it read-only so clicking navigates to search page
          />
          {/* No voice search button on read-only input - consistent UX */}
        </div>
      </div>
    );
  }

  // Fullpage variant - search bar with suggestions dropdown
  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-20 h-12 bg-muted/50 border-0 rounded-xl"
        />
        
        {/* Right Actions */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                setValue("");
                setIsOpen(false);
              }}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {showVoiceSearch && (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8",
                isVoiceActive && "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
              )}
              onClick={handleVoiceSearch}
              aria-label="Voice search"
            >
              <Mic className={cn(
                "h-4 w-4",
                isVoiceActive && "animate-pulse"
              )} />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border shadow-lg">
          <CardContent className="p-0">
            {/* Header */}
            {suggestions.length > 0 && (
              <div className="flex items-center justify-between p-3 border-b">
                <span className="text-sm font-medium text-muted-foreground">
                  {value.trim() ? "Suggestions" : "Recent & Trending"}
                </span>
                {!value.trim() && recentSearches.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem(RECENT_SEARCHES_KEY);
                      setSuggestions(mockSuggestions.filter(s => s.type === "trending").slice(0, 3));
                    }}
                    className="text-xs text-muted-foreground"
                  >
                    Clear Recent
                  </Button>
                )}
              </div>
            )}

            {/* Suggestions List */}
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion) => {
                const Icon = getSuggestionIcon(suggestion.type);
                return (
                  <button
                    key={suggestion.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm">{suggestion.text}</span>
                    {suggestion.count && (
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count.toLocaleString()}
                      </Badge>
                    )}
                    {suggestion.type === "trending" && (
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400">
                        Trending
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* No Results */}
            {value.trim() && suggestions.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No suggestions found for "{value}"</p>
                <p className="text-xs mt-1">Try searching for gifts, categories, or stores</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

