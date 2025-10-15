import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Truck, Users, Heart, Eye } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Global E-commerce Standard Vendor Card - Following Swiggy/Zomato Pattern
// Comprehensive vendor information with social proof and quick actions

interface Vendor {
  id: string;
  name: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  categories: string[];
  topProducts: string[];
  isFollowed?: boolean;
  badges: string[];
  promotions?: string[];
  distance?: string;
  isOpen: boolean;
  deliveryPartner?: string;
}

interface VendorCardProps {
  vendor: Vendor;
  onVendorClick: (vendor: Vendor) => void;
  onQuickView?: (vendor: Vendor, e: React.MouseEvent) => void;
  variant?: "compact" | "detailed";
  className?: string;
}

export const VendorCard = ({ 
  vendor, 
  onVendorClick, 
  onQuickView,
  variant = "compact",
  className 
}: VendorCardProps) => {
  const [isFollowed, setIsFollowed] = useState(vendor.isFollowed || false);

  const toggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowed(!isFollowed);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView?.(vendor, e);
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer border transition-all duration-200 hover:shadow-lg",
        !vendor.isOpen && "opacity-60",
        className
      )}
      onClick={() => onVendorClick(vendor)}
    >
      <CardContent className="p-0">
        {/* Vendor Cover Image - Swiggy Style */}
        {variant === "detailed" && (
          <div className="relative h-32 overflow-hidden rounded-t-lg">
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            
            {/* Overlay Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 backdrop-blur border shadow-sm"
                onClick={toggleFollow}
                aria-label={isFollowed ? "Unfollow vendor" : "Follow vendor"}
              >
                <Heart 
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isFollowed ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  )} 
                />
              </Button>
              
              {onQuickView && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-white/90 backdrop-blur border shadow-sm"
                  onClick={handleQuickView}
                  aria-label="Quick view vendor"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Promotion Banner */}
            {vendor.promotions && vendor.promotions.length > 0 && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="destructive" className="text-xs font-medium">
                  {vendor.promotions[0]}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Vendor Info Section */}
        <div className="p-4 space-y-3">
          {/* Header Row - Name + Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{vendor.name}</h3>
              
              {/* Key Metrics Row - Swiggy Pattern */}
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{vendor.rating}</span>
                  <span>({vendor.reviewCount}+)</span>
                </div>
                
                <span className="text-muted-foreground/60">•</span>
                
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{vendor.deliveryTime}</span>
                </div>

                {vendor.distance && (
                  <>
                    <span className="text-muted-foreground/60">•</span>
                    <span>{vendor.distance}</span>
                  </>
                )}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={cn(
                "w-2 h-2 rounded-full",
                vendor.isOpen ? "bg-green-500" : "bg-red-500"
              )} />
              <span className={cn(
                "text-xs font-medium",
                vendor.isOpen ? "text-green-600" : "text-red-600"
              )}>
                {vendor.isOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>

          {/* Categories - Horizontal scroll chips - Fixed overflow */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {vendor.categories.slice(0, 3).map((category) => (
              <Badge 
                key={category} 
                variant="outline" 
                className="text-xs whitespace-nowrap flex-shrink-0 max-w-[80px] truncate"
              >
                {category}
              </Badge>
            ))}
            {vendor.categories.length > 3 && (
              <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                +{vendor.categories.length - 3}
              </Badge>
            )}
          </div>

          {/* Delivery Info Row - Key for B2C */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">
                {vendor.deliveryFee === 0 ? "Free delivery" : `₹${vendor.deliveryFee} delivery`}
              </span>
              {vendor.minOrder > 0 && (
                <span className="text-muted-foreground">• ₹{vendor.minOrder}+ min</span>
              )}
            </div>
          </div>

          {/* Vendor Badges - Social Proof */}
          {vendor.badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vendor.badges.slice(0, 2).map((badge) => (
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

          {/* Product Previews - Swiggy Pattern (All Variants) */}
          {vendor.topProducts.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">Popular items</p>
                <span className="text-xs text-primary cursor-pointer hover:underline">View all</span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {vendor.topProducts.slice(0, 4).map((productId, index) => {
                  // Mock product data - in real app, fetch from API
                  const mockProducts = [
                    { id: 'p1', name: 'Coffee Mug', price: 299, image: '/placeholder.svg' },
                    { id: 'p2', name: 'Photo Frame', price: 599, image: '/placeholder.svg' },
                    { id: 'p3', name: 'T-Shirt', price: 149, image: '/placeholder.svg' },
                    { id: 'p4', name: 'Hamper', price: 1299, image: '/placeholder.svg' }
                  ];
                  const product = mockProducts[index % mockProducts.length];
                  
                  return (
                    <div 
                      key={productId}
                      className="flex-shrink-0 group cursor-pointer"
                    >
                      {/* Product Mini Card */}
                      <div className="w-20 space-y-1">
                        <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                            <div className="w-8 h-8 bg-primary/20 rounded" />
                          </div>
                          
                          {/* Quick Add Button - Swiggy Style */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Button 
                              size="sm" 
                              className="h-6 px-2 text-xs bg-white text-primary hover:bg-white/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle quick add to cart
                                // Quick add to cart functionality
                              }}
                            >
                              ADD
                            </Button>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="text-center">
                          <p className="text-xs font-medium truncate">{product.name}</p>
                          <p className="text-xs text-primary font-semibold">₹{product.price}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
            {/* MOQ B2C Message - Fixed overflow */}
            <div className="mt-2 px-2 py-1 bg-primary/5 rounded text-xs text-primary break-words">
              Individual units available • MOQ only for customization
            </div>
            </div>
          )}

          {/* Quick Actions - Only for detailed variant */}
          {variant === "detailed" && (
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                className="flex-1 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onVendorClick(vendor);
                }}
              >
                View Menu
              </Button>
              {!isFollowed && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-8"
                  onClick={toggleFollow}
                >
                  Follow
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};