import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import React from "react";
import { cn } from "@/lib/utils";

// Modern E-commerce Horizontal Scroll - 2024 Standards
// Native scroll-snap, momentum scrolling, position indicators, fade edges

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
  gap?: "none" | "sm" | "md" | "lg";
  itemWidth?: string;
  paddingX?: "none" | "sm" | "md" | "lg";
  snapAlign?: "start" | "center" | "end";
  showIndicators?: boolean;
  cardType?: "product" | "vendor" | "category" | "auto";
}

export const HorizontalScroll = ({ 
  children, 
  className,
  showArrows = false,
  gap = "md",
  itemWidth,
  paddingX = "md",
  snapAlign = "start",
  showIndicators = true,
  cardType = "auto"
}: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const gapClasses = {
    none: "gap-0",
    sm: "gap-3",
    md: "gap-4", 
    lg: "gap-6"
  };

  const paddingClasses = {
    none: "",
    sm: "px-3",
    md: "px-4",
    lg: "px-6"
  };

  // Responsive card width based on type
  const getCardWidthClass = () => {
    if (itemWidth) return "";
    
    switch (cardType) {
      case "product":
        return "[&>*]:w-[75vw] [&>*]:max-w-[280px] [&>*]:min-w-[160px] sm:[&>*]:w-48";
      case "vendor": 
        return "[&>*]:w-[85vw] [&>*]:max-w-[320px] [&>*]:min-w-[280px] sm:[&>*]:w-64";
      case "category":
        return "[&>*]:w-auto [&>*]:min-w-[80px] [&>*]:min-h-[44px]";
      default:
        return "[&>*]:flex-shrink-0";
    }
  };

  const checkScrollability = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    
    // Calculate current page for indicators
    if (cardType === "product" || cardType === "vendor") {
      const itemWidth = cardType === "product" ? 200 : 260; // Approximate width
      const visibleItems = Math.floor(clientWidth / itemWidth);
      const totalItems = React.Children.count(children);
      const pages = Math.ceil(totalItems / visibleItems);
      const currentPageNum = Math.floor((scrollLeft + clientWidth / 2) / clientWidth);
      
      setTotalPages(pages);
      setCurrentPage(Math.max(0, Math.min(currentPageNum, pages - 1)));
    }
  }, [children, cardType]);

  const scrollTo = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    
    const scrollAmount = scrollRef.current.clientWidth * 0.85;
    const newScrollLeft = direction === "left" 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    checkScrollability();
    const scrollElement = scrollRef.current;
    
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollability, { passive: true });
      return () => scrollElement.removeEventListener("scroll", checkScrollability);
    }
  }, [children, checkScrollability]);

  return (
    <div className="relative group mobile-container-fix">
      {/* Fade Edge Gradients */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none",
        "bg-gradient-to-r from-background via-background/80 to-transparent",
        canScrollLeft ? "opacity-100" : "opacity-0",
        "transition-opacity duration-200"
      )} />
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none", 
        "bg-gradient-to-l from-background via-background/80 to-transparent",
        canScrollRight ? "opacity-100" : "opacity-0",
        "transition-opacity duration-200"
      )} />

      {/* Desktop Navigation Arrows */}
      {showArrows && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-all duration-200",
              "hidden md:flex backdrop-blur-sm",
              !canScrollLeft && "invisible"
            )}
            onClick={() => scrollTo("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-all duration-200",
              "hidden md:flex backdrop-blur-sm",
              !canScrollRight && "invisible"
            )}
            onClick={() => scrollTo("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto scroll-smooth mobile-container-fix",
          "snap-x snap-mandatory",
          "[&>*]:snap-align-start",
          snapAlign === "center" && "[&>*]:snap-align-center",
          snapAlign === "end" && "[&>*]:snap-align-end",
          "scrollbar-hide overscroll-x-contain",
          gapClasses[gap],
          paddingClasses[paddingX],
          getCardWidthClass(),
          className
        )}
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          scrollBehavior: "smooth"
        }}
        role="list"
        aria-label="Horizontal scroll content"
      >
        {children}
      </div>

      {/* Unified Carousel Indicators - DLS Standard Pattern */}
      {showIndicators && totalPages > 1 && (
        <div className="flex justify-center mt-2 md:hidden">
          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 rounded-full transition-all duration-200",
                  index === currentPage 
                    ? "w-4 bg-primary" 
                    : "w-1 bg-muted hover:bg-muted-foreground/50"
                )}
                role="button"
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unified Category Indicators - Same Pattern */}
      {showIndicators && cardType === "category" && (
        <div className="flex justify-center mt-2 md:hidden">
          <div className="flex gap-1">
            <div className={cn(
              "h-1 rounded-full transition-all duration-200",
              canScrollLeft ? "w-1 bg-muted" : "w-4 bg-primary"
            )} />
            <div className={cn(
              "h-1 rounded-full transition-all duration-200", 
              canScrollRight ? "w-1 bg-muted" : "w-4 bg-primary"
            )} />
          </div>
        </div>
      )}
    </div>
  );
};