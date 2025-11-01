import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, TrendingUp, X, Mic, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

// GlobalSearch with Suggestions - Google/Amazon Standard
// Voice search, image search, autocomplete, trending searches

interface SearchSuggestion {
  id: string;
  text: string;
  type: "product" | "category" | "store" | "recent" | "trending" | "vendor";
  count?: number;
  image?: string;
}

interface GlobalSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  showVoiceSearch?: boolean;
  showImageSearch?: boolean;
  showSuggestions?: boolean;
  className?: string;
}

export const GlobalSearch = ({
  value,
  onChange,
  onSearch,
  onSuggestionClick,
  placeholder = "Search for gifts, occasions, stores...",
  showVoiceSearch = true,
  showImageSearch = true,
  className
}: GlobalSearchProps) => {
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

  // Load recent searches on mount
  useEffect(() => {
    const stored = localStorage.getItem("wyshkit-recent-searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (error) {
        // Handle error silently in production
      }
    }
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (value.trim()) {
      const filtered = mockSuggestions.filter(s => 
        s.text.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
    } else {
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
  }, [value, recentSearches]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Add to recent searches
      const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updatedRecent);
      localStorage.setItem("wyshkit-recent-searches", JSON.stringify(updatedRecent));
      
      // Perform search
      onSearch(query);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    handleSearch(suggestion.text);
    onSuggestionClick?.(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(value);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("wyshkit-recent-searches");
    setSuggestions(mockSuggestions.filter(s => s.type === "trending").slice(0, 3));
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
        onChange(transcript);
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
      default: return Search;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-20 h-12 bg-muted/50 border-0 rounded-xl"
        />
        
        {/* Right Actions */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {showImageSearch && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => {
                // Handle image search
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.click();
              }}
              aria-label="Search by image"
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
          
          {showVoiceSearch && (
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8",
                isVoiceActive && "bg-red-100 text-red-600"
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
      {isOpen && (
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
                    onClick={clearRecentSearches}
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
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
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
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
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