/**
 * Customer Product Detail Page - Swiggy/Zomato Style
 * Auto-updating pricing, dynamic delivery fees, conditional add-ons
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Star, 
  Truck, 
  Shield, 
  CheckCircle, 
  Plus, 
  Minus,
  ShoppingCart,
  Heart,
  Share2,
  AlertCircle,
  Clock,
  Package,
  Gift
} from 'lucide-react';
import { Product, PricingTier, AddOn } from '@/types/product';
import { calculateTieredPrice, formatPrice, getSavingsMessage } from '@/lib/pricing/tieredPricing';
import { calculateDeliveryFee, formatDeliveryFee, getDeliveryFeeMessage } from '@/lib/pricing/deliveryFee';
import { createDefaultDeliveryFeeConfig } from '@/lib/pricing/deliveryFee';

interface ProductDetailPageProps {
  product: Product;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({});
  const [selectedBulkAddOns, setSelectedBulkAddOns] = useState<Record<string, boolean>>({});
  const [previewRequested, setPreviewRequested] = useState(false);
  const [pricingResult, setPricingResult] = useState<any>(null);
  const [deliveryResult, setDeliveryResult] = useState<any>(null);

  // Calculate pricing when quantity changes
  useEffect(() => {
    try {
      const result = calculateTieredPrice(quantity, product.tieredPricing);
      setPricingResult(result);
    } catch (error) {
      // Handle error silently in production
    }
  }, [quantity, product.tieredPricing]);

  // Calculate delivery fee
  useEffect(() => {
    try {
      const deliveryConfig = createDefaultDeliveryFeeConfig();
      const result = calculateDeliveryFee(pricingResult?.totalPrice || 0, 0, deliveryConfig);
      setDeliveryResult(result);
    } catch (error) {
      // Handle error silently in production
    }
  }, [pricingResult]);

  const handleQuantityChange = (newQuantity: number) => {
    const minQty = Math.min(...product.tieredPricing.map(tier => tier.minQty));
    const maxQty = Math.max(...product.tieredPricing.map(tier => tier.maxQty || Infinity));
    setQuantity(Math.max(minQty, Math.min(maxQty, newQuantity)));
  };

  const handleAddOnToggle = (addOnId: string, isBulk: boolean = false) => {
    if (isBulk) {
      setSelectedBulkAddOns(prev => ({
        ...prev,
        [addOnId]: !prev[addOnId]
      }));
    } else {
      setSelectedAddOns(prev => ({
        ...prev,
        [addOnId]: !prev[addOnId]
      }));
    }
  };

  const getSelectedAddOnsTotal = () => {
    let total = 0;
    
    // Standard add-ons
    Object.entries(selectedAddOns).forEach(([addOnId, isSelected]) => {
      if (isSelected) {
        const addOn = product.addOns.find(a => a.id === addOnId);
        if (addOn) {
          total += (addOn.price / 100) * quantity;
        }
      }
    });

    // Bulk add-ons (only if quantity meets MOQ)
    Object.entries(selectedBulkAddOns).forEach(([addOnId, isSelected]) => {
      if (isSelected) {
        const addOn = product.addOns.find(a => a.id === addOnId);
        if (addOn && addOn.minimumOrder && quantity >= addOn.minimumOrder) {
          total += (addOn.price / 100) * quantity;
        }
      }
    });

    return total;
  };

  const selectedAddOnsTotal = getSelectedAddOnsTotal();
  const grandTotal = (pricingResult?.totalPrice || 0) + selectedAddOnsTotal + (deliveryResult?.fee || 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Product Images & Info */}
        <div className="space-y-6">
          {/* Product Images */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-gray-600">by {product.vendorId}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.8</span>
                </div>
                <span className="text-gray-600">(234 orders)</span>
                <Badge variant="secondary">Verified Seller</Badge>
              </div>
            </div>

            {/* Price Range Display */}
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {formatPrice(product.tieredPricing[0].pricePerItem)}
              </div>
              {product.tieredPricing.length > 1 && (
                <div className="text-lg text-gray-600">
                  {formatPrice(product.tieredPricing[product.tieredPricing.length - 1].pricePerItem)}
                </div>
              )}
              <Badge variant="outline" className="bg-green-100 text-green-800">
                Save up to {Math.max(...product.tieredPricing.map(tier => tier.discountPercent))}% on bulk orders
              </Badge>
            </div>
          </div>

          {/* What's Included */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {product.whatsIncluded.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Configuration */}
        <div className="space-y-6">
          {/* Quantity Selector with Live Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quantity & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-base font-medium">Quantity:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= Math.min(...product.tieredPricing.map(tier => tier.minQty))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-16 text-center text-lg font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= Math.max(...product.tieredPricing.map(tier => tier.maxQty || Infinity))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Live Pricing Display */}
              {pricingResult && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Price per item:</span>
                      <span className="text-lg font-semibold">{formatPrice(pricingResult.pricePerItem * 100)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total for {quantity} items:</span>
                      <span className="text-xl font-bold">{formatPrice(pricingResult.totalPrice * 100)}</span>
                    </div>
                    {pricingResult.savings > 0 && (
                      <div className="text-green-600 font-medium">
                        {getSavingsMessage(pricingResult)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Pricing Tiers */}
              <div className="space-y-2">
                <h4 className="font-medium">💰 Price for your order:</h4>
                {product.tieredPricing.map((tier, index) => (
                  <div 
                    key={index}
                    className={`flex justify-between items-center p-2 rounded ${
                      pricingResult?.appliedTier.minQty === tier.minQty ? 'bg-blue-100' : 'bg-gray-50'
                    }`}
                  >
                    <span>
                      {tier.minQty}
                      {tier.maxQty ? `-${tier.maxQty}` : '+'} items: {formatPrice(tier.pricePerItem)}
                      {tier.discountPercent > 0 && ` (${tier.discountPercent}% off)`}
                    </span>
                    {pricingResult?.appliedTier.minQty === tier.minQty && (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📦 Delivery & Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Delivery Time:</h4>
                {product.deliveryTimeTiers.map((tier, index) => {
                  const isApplicable = quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty);
                  return (
                    <div key={index} className={`p-2 rounded ${isApplicable ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span>
                          {tier.minQty}
                          {tier.maxQty ? `-${tier.maxQty}` : '+'} items: {tier.deliveryDays}
                        </span>
                        {isApplicable && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Add-ons Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 Make It Special</CardTitle>
              <CardDescription>Add optional extras to customize your order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Standard Add-ons */}
              <div className="space-y-4">
                <h4 className="font-medium">Standard Add-ons</h4>
                <p className="text-sm text-gray-600">Available for all orders</p>
                
                {product.addOns.filter(addOn => addOn.type === 'standard').map(addOn => (
                  <div key={addOn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={addOn.id}
                        checked={selectedAddOns[addOn.id] || false}
                        onCheckedChange={() => handleAddOnToggle(addOn.id, false)}
                      />
                      <div>
                        <Label htmlFor={addOn.id} className="font-medium cursor-pointer">
                          {addOn.name}
                        </Label>
                        {addOn.description && (
                          <p className="text-sm text-gray-600">{addOn.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatPrice(addOn.price)} per item
                      </div>
                      {selectedAddOns[addOn.id] && (
                        <div className="text-sm text-gray-600">
                          Total: {formatPrice(addOn.price * quantity)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Bulk Add-ons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Corporate Customization</h4>
                  {quantity >= (product.addOns.find(a => a.type === 'bulk')?.minimumOrder || 50) ? (
                    <Badge className="bg-green-100 text-green-800">✅ Now Available!</Badge>
                  ) : (
                    <Badge variant="secondary">Unlocks at {product.addOns.find(a => a.type === 'bulk')?.minimumOrder || 50} items</Badge>
                  )}
                </div>
                
                {product.addOns.filter(addOn => addOn.type === 'bulk').map(addOn => {
                  const isUnlocked = quantity >= (addOn.minimumOrder || 50);
                  return (
                    <div 
                      key={addOn.id} 
                      className={`p-3 border rounded-lg ${isUnlocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={addOn.id}
                            checked={selectedBulkAddOns[addOn.id] || false}
                            onCheckedChange={() => handleAddOnToggle(addOn.id, true)}
                            disabled={!isUnlocked}
                          />
                          <div>
                            <Label htmlFor={addOn.id} className={`font-medium cursor-pointer ${!isUnlocked ? 'text-gray-500' : ''}`}>
                              {addOn.name}
                            </Label>
                            {addOn.description && (
                              <p className="text-sm text-gray-600">{addOn.description}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Minimum order: {addOn.minimumOrder} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatPrice(addOn.price)} per item
                          </div>
                          {selectedBulkAddOns[addOn.id] && (
                            <div className="text-sm text-gray-600">
                              Total: {formatPrice(addOn.price * quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {addOn.requiresPreview && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`preview-${addOn.id}`}
                              checked={previewRequested}
                              onCheckedChange={setPreviewRequested}
                            />
                            <Label htmlFor={`preview-${addOn.id}`} className="text-sm">
                              Yes, I want to see a preview first
                            </Label>
                          </div>
                          <p className="text-xs text-yellow-800 mt-1">
                            ⚠️ Custom orders cannot be cancelled once approved
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💵 Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items ({quantity}):</span>
                  <span>{formatPrice((pricingResult?.totalPrice || 0) * 100)}</span>
                </div>
                
                {selectedAddOnsTotal > 0 && (
                  <div className="flex justify-between">
                    <span>Add-ons:</span>
                    <span>{formatPrice(selectedAddOnsTotal * 100)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className={deliveryResult?.isFree ? 'text-green-600 font-semibold' : ''}>
                    {deliveryResult?.isFree ? 'FREE ✅' : formatDeliveryFee(deliveryResult?.fee || 0)}
                  </span>
                </div>
                
                {deliveryResult?.amountNeededForFree > 0 && (
                  <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                    {getDeliveryFeeMessage(deliveryResult)}
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatPrice(grandTotal * 100)}</span>
              </div>
              
              {previewRequested && (
                <div className="p-3 bg-yellow-50 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This order includes customization. Once you approve the preview, 
                    the order cannot be cancelled or refunded.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Add to Wishlist
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button className="flex-2">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            <Button size="lg" className="flex-2">
              Buy Now
            </Button>
          </div>

          {/* Return & Refund Policy */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">📋 Return & Refund Policy</h4>
              <div className="text-sm space-y-1">
                <p>• Non-customized items can be returned within 7 days</p>
                <p>• Customized/branded orders cannot be returned</p>
                <p>• Damaged items eligible for full refund/replacement</p>
                <p>• Delivery charges (₹100) deducted from refund</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
