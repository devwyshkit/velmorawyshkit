import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { Button } from "@/components/ui/button";
import { CustomerItemCard } from "@/components/customer/shared/CustomerItemCard";
import { Eye, X } from "lucide-react";
import { useState, useEffect } from "react";

// Recently Viewed Products - Amazon/Myntra Standard - DLS Unified
// Uses same EnhancedProductCard as other sections

interface RecentlyViewedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  vendor: {
    id: string;
    name: string;
    rating: number;
  };
  deliveryTime: string;
  deliveryFee: number;
  inStock: boolean;
  stockCount: number;
  category: string;
  viewedAt: Date;
}

interface RecentlyViewedProps {
  onProductClick: (product: RecentlyViewedProduct) => void;
  onClearAll?: () => void;
  maxItems?: number;
  className?: string;
}

export const RecentlyViewed = ({ 
  onProductClick, 
  onClearAll,
  maxItems = 6,
  className 
}: RecentlyViewedProps) => {
  const [recentProducts, setRecentProducts] = useState<RecentlyViewedProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("wyshkit-recently-viewed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentProducts(parsed.slice(0, maxItems));
      } catch (error) {
        // Error parsing recently viewed
      }
    }
  }, [maxItems]);

  // Save to localStorage when products change
  useEffect(() => {
    if (recentProducts.length > 0) {
      localStorage.setItem("wyshkit-recently-viewed", JSON.stringify(recentProducts));
    }
  }, [recentProducts]);

  const handleClearAll = () => {
    setRecentProducts([]);
    localStorage.removeItem("wyshkit-recently-viewed");
    onClearAll?.();
  };

  const removeProduct = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentProducts.filter(p => p.id !== productId);
    setRecentProducts(updated);
  };

  // Add product to recently viewed (called from parent)
  const addProduct = (product: RecentlyViewedProduct) => {
    setRecentProducts(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id);
      // Add to beginning
      const updated = [{ ...product, viewedAt: new Date() }, ...filtered];
      // Limit to maxItems
      return updated.slice(0, maxItems);
    });
  };

  // Export addProduct function for use in other components
  (RecentlyViewed as any).addProduct = addProduct;

  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recently Viewed</h2>
          <span className="text-sm text-muted-foreground">({recentProducts.length})</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      </div>

      {/* Products Horizontal Scroll - DLS Pattern */}
      <HorizontalScroll 
        gap="sm" 
        paddingX="md"
        cardType="product"
        snapAlign="start"
      >
        {recentProducts.map((product) => (
          <div key={product.id} className="relative group">
            <CustomerItemCard
              id={product.id}
              name={product.name}
              image={product.image}
              price={product.price}
              rating={product.rating}
              ratingCount={product.reviewCount}
              onClick={() => onProductClick(product)}
            />
            
            {/* Remove Button - Top right of card */}
            <Button
              size="icon"
              variant="secondary"
              className="absolute -top-2 -right-2 h-6 w-6 bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => removeProduct(product.id, e)}
              aria-label="Remove from recently viewed"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </HorizontalScroll>
    </div>
  );
};

// Utility function to add product to recently viewed from any component
export const addToRecentlyViewed = (product: Omit<RecentlyViewedProduct, 'viewedAt'>) => {
  const stored = localStorage.getItem("wyshkit-recently-viewed");
  let recentProducts: RecentlyViewedProduct[] = [];
  
  if (stored) {
    try {
      recentProducts = JSON.parse(stored);
    } catch (error) {
      // Error parsing recently viewed
    }
  }

  // Remove if already exists
  const filtered = recentProducts.filter(p => p.id !== product.id);
  // Add to beginning
  const updated = [{ ...product, viewedAt: new Date() }, ...filtered];
  // Limit to 20 items
  const limited = updated.slice(0, 20);

  localStorage.setItem("wyshkit-recently-viewed", JSON.stringify(limited));
};