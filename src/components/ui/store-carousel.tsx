import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HorizontalScroll } from "@/components/ui/horizontal-scroll";
import { Star, Clock, Truck, Heart, Eye, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Global E-commerce Store Carousel - Swiggy/Zomato Pattern
// Mobile-first horizontal store discovery with product previews

interface StoreCarouselItem {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  categories: string[];
  badges: string[];
  isOpen: boolean;
  distance?: string;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  promotions?: string[];
}

interface StoreCarouselProps {
  title: string;
  stores: StoreCarouselItem[];
  onStoreClick: (store: StoreCarouselItem) => void;
  onQuickView?: (store: StoreCarouselItem, e: React.MouseEvent) => void;
  onViewAll?: () => void;
  className?: string;
}

export const StoreCarousel = ({ 
  title,
  stores,
  onStoreClick,
  onQuickView,
  onViewAll,
  className 
}: StoreCarouselProps) => {
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const toggleFollow = (storeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFollowed = new Set(followed);
    if (newFollowed.has(storeId)) {
      newFollowed.delete(storeId);
    } else {
      newFollowed.add(storeId);
    }
    setFollowed(newFollowed);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </div>

      {/* Store Carousel */}
      <HorizontalScroll 
        gap="md" 
        paddingX="md" 
        showArrows
        cardType="store"
        snapAlign="start"
      >
        {stores.map((store) => (
          <Card 
            key={store.id}
            className={cn(
              "group cursor-pointer border transition-all duration-200 hover:shadow-lg",
              !store.isOpen && "opacity-60"
            )}
            onClick={() => onStoreClick(store)}
          >
            <CardContent className="p-0">
              {/* Store Cover */}
              <div className="relative h-24 overflow-hidden rounded-t-lg bg-muted">
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                
                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 bg-white/90 backdrop-blur border shadow-sm"
                    onClick={(e) => toggleFollow(store.id, e)}
                    aria-label="Follow store"
                  >
                    <Heart 
                      className={cn(
                        "h-3 w-3 transition-colors",
                        followed.has(store.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                      )} 
                    />
                  </Button>
                  
                  {onQuickView && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7 bg-white/90 backdrop-blur border shadow-sm"
                      onClick={(e) => onQuickView(store, e)}
                      aria-label="Quick view"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Promotion Banner */}
                {store.promotions && store.promotions.length > 0 && (
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="destructive" className="text-xs">
                      {store.promotions[0]}
                    </Badge>
                  </div>
                )}

                {/* Status Indicator */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    store.isOpen ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    store.isOpen ? "text-green-700" : "text-red-700"
                  )}>
                    {store.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>

              {/* Store Info */}
              <div className="p-3 space-y-3">
                {/* Header */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">{store.name}</h3>
                  
                  {/* Metrics Row */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{store.rating}</span>
                      <span>({store.reviewCount}+)</span>
                    </div>
                    
                    <span className="text-muted-foreground/60">•</span>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{store.deliveryTime}</span>
                    </div>

                    {store.distance && (
                      <>
                        <span className="text-muted-foreground/60">•</span>
                        <span>{store.distance}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  {store.categories.slice(0, 3).map((category) => (
                    <Badge 
                      key={category} 
                      variant="outline" 
                      className="text-xs whitespace-nowrap flex-shrink-0"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Delivery Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">
                      {store.deliveryFee === 0 ? "Free delivery" : `₹${store.deliveryFee} delivery`}
                    </span>
                    {store.minOrder > 0 && (
                      <span className="text-muted-foreground">• ₹{store.minOrder}+ min</span>
                    )}
                  </div>
                </div>

                {/* Product Previews - Swiggy Pattern */}
                {store.topProducts.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium mb-2">Popular items</p>
                    
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                      {store.topProducts.slice(0, 3).map((product) => (
                        <div 
                          key={product.id}
                          className="flex-shrink-0 group cursor-pointer"
                        >
                          <div className="w-16 space-y-1">
                            <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden">
                              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                <div className="w-6 h-6 bg-primary/20 rounded" />
                              </div>
                              
                              {/* Quick Add - Mobile Optimized */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <Button 
                                  size="sm" 
                                  className="h-5 px-2 text-xs bg-white text-primary hover:bg-white/90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Quick add to cart functionality
                                  }}
                                >
                                  ADD
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-xs font-medium truncate">{product.name}</p>
                              <p className="text-xs text-primary font-semibold">₹{product.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Store Badges */}
                {store.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {store.badges.slice(0, 2).map((badge) => (
                      <Badge 
                        key={badge} 
                        variant="secondary" 
                        className="text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </HorizontalScroll>
    </div>
  );
};

// Legacy export for backward compatibility
export const VendorCarousel = StoreCarousel;

