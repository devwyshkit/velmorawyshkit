/**
 * Help Search Bar Component
 * Feature 12: PROMPT 12 - Help Center
 * Real-time search with debouncing
 * Mobile-first design (320px base)
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

/**
 * Search Bar with Debouncing
 * Prevents excessive API calls while typing
 * 300ms debounce delay (Swiggy/Zomato pattern)
 */
export const SearchBar = ({
  onSearch,
  placeholder = "Search for help..."
}: SearchBarProps) => {
  const [query, setQuery] = useState("");

  // Debounced search - waits 300ms after user stops typing
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearch(value);
  }, 300);

  const handleChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 pr-10 h-12 text-base"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

