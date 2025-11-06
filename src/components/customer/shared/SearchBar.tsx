import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Search as SearchIcon, Clock, TrendingUp, Mic, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSearchSuggestions, saveSearchHistory, getTrendingSearches } from "@/lib/integrations/supabase-data";
import { useAuth } from "@/contexts/AuthContext";
import { useDelivery } from "@/contexts/DeliveryContext";

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

const RECENT_SEARCHES_KEY = 'wyshkit_recent_searches'; // Kept for backward compatibility only
const MAX_RECENT_SEARCHES = 10;

// Get or create session ID for anonymous users
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('wyshkit_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('wyshkit_session_id', sessionId);
  }
  return sessionId;
};

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
  const { user } = useAuth();
  const { location: deliveryLocation } = useDelivery();
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Swiggy 2025: No mock data - all suggestions from backend API

  // Sync value with defaultValue prop changes (for controlled component behavior)
  useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== value) {
      setValue(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  // Fetch suggestions from backend API - Swiggy 2025 pattern (200ms debounce, 1+ char)
  useEffect(() => {
    if (!showSuggestions) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Swiggy 2025: Show suggestions from 1 character (not 3+)
    if (value.trim().length >= 0) {
      setIsLoadingSuggestions(true);
      
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const sessionId = user ? undefined : getOrCreateSessionId();
          const fetchedSuggestions = await getSearchSuggestions(
            value.trim(),
            user?.id || null,
            sessionId
          );
          
          setSuggestions(fetchedSuggestions);
        } catch (error) {
          // Silent error handling - suggestions unavailable (Swiggy 2025 pattern)
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 200); // Swiggy 2025: 200ms debounce (not 300ms)
    } else {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, showSuggestions, user]);

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

  // Save search to Supabase history - Swiggy 2025 pattern (sync across devices)
  const saveSearch = async (query: string, searchSource: 'search_bar' | 'voice' | 'autocomplete' | 'trending' | 'recent' = 'search_bar') => {
    if (!query.trim()) return;
    
    const sessionId = user ? undefined : getOrCreateSessionId();
    await saveSearchHistory(query, user?.id || null, sessionId, {
      searchSource,
      location: deliveryLocation || undefined,
    });
    
    // Also keep localStorage for backward compatibility (will be phased out)
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const recentSearches = stored ? JSON.parse(stored) : [];
      const updated = [query, ...recentSearches.filter((s: string) => s !== query)].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      // Silent fail
    }
  };

  const handleSearch = async (query: string, searchSource: 'search_bar' | 'voice' | 'autocomplete' | 'trending' | 'recent' = 'search_bar') => {
    if (query.trim()) {
      await saveSearch(query, searchSource);
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
    const searchSource = suggestion.type === 'recent' ? 'recent' : 
                         suggestion.type === 'trending' ? 'trending' : 
                         'autocomplete';
    handleSearch(suggestion.text, searchSource);
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
        handleSearch(transcript, 'voice');
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

        {/* Suggestions Dropdown - Swiggy 2025: All from backend, no mock data */}
        {isOpen && showSuggestions && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[400px] overflow-y-auto shadow-lg border w-full md:w-auto md:min-w-full">
            <CardContent className="p-2">
              {isLoadingSuggestions ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading suggestions...</div>
              ) : suggestions.length > 0 ? (
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
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {value.trim().length > 0 ? 'No suggestions found' : 'Start typing to search...'}
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
                isVoiceActive && "bg-red-100 text-red-600"
              )}
              onClick={handleVoiceSearch}
              aria-label="Voice search"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border shadow-lg">
          <CardContent className="p-0">
            {/* Suggestions List - Swiggy 2025: All from backend */}
            <div className="max-h-64 overflow-y-auto">
              {isLoadingSuggestions ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading suggestions...</div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion) => {
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
                })
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <SearchIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{value.trim() ? `No suggestions found for "${value}"` : 'Start typing to search...'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

