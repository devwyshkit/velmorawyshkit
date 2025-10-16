import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Filter {
  id: string;
  label: string;
  value: string;
  category: 'price' | 'occasion' | 'category';
}

interface FilterChipsProps {
  onFilterChange?: (activeFilters: Filter[]) => void;
  className?: string;
}

export const FilterChips = ({ onFilterChange, className }: FilterChipsProps) => {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);

  const filters: Filter[] = [
    // Price filters
    { id: 'price-1', label: 'Under ₹500', value: '0-500', category: 'price' },
    { id: 'price-2', label: '₹500-₹1000', value: '500-1000', category: 'price' },
    { id: 'price-3', label: '₹1000-₹2500', value: '1000-2500', category: 'price' },
    { id: 'price-4', label: 'Above ₹2500', value: '2500-999999', category: 'price' },
    
    // Occasion filters
    { id: 'occasion-1', label: 'Birthday', value: 'birthday', category: 'occasion' },
    { id: 'occasion-2', label: 'Anniversary', value: 'anniversary', category: 'occasion' },
    { id: 'occasion-3', label: 'Wedding', value: 'wedding', category: 'occasion' },
    { id: 'occasion-4', label: 'Corporate', value: 'corporate', category: 'occasion' },
    
    // Category filters
    { id: 'category-1', label: 'Hampers', value: 'hamper', category: 'category' },
    { id: 'category-2', label: 'Chocolates', value: 'chocolate', category: 'category' },
    { id: 'category-3', label: 'Personalized', value: 'custom', category: 'category' },
    { id: 'category-4', label: 'Premium', value: 'premium', category: 'category' },
  ];

  const handleFilterToggle = (filter: Filter) => {
    const isActive = activeFilters.some(f => f.id === filter.id);
    
    let newActiveFilters: Filter[];
    if (isActive) {
      // Remove filter
      newActiveFilters = activeFilters.filter(f => f.id !== filter.id);
    } else {
      // Add filter (remove other filters from same category first)
      newActiveFilters = [
        ...activeFilters.filter(f => f.category !== filter.category),
        filter
      ];
    }
    
    setActiveFilters(newActiveFilters);
    onFilterChange?.(newActiveFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters([]);
    onFilterChange?.([]);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Active Filters with Clear */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground">Active:</span>
          {activeFilters.map(filter => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleFilterToggle(filter)}
            >
              {filter.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Chips - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(filter => {
          const isActive = activeFilters.some(f => f.id === filter.id);
          
          return (
            <button
              key={filter.id}
              onClick={() => handleFilterToggle(filter)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

