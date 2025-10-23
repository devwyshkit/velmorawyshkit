/**
 * Product Card - Swiggy/Zomato Pattern
 * Mobile-first product card with auto-updating prices
 * Touch-friendly design with proper spacing
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Plus,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CustomerProductDisplay } from '@/types/tiered-pricing';
import { calculateTieredPrice, formatPrice } from '@/lib/pricing/tieredPricing';
import { getDeliveryFeeMessage } from '@/lib/pricing/deliveryFee';

interface ProductCardProps {
  product: CustomerProductDisplay;
  onAddToCart: (quantity: number, selectedAddOns: string[]) => void;
  onToggleWishlist: () => void;
  onViewDetails: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  onViewDetails,
  className
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showPricingTiers, setShowPricingTiers] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(product.isWishlisted || false);

  // Calculate current price based on quantity
  const currentPricing = calculateTieredPrice(quantity, product.pricingTiers.map(tier => ({
    minQty: parseInt(tier.quantity.split('-')[0]),
    maxQty: tier.quantity.includes('+') ? null : parseInt(tier.quantity.split('-')[1]),
    pricePerItem: tier.price * 100,
    discountPercent: tier.discountPercent
  })));

  const currentPrice = currentPricing.pricePerItem / 100;
  const discount = currentPricing.discountPercent;

  // Calculate delivery message
  const orderValue = currentPrice * quantity;
  const deliveryInfo = getDeliveryFeeMessage(orderValue * 100, 5); // Assuming 5km distance

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    onToggleWishlist();
  };

  const handleAddToCart = () => {
    onAddToCart(quantity, []);
  };

  const getNextTierInfo = () => {
    const currentTier = product.pricingTiers.find(tier => {
      const [min, max] = tier.quantity.includes('+') 
        ? [parseInt(tier.quantity.replace('+', '')), null]
        : tier.quantity.split('-').map(Number);
      return quantity >= min && (max === null || quantity <= max);
    });

    if (!currentTier) return null;

    const nextTier = product.pricingTiers.find(tier => {
      const [min] = tier.quantity.includes('+') 
        ? [parseInt(tier.quantity.replace('+', ''))]
        : tier.quantity.split('-').map(Number);
      return min > quantity;
    });

    if (!nextTier) return null;

    const [nextMin] = nextTier.quantity.includes('+') 
      ? [parseInt(nextTier.quantity.replace('+', ''))]
      : nextTier.quantity.split('-').map(Number);

    const itemsNeeded = nextMin - quantity;
    const savingsPerItem = currentPrice - (nextTier.price * (1 - nextTier.discountPercent / 100));
    const totalSavings = savingsPerItem * nextMin;

    return {
      itemsNeeded,
      totalSavings,
      nextTierPrice: nextTier.price * (1 - nextTier.discountPercent / 100)
    };
  };

  const nextTierInfo = getNextTierInfo();

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative">
          <img
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          
          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-10 w-10 bg-white/90 hover:bg-white"
            onClick={handleWishlistToggle}
          >
            <Heart 
              className={`h-5 w-5 ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`} 
            />
          </Button>

          {/* Discount Badge */}
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-green-600 text-white">
              {discount}% OFF
            </Badge>
          )}

          {/* Stock Badge */}
          {!product.isInStock && (
            <Badge variant="destructive" className="absolute bottom-2 left-2">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          {/* Name & Rating */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium ml-1">{product.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Vendor Info */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">by</span>
            <span className="text-sm font-medium">{product.vendor.name}</span>
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          </div>

          {/* Price Display - Swiggy Style */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">₹{formatPrice(currentPrice)}</span>
              {product.originalPrice && product.originalPrice > currentPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ₹{formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Next Tier Upsell - Swiggy Pattern */}
            {nextTierInfo && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Add {nextTierInfo.itemsNeeded} more to save ₹{formatPrice(nextTierInfo.totalSavings)} per item!
                </p>
              </div>
            )}

            {/* Pricing Tiers Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPricingTiers(!showPricingTiers)}
              className="w-full justify-between p-2 h-auto"
            >
              <span className="text-sm text-muted-foreground">
                View bulk discounts
              </span>
              {showPricingTiers ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* Collapsible Pricing Tiers */}
            {showPricingTiers && (
              <div className="space-y-2 pt-2 border-t">
                {product.pricingTiers.map((tier, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {tier.quantity} items
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        ₹{formatPrice(tier.price * (1 - tier.discountPercent / 100))}
                      </span>
                      {tier.discountPercent > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {tier.discountPercent}% off
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>{deliveryInfo.message}</span>
          </div>

          {/* What's Included */}
          {product.whatsIncluded && product.whatsIncluded.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">What's included:</p>
              <div className="flex flex-wrap gap-1">
                {product.whatsIncluded.slice(0, 3).map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
                {product.whatsIncluded.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.whatsIncluded.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-3">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Total:</span>
              <span className="text-lg font-bold">₹{formatPrice(currentPrice * quantity)}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={onViewDetails}
                className="h-12"
              >
                View Details
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={!product.isInStock}
                className="h-12"
              >
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              <span>Fast Delivery</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
