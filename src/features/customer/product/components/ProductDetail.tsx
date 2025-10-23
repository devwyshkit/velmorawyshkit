/**
 * Product Detail - Swiggy/Zomato Pattern
 * Mobile-first product detail with auto-updating prices
 * Collapsible sections for better mobile UX
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info,
  Package,
  Gift
} from 'lucide-react';
import { CustomerProductDisplay } from '@/types/tiered-pricing';
import { calculateTieredPrice, formatPrice } from '@/lib/pricing/tieredPricing';
import { getDeliveryFeeMessage, getDeliveryTimeEstimate } from '@/lib/pricing/deliveryFee';

interface ProductDetailProps {
  product: CustomerProductDisplay;
  onAddToCart: (quantity: number, selectedAddOns: string[], customizationData?: any) => void;
  onToggleWishlist: () => void;
  className?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  className
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [currentPrice, setCurrentPrice] = useState(product.currentPrice);
  const [discount, setDiscount] = useState(product.discount || 0);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(product.isWishlisted || false);
  const [expandedSections, setExpandedSections] = useState({
    pricing: false,
    includes: false,
    addons: false,
    delivery: false
  });

  // Calculate current price based on quantity
  useEffect(() => {
    const pricing = calculateTieredPrice(quantity, product.pricingTiers.map(tier => ({
      minQty: parseInt(tier.quantity.split('-')[0]),
      maxQty: tier.quantity.includes('+') ? null : parseInt(tier.quantity.split('-')[1]),
      pricePerItem: tier.price * 100, // Convert to paise
      discountPercent: tier.discountPercent
    })));

    setCurrentPrice(pricing.pricePerItem / 100); // Convert back to rupees
    setDiscount(pricing.discountPercent);
  }, [quantity, product.pricingTiers]);

  // Calculate delivery message
  useEffect(() => {
    const orderValue = currentPrice * quantity;
    const deliveryInfo = getDeliveryFeeMessage(orderValue * 100, 5); // Assuming 5km distance
    setDeliveryMessage(deliveryInfo.message);
  }, [currentPrice, quantity]);

  // Calculate delivery time
  useEffect(() => {
    const deliveryInfo = getDeliveryTimeEstimate(
      quantity,
      5, // Assuming 5km distance
      product.isCustomizable
    );
    setDeliveryTime(deliveryInfo.message);
  }, [quantity, product.isCustomizable]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handleAddToCart = () => {
    onAddToCart(quantity, selectedAddOns);
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    onToggleWishlist();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  // Calculate total add-on price
  const totalAddOnPrice = selectedAddOns.reduce((total, addOnId) => {
    const addOn = product.addOns.find(a => a.id === addOnId);
    return total + (addOn ? addOn.price : 0);
  }, 0);

  const finalTotal = (currentPrice * quantity) + totalAddOnPrice;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Product Images */}
      <div className="space-y-2">
        <div className="relative">
          <img
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-64 sm:h-80 object-cover rounded-lg"
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
        </div>

        {/* Additional Images */}
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.slice(1, 5).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} ${index + 2}`}
                className="w-16 h-16 object-cover rounded border flex-shrink-0"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium ml-1">{product.rating}</span>
            </div>
            <span className="text-muted-foreground">
              ({product.reviewCount} reviews)
            </span>
            <Badge variant="secondary">Verified</Badge>
          </div>
        </div>

        {/* Vendor Info */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">by</span>
          <span className="font-medium">{product.vendor.name}</span>
        </div>

        {/* Price Display - Swiggy Style */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">₹{formatPrice(currentPrice)}</span>
            {product.originalPrice && product.originalPrice > currentPrice && (
              <span className="text-xl text-muted-foreground line-through">
                ₹{formatPrice(product.originalPrice)}
              </span>
            )}
            {discount > 0 && (
              <Badge className="bg-green-600 text-white">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Next Tier Upsell - Swiggy Pattern */}
          {nextTierInfo && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Bulk Discount Available!</span>
              </div>
              <p className="text-sm text-green-700">
                Add {nextTierInfo.itemsNeeded} more items to save ₹{formatPrice(nextTierInfo.totalSavings)} per item!
              </p>
            </div>
          )}

          {/* Pricing Tiers Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('pricing')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Bulk Pricing</CardTitle>
                {expandedSections.pricing ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.pricing && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {product.pricingTiers.map((tier, index) => {
                    const isCurrentTier = tier.quantity.includes('+') 
                      ? quantity >= parseInt(tier.quantity.replace('+', ''))
                      : quantity >= parseInt(tier.quantity.split('-')[0]) && 
                        quantity <= parseInt(tier.quantity.split('-')[1]);

                    return (
                      <div 
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          isCurrentTier ? 'bg-primary/10 border border-primary' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tier.quantity} items</span>
                          {isCurrentTier && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            ₹{formatPrice(tier.price * (1 - tier.discountPercent / 100))}
                          </span>
                          {tier.discountPercent > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {tier.discountPercent}% off
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* What's Included Section */}
        {product.whatsIncluded && product.whatsIncluded.length > 0 && (
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('includes')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  What's Included
                </CardTitle>
                {expandedSections.includes ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.includes && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {product.whatsIncluded.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Add-ons Section */}
        {product.addOns && product.addOns.length > 0 && (
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('addons')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Make It Special</CardTitle>
                {expandedSections.addons ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.addons && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {product.addOns.map((addOn) => {
                    const isSelected = selectedAddOns.includes(addOn.id);
                    const isAvailable = quantity >= addOn.minimumOrderQuantity;

                    return (
                      <div 
                        key={addOn.id}
                        className={`p-3 rounded-lg border ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-muted'
                        } ${!isAvailable ? 'opacity-50' : 'cursor-pointer'}`}
                        onClick={() => isAvailable && handleAddOnToggle(addOn.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => isAvailable && handleAddOnToggle(addOn.id)}
                                disabled={!isAvailable}
                                className="h-4 w-4"
                                aria-label={`Select ${addOn.name} add-on`}
                              />
                              <span className="font-medium">{addOn.name}</span>
                              {addOn.requiresProof && (
                                <Badge variant="outline" className="text-xs">
                                  Upload Required
                                </Badge>
                              )}
                            </div>
                            {addOn.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {addOn.description}
                              </p>
                            )}
                            {!isAvailable && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Available for {addOn.minimumOrderQuantity}+ items
                              </p>
                            )}
                          </div>
                          <span className="font-bold">+₹{formatPrice(addOn.price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Delivery Information */}
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('delivery')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Information
              </CardTitle>
              {expandedSections.delivery ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          {expandedSections.delivery && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Delivery Fee</span>
                  <span className="font-medium">{deliveryMessage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Delivery Time</span>
                  <span className="font-medium">{deliveryTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure packaging and fast delivery</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Quantity Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span>Items ({quantity} × ₹{formatPrice(currentPrice)})</span>
                <span>₹{formatPrice(currentPrice * quantity)}</span>
              </div>
              {totalAddOnPrice > 0 && (
                <div className="flex justify-between">
                  <span>Add-ons</span>
                  <span>₹{formatPrice(totalAddOnPrice)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Add to Cart Button - Fixed Bottom on Mobile */}
            <Button
              onClick={handleAddToCart}
              disabled={!product.isInStock}
              className="w-full h-12 text-lg font-semibold mt-4"
            >
              {!product.isInStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
