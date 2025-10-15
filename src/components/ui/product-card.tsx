import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceComparison } from "@/components/ui/price-comparison";
import { DeliveryEstimate } from "@/components/ui/delivery-estimate";
import { TrustBadges } from "@/components/ui/trust-badges";
import { Star, Heart, Eye, ShoppingCart, Zap, Shield, Truck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";

// ProductCard - Global E-commerce Standards
// Amazon + Myntra + Flipkart best practices combined

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  vendor: {
    id: string;
    name: string;
    rating: number;
    distance?: string;
    preparationTime?: string;
  };
  deliveryTime: string;
  deliveryFee: number;
  deliveryDate?: string;
  expressAvailable?: boolean;
  inStock: boolean;
  stockCount: number;
  features?: string[];
  badges?: string[];
  isCustomizable?: boolean;
  minQuantity?: number;
  category: string;
  tags?: string[];
  returnPolicy?: string;
  warranty?: string;
  isWishlisted?: boolean;
  priceHistory?: {
    period: string;
    trend: "up" | "down" | "stable";
    percentage: number;
  };
  marketPrices?: Array<{
    vendor: string;
    price: number;
    availability: "available" | "out_of_stock" | "limited";
  }>;
  trustBadges?: Array<{
    type: "security" | "quality" | "delivery" | "support" | "social" | "certification";
    text: string;
    verified?: boolean;
    rating?: number;
    count?: number;
  }>;
}

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onQuickView?: (product: Product, e: React.MouseEvent) => void;
  variant?: "grid" | "list";
  showComparison?: boolean;
  className?: string;
}

export const ProductCard = ({ 
  product, 
  onProductClick, 
  onQuickView,
  variant = "grid",
  showComparison = false,
  className 
}: ProductCardProps) => {
  const [isWishlisted, setIsWishlisted] = useState(product.isWishlisted || false);
  const [imageIndex, setImageIndex] = useState(0);
  const { addItem, isLoading } = useCart();

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: product.name,
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!product.inStock) return;
    
    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.minQuantity || 1,
        vendorId: product.vendor.id,
        image: product.image,
        customization: undefined
      });

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageHover = (index: number) => {
    if (product.images && product.images.length > 1) {
      setImageIndex(index);
    }
  };

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount;

  return (
    <Card 
      className={cn(
        "group cursor-pointer border transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        !product.inStock && "opacity-60",
        variant === "list" && "flex-row",
        className
      )}
      onClick={() => onProductClick(product)}
    >
      <CardContent className={cn("p-0", variant === "list" && "flex")}>
        {/* Image Container */}
        <div className={cn(
          "relative overflow-hidden bg-muted",
          variant === "grid" ? "aspect-square rounded-t-lg" : "w-24 h-24 rounded-l-lg flex-shrink-0"
        )}>
          <img
            src={product.images?.[imageIndex] || product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            width={400}
            height={400}
          />
          
          {/* Image Navigation Dots - Amazon Style */}
          {product.images && product.images.length > 1 && variant === "grid" && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    index === imageIndex ? "bg-white" : "bg-white/50"
                  )}
                  onMouseEnter={() => handleImageHover(index)}
                />
              ))}
            </div>
          )}
          
          {/* Discount Badge - Top Left */}
          {discountPercentage && discountPercentage > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 left-2 text-xs px-2 py-1 bg-red-500 text-white font-medium"
            >
              {discountPercentage}% OFF
            </Badge>
          )}
          
          {/* Product Badges - Top Center */}
          {product.badges && product.badges.length > 0 && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
              <Badge 
                variant="secondary" 
                className="text-xs bg-black/70 text-white border-0"
              >
                {product.badges[0]}
              </Badge>
            </div>
          )}
          
          {/* Quick Actions - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-white/90 backdrop-blur border shadow-sm"
              onClick={toggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )} 
              />
            </Button>
            
            {onQuickView && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 backdrop-blur border shadow-sm"
                onClick={(e) => onQuickView(product, e)}
                aria-label="Quick view"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}

            {showComparison && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-white/90 backdrop-blur border shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toast({ title: "Added to comparison" });
                }}
                aria-label="Add to comparison"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Stock Status - Bottom Right */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className={cn(
          "space-y-2",
          variant === "grid" ? "p-3" : "p-3 flex-1"
        )}>
          {/* Product Name - Fixed Content Overflow */}
          <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[3rem] max-h-[3rem] overflow-hidden">
            {product.name}
          </h3>
          
          {/* Price Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-primary">
                ₹{product.price.toLocaleString()}
                {product.minQuantity && product.minQuantity > 1 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    /{product.minQuantity} pcs
                  </span>
                )}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
            </div>
          </div>

          {/* MOQ Notice - DLS Compliant Colors */}
          {product.minQuantity && product.minQuantity > 1 && (
            <div className="flex items-center gap-1 text-xs text-warning-foreground bg-warning/10 px-2 py-1 rounded">
              <Zap className="h-3 w-3" />
              <span>Min {product.minQuantity} for customization • Singles available</span>
            </div>
          )}
          
          {/* Vendor + Delivery Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>{product.vendor.name}</span>
              <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
              <span>{product.vendor.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>{product.deliveryTime}</span>
              {product.deliveryFee === 0 && <span className="text-green-600">• FREE</span>}
            </div>
          </div>
          
          {/* Trust Indicators - DLS Compliant Colors */}
          <div className="flex items-center gap-2 text-xs">
            {product.returnPolicy && (
              <div className="flex items-center gap-1 text-success">
                <Shield className="h-3 w-3" />
                <span>Easy Returns</span>
              </div>
            )}
            {product.warranty && (
              <div className="flex items-center gap-1 text-info">
                <Shield className="h-3 w-3" />
                <span>{product.warranty}</span>
              </div>
            )}
          </div>

          {/* Features - Key selling points */}
          {product.features && product.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.features.slice(0, 2).map((feature, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs h-5 px-2 bg-muted/50"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isLoading || !product.inStock}
              className="flex-1 h-8 text-xs"
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              {product.minQuantity && product.minQuantity > 1 ? "Add Set" : "Add to Cart"}
            </Button>
            
            {product.isCustomizable && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to customization
                }}
                className="h-8 text-xs px-2"
              >
                Customize
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};