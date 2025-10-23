import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Minus, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  Star,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { CustomerProductDisplay, PricingTier } from '@/types/tiered-pricing';
import { calculateTieredPrice, formatPrice, getQuantityRangeDisplay } from '@/lib/pricing/tieredPricing';
import { getDeliveryFeeMessage, getDeliveryTimeEstimate } from '@/lib/pricing/deliveryFee';

interface TieredProductDisplayProps {
  product: CustomerProductDisplay;
  onAddToCart: (quantity: number, selectedAddOns: string[], customizationData?: any) => void;
  onToggleWishlist: () => void;
  className?: string;
}

export const TieredProductDisplay: React.FC<TieredProductDisplayProps> = ({
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

  const getNextTierInfo = () => {
    const currentTier = product.pricingTiers.find(tier => {
      const [min, max] = tier.quantity.includes('+') 
        ? [parseInt(tier.quantity.replace('+', '')), null]
        : tier.quantity.split('-').map(Number);
      return quantity >= min && (max === null || quantity <= max);
    });

    if (!currentTier) return null;

    const currentIndex = product.pricingTiers.indexOf(currentTier);
    const nextTier = product.pricingTiers[currentIndex + 1];

    if (!nextTier) return null;

    const [nextMin] = nextTier.quantity.includes('+')
      ? [parseInt(nextTier.quantity.replace('+', ''))]
      : nextTier.quantity.split('-').map(Number);

    const quantityNeeded = nextMin - quantity;
    const savingsPerUnit = currentPrice - nextTier.price;
    const totalSavings = savingsPerUnit * nextMin;

    return {
      quantityNeeded,
      totalSavings,
      message: `Add ${quantityNeeded} more items to save ₹${Math.round(totalSavings)}`
    };
  };

  const nextTierInfo = getNextTierInfo();
  const selectedAddOnsTotal = selectedAddOns.reduce((total, addOnId) => {
    const addOn = product.addOns.find(a => a.id === addOnId);
    return total + (addOn ? addOn.price : 0);
  }, 0);

  const totalPrice = (currentPrice * quantity) + selectedAddOnsTotal;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-3">{product.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{product.rating}</span>
                <span>({product.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                <span>{deliveryTime}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWishlistToggle}
              className={isWishlisted ? 'text-red-500 border-red-500' : ''}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Vendor Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {product.vendor.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium">{product.vendor.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{product.vendor.rating}</span>
              <span>•</span>
              <span>{product.vendor.reviewCount} reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Quantity & Pricing</h3>
            <Badge variant="secondary">{product.listingType}</Badge>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Price Display - Swiggy Style */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-bold text-blue-600">
                  ₹{Math.round(currentPrice).toLocaleString()}
                </span>
                {discount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    {discount}% off
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Price for {quantity} item{quantity > 1 ? 's' : ''}
              </p>
              {product.originalPrice && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-500 line-through">
                    ₹{Math.round(product.originalPrice).toLocaleString()}
                  </span>
                  <span className="text-sm text-green-600 font-medium">
                    Save ₹{Math.round((product.originalPrice - currentPrice) * quantity)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Next Tier Savings */}
          {nextTierInfo && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  {nextTierInfo.message}
                </span>
              </div>
            </div>
          )}

          {/* Pricing Tiers - Collapsible */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              <span>View bulk discounts</span>
              <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-3 space-y-2 pl-2 border-l-2 border-gray-200">
              {product.pricingTiers.map((tier, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{tier.quantity} items:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₹{Math.round(tier.price).toLocaleString()}</span>
                    {tier.discountPercent > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {tier.discountPercent}% off
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      </Card>

      {/* What's Included */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">What's Included</h3>
        <div className="space-y-2">
          {product.whatsIncluded.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Add-ons */}
      {product.addOns.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Make It Special</h3>
          <div className="space-y-3">
            {product.addOns.map((addOn) => {
              const isSelected = selectedAddOns.includes(addOn.id);
              const isAvailable = quantity >= addOn.minimumOrderQuantity;
              
              return (
                <div
                  key={addOn.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : isAvailable 
                        ? 'border-gray-200 hover:border-gray-300' 
                        : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
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
                          className="rounded"
                          aria-label={`Select ${addOn.name} add-on`}
                        />
                        <span className="font-medium">{addOn.name}</span>
                        {addOn.requiresProof && (
                          <Badge variant="outline" className="text-xs">
                            Requires upload
                          </Badge>
                        )}
                      </div>
                      {addOn.description && (
                        <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                      )}
                      {!isAvailable && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available for orders of {addOn.minimumOrderQuantity}+ items
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-medium">₹{Math.round(addOn.price).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Delivery Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Delivery & Returns</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Delivery</p>
              <p className="text-sm text-gray-600">{deliveryMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Returns</p>
              <p className="text-sm text-gray-600">
                {product.isCustomizable 
                  ? 'Customized orders cannot be returned once approved'
                  : '7-day return policy for non-customized items'
                }
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Order Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{product.name} × {quantity}</span>
            <span>₹{Math.round(currentPrice * quantity).toLocaleString()}</span>
          </div>
          {selectedAddOnsTotal > 0 && (
            <div className="flex justify-between">
              <span>Add-ons</span>
              <span>₹{Math.round(selectedAddOnsTotal).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery</span>
            <span className={deliveryMessage.includes('FREE') ? 'text-green-600' : ''}>
              {deliveryMessage.includes('FREE') ? 'FREE' : deliveryMessage}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{Math.round(totalPrice).toLocaleString()}</span>
          </div>
        </div>

        <Button 
          className="w-full mt-6" 
          size="lg"
          onClick={handleAddToCart}
        >
          Add to Cart - ₹{Math.round(totalPrice).toLocaleString()}
        </Button>
      </Card>
    </div>
  );
};
