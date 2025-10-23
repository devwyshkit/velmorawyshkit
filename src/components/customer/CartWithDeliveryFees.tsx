/**
 * Cart Component with Dynamic Delivery Fees - Swiggy/Zomato Style
 * Auto-updating delivery fees with FREE delivery messaging
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Truck, 
  AlertCircle,
  CheckCircle,
  Package,
  Gift
} from 'lucide-react';
import { Product, PricingTier, AddOn } from '@/types/product';
import { calculateTieredPrice, formatPrice } from '@/lib/pricing/tieredPricing';
import { calculateDeliveryFee, formatDeliveryFee, getDeliveryFeeMessage } from '@/lib/pricing/deliveryFee';
import { createDefaultDeliveryFeeConfig } from '@/lib/pricing/deliveryFee';

interface CartItem {
  product: Product;
  quantity: number;
  selectedAddOns: Record<string, boolean>;
  selectedBulkAddOns: Record<string, boolean>;
}

interface CartWithDeliveryFeesProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onToggleAddOn: (productId: string, addOnId: string, isBulk: boolean) => void;
}

export const CartWithDeliveryFees: React.FC<CartWithDeliveryFeesProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onToggleAddOn
}) => {
  const [deliveryResult, setDeliveryResult] = useState<any>(null);
  const [cartSubtotal, setCartSubtotal] = useState(0);

  // Calculate cart subtotal
  useEffect(() => {
    let subtotal = 0;
    
    items.forEach(item => {
      try {
        const pricingResult = calculateTieredPrice(item.quantity, item.product.tieredPricing);
        subtotal += pricingResult.totalPrice;
        
        // Add standard add-ons
        Object.entries(item.selectedAddOns).forEach(([addOnId, isSelected]) => {
          if (isSelected) {
            const addOn = item.product.addOns.find(a => a.id === addOnId);
            if (addOn) {
              subtotal += (addOn.price / 100) * item.quantity;
            }
          }
        });
        
        // Add bulk add-ons
        Object.entries(item.selectedBulkAddOns).forEach(([addOnId, isSelected]) => {
          if (isSelected) {
            const addOn = item.product.addOns.find(a => a.id === addOnId);
            if (addOn && addOn.minimumOrder && item.quantity >= addOn.minimumOrder) {
              subtotal += (addOn.price / 100) * item.quantity;
            }
          }
        });
      } catch (error) {
        console.error('Error calculating pricing for item:', item.product.name, error);
      }
    });
    
    setCartSubtotal(subtotal);
  }, [items]);

  // Calculate delivery fee
  useEffect(() => {
    try {
      const deliveryConfig = createDefaultDeliveryFeeConfig();
      const result = calculateDeliveryFee(cartSubtotal, 0, deliveryConfig);
      setDeliveryResult(result);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
    }
  }, [cartSubtotal]);

  const getItemTotal = (item: CartItem) => {
    try {
      const pricingResult = calculateTieredPrice(item.quantity, item.product.tieredPricing);
      let total = pricingResult.totalPrice;
      
      // Add add-ons
      Object.entries(item.selectedAddOns).forEach(([addOnId, isSelected]) => {
        if (isSelected) {
          const addOn = item.product.addOns.find(a => a.id === addOnId);
          if (addOn) {
            total += (addOn.price / 100) * item.quantity;
          }
        }
      });
      
      Object.entries(item.selectedBulkAddOns).forEach(([addOnId, isSelected]) => {
        if (isSelected) {
          const addOn = item.product.addOns.find(a => a.id === addOnId);
          if (addOn && addOn.minimumOrder && item.quantity >= addOn.minimumOrder) {
            total += (addOn.price / 100) * item.quantity;
          }
        }
      });
      
      return total;
    } catch (error) {
      console.error('Error calculating item total:', error);
      return 0;
    }
  };

  const grandTotal = cartSubtotal + (deliveryResult?.fee || 0);
  const hasCustomizedItems = items.some(item => 
    Object.values(item.selectedBulkAddOns).some(selected => selected)
  );

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some products to get started</p>
          <Button>Continue Shopping</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
            <Badge variant="outline">{items.length} items</Badge>
          </div>

          {items.map((item) => (
            <Card key={item.product.id} className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  {item.product.images.length > 0 ? (
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">by {item.product.vendorId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.product.listingType}
                        </Badge>
                        {hasCustomizedItems && (
                          <Badge variant="secondary" className="text-xs">
                            <Gift className="w-3 h-3 mr-1" />
                            Customized
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatPrice(getItemTotal(item) * 100)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatPrice(calculateTieredPrice(item.quantity, item.product.tieredPricing).pricePerItem * 100)} per item
                      </div>
                    </div>
                  </div>

                  {/* Selected Add-ons */}
                  {(Object.values(item.selectedAddOns).some(selected => selected) || 
                    Object.values(item.selectedBulkAddOns).some(selected => selected)) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <h4 className="text-sm font-medium mb-2">Selected Add-ons:</h4>
                      <div className="space-y-1">
                        {Object.entries(item.selectedAddOns).map(([addOnId, isSelected]) => {
                          if (!isSelected) return null;
                          const addOn = item.product.addOns.find(a => a.id === addOnId);
                          return addOn ? (
                            <div key={addOnId} className="flex justify-between text-sm">
                              <span>• {addOn.name}</span>
                              <span>{formatPrice(addOn.price * item.quantity)}</span>
                            </div>
                          ) : null;
                        })}
                        {Object.entries(item.selectedBulkAddOns).map(([addOnId, isSelected]) => {
                          if (!isSelected) return null;
                          const addOn = item.product.addOns.find(a => a.id === addOnId);
                          return addOn ? (
                            <div key={addOnId} className="flex justify-between text-sm">
                              <span>• {addOn.name} (Bulk)</span>
                              <span>{formatPrice(addOn.price * item.quantity)}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items Subtotal */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>{formatPrice(cartSubtotal * 100)}</span>
                </div>
              </div>

              <Separator />

              {/* Delivery Fee Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Delivery:</span>
                  <div className="text-right">
                    <div className={`font-semibold ${deliveryResult?.isFree ? 'text-green-600' : ''}`}>
                      {deliveryResult?.isFree ? 'FREE ✅' : formatDeliveryFee(deliveryResult?.fee || 0)}
                    </div>
                    {deliveryResult?.amountNeededForFree > 0 && (
                      <div className="text-xs text-blue-600">
                        Add ₹{Math.ceil(deliveryResult.amountNeededForFree)} more for FREE delivery
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Fee Banner */}
                {deliveryResult && (
                  <div className={`p-3 rounded-lg ${
                    deliveryResult.isFree 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${deliveryResult.isFree ? 'text-green-600' : 'text-blue-600'}`} />
                      <span className={`text-sm font-medium ${
                        deliveryResult.isFree ? 'text-green-800' : 'text-blue-800'
                      }`}>
                        {getDeliveryFeeMessage(deliveryResult)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Grand Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatPrice(grandTotal * 100)}</span>
              </div>

              {/* Payment Warning */}
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    100% payment required before order processing
                  </span>
                </div>
              </div>

              {/* Customization Warning */}
              {hasCustomizedItems && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      This order includes customization. Once approved, it cannot be cancelled.
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  Proceed to Checkout
                </Button>
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span>Fast delivery available</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Easy returns within 7 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
