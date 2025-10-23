import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CustomerProductDisplay } from '@/types/tiered-pricing';
import { calculateTieredPrice, formatPrice } from '@/lib/pricing/tieredPricing';
import { getDeliveryFeeMessage, getDeliveryTimeEstimate } from '@/lib/pricing/deliveryFee';

interface MobileProductDisplayProps {
  product: CustomerProductDisplay;
  onAddToCart: (quantity: number, selectedAddOns: string[], customizationData?: any) => void;
  onToggleWishlist: () => void;
}

export const MobileProductDisplay: React.FC<MobileProductDisplayProps> = ({
  product,
  onAddToCart,
  onToggleWishlist
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

  const selectedAddOnsTotal = selectedAddOns.reduce((total, addOnId) => {
    const addOn = product.addOns.find(a => a.id === addOnId);
    return total + (addOn ? addOn.price : 0);
  }, 0);

  const totalPrice = (currentPrice * quantity) + selectedAddOnsTotal;

  return (
    <div className="space-y-4 pb-32">
      {/* Product Header - Mobile Optimized */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h1 className="text-lg font-bold leading-tight">{product.name}</h1>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWishlistToggle}
              className={`h-8 w-8 p-0 ${isWishlisted ? 'text-red-500 border-red-500' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Rating and Delivery Time */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{product.rating}</span>
            <span>({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            <span>{deliveryTime}</span>
          </div>
        </div>

        {/* Vendor Info - Compact */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-xs">
              {product.vendor.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{product.vendor.name}</p>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{product.vendor.rating}</span>
              <span>•</span>
              <span>{product.vendor.reviewCount} reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Display - Swiggy Style Mobile */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* Current Price - Prominent */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl font-bold text-blue-600">
                ₹{Math.round(currentPrice).toLocaleString()}
              </span>
              {discount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {discount}% off
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Price for {quantity} item{quantity > 1 ? 's' : ''}
            </p>
            {product.originalPrice && (
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-sm text-gray-500 line-through">
                  ₹{Math.round(product.originalPrice).toLocaleString()}
                </span>
                <span className="text-sm text-green-600 font-medium">
                  Save ₹{Math.round((product.originalPrice - currentPrice) * quantity)}
                </span>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Total Price */}
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total for {quantity} item{quantity > 1 ? 's' : ''}:</p>
            <p className="text-xl font-bold text-blue-600">
              ₹{Math.round(totalPrice).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Pricing Tiers - Collapsible Mobile */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection('pricing')}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold text-sm">View bulk discounts</h3>
          {expandedSections.pricing ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {expandedSections.pricing && (
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
        )}
      </Card>

      {/* What's Included - Collapsible */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection('includes')}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold">What's Included</h3>
          {expandedSections.includes ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {expandedSections.includes && (
          <div className="mt-3 space-y-2">
            {product.whatsIncluded.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add-ons - Collapsible */}
      {product.addOns.length > 0 && (
        <Card className="p-4">
          <button
            onClick={() => toggleSection('addons')}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-semibold">Make It Special</h3>
            {expandedSections.addons ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {expandedSections.addons && (
            <div className="mt-3 space-y-2">
              {product.addOns.map((addOn) => {
                const isSelected = selectedAddOns.includes(addOn.id);
                const isAvailable = quantity >= addOn.minimumOrderQuantity;
                
                return (
                  <div
                    key={addOn.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : isAvailable 
                          ? 'border-gray-200' 
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
                          <span className="font-medium text-sm">{addOn.name}</span>
                          {addOn.requiresProof && (
                            <Badge variant="outline" className="text-xs">
                              Upload required
                            </Badge>
                          )}
                        </div>
                        {addOn.description && (
                          <p className="text-xs text-gray-600 mt-1">{addOn.description}</p>
                        )}
                        {!isAvailable && (
                          <p className="text-xs text-gray-500 mt-1">
                            Available for {addOn.minimumOrderQuantity}+ items
                          </p>
                        )}
                      </div>
                      <span className="font-medium text-sm">₹{Math.round(addOn.price).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Delivery Info - Collapsible */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection('delivery')}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold">Delivery & Returns</h3>
          {expandedSections.delivery ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {expandedSections.delivery && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Delivery</p>
                <p className="text-xs text-gray-600">{deliveryMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-green-600" />
              <div>
                <p className="font-medium text-sm">Returns</p>
                <p className="text-xs text-gray-600">
                  {product.isCustomizable 
                    ? 'Customized orders cannot be returned once approved'
                    : '7-day return policy for non-customized items'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Fixed Bottom Cart Button - Mobile Optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50 safe-area-pb">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold">₹{Math.round(totalPrice).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {quantity} item{quantity > 1 ? 's' : ''}
              {selectedAddOnsTotal > 0 && ` + add-ons`}
            </p>
            <p className="text-xs text-gray-500">{deliveryTime}</p>
          </div>
        </div>
        <Button 
          className="w-full h-12 text-base font-semibold" 
          size="lg"
          onClick={handleAddToCart}
        >
          Add to Cart - ₹{Math.round(totalPrice).toLocaleString()}
        </Button>
      </div>
    </div>
  );
};
