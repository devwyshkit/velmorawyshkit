import { useState, useEffect } from "react";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SortOption =
  | "relevance"
  | "rating"
  | "delivery"
  | "cost-low"
  | "cost-high";
export type FilterOption = "offers" | "fast-delivery" | "new";

interface SmartFiltersProps {
  sortBy: SortOption;
  filters: FilterOption[];
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filters: FilterOption[]) => void;
  className?: string;
  sticky?: boolean;
  stickyTop?: string;
}

export const SmartFilters = ({
  sortBy,
  filters,
  onSortChange,
  onFilterChange,
  className,
  sticky = true,
  stickyTop = "top-[58px]",
}: SmartFiltersProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleFilterToggle = (filter: FilterOption) => {
    const isActive = filters.includes(filter);
    if (isActive) {
      onFilterChange(filters.filter((f) => f !== filter));
    } else {
      onFilterChange([...filters, filter]);
    }
  };

  const handleClearFilters = () => {
    onFilterChange([]);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "relevance", label: "Relevance" },
    { value: "rating", label: "Rating" },
    { value: "delivery", label: "Delivery Time" },
    { value: "cost-low", label: "Cost: Low to High" },
    { value: "cost-high", label: "Cost: High to Low" },
  ];

  const filterOptions: { value: FilterOption; label: string; icon: string }[] =
    [
      { value: "offers", label: "Offers", icon: "🎁" },
      { value: "fast-delivery", label: "Fast Delivery", icon: "⚡" },
      { value: "new", label: "New", icon: "✨" },
    ];

  return (
    <div
      className={cn(
        "w-full bg-background border-b border-border z-40",
        sticky && `sticky ${stickyTop}`,
        className,
      )}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {/* Sort Dropdown - Desktop */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onValueChange={(value) => onSortChange(value as SortOption)}
            >
              <SelectTrigger className="w-[160px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Chips - Horizontal Scroll */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide pb-1">
            {filterOptions.map((filter) => {
              const isActive = filters.includes(filter.value);
              return (
                <button
                  key={filter.value}
                  onClick={() => handleFilterToggle(filter.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap flex-shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted",
                  )}
                  aria-label={`Filter by ${filter.label}${isActive ? ", active" : ""}`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile: Sheet with Sort + Filters */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="md:hidden h-8 gap-1.5 flex-shrink-0"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {filters.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {filters.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Filters & Sort</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Sort Section */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Sort By</h3>
                  <div className="space-y-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                          setIsSheetOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-lg border transition-colors",
                          sortBy === option.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Filters</h3>
                    {filters.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-7 text-xs"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {filterOptions.map((filter) => {
                      const isActive = filters.includes(filter.value);
                      return (
                        <button
                          key={filter.value}
                          onClick={() => handleFilterToggle(filter.value)}
                          className={cn(
                            "w-full flex items-center gap-3 text-left px-4 py-2.5 rounded-lg border transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-muted",
                          )}
                        >
                          <span className="text-lg">{filter.icon}</span>
                          <span className="flex-1">{filter.label}</span>
                          {isActive && <X className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop: Filter Count Badge (if active) */}
          {filters.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={handleClearFilters}
              >
                {filters.length} active
                <X className="h-3 w-3" />
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
