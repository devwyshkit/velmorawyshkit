/**
 * Cart with Delivery Fees - Swiggy/Zomato Pattern
 * Mobile-first cart with fixed bottom CTA
 * Auto-updating delivery fees and totals
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Truck, 
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Heart
} from 'lucide-react';
import { CustomerProductDisplay } from '@/types/tiered-pricing';
import { calculateTieredPrice, formatPrice } from '@/lib/pricing/tieredPricing';
import { getDeliveryFeeMessage, calculateDeliveryFee } from '@/lib/pricing/deliveryFee';
import { createDefaultDeliveryFeeConfig } from '@/lib/pricing/deliveryFee';

interface CartItem {
  product: CustomerProductDisplay;
  quantity: number;
  selectedAddOns: string[];
  unitPrice: number;
  addOnPrice: number;
  totalPrice: number;
}

interface CartWithDeliveryFeesProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  onToggleWishlist: (productId: string) => void;
  className?: string;
}

export const CartWithDeliveryFees: React.FC<CartWithDeliveryFeesProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onToggleWishlist,
  className
}) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [thresholdInfo, setThresholdInfo] = useState<{
    amountNeeded: number;
    savings: number;
  } | null>(null);
  const [config] = useState(createDefaultDeliveryFeeConfig());

  // Calculate totals
  const subtotal = items.reduce((total, item) => total + item.totalPrice, 0);
  const totalAddOnPrice = items.reduce((total, item) => total + item.addOnPrice, 0);
  const orderValue = subtotal + totalAddOnPrice;

  useEffect(() => {
    // Calculate delivery fee
    const orderValuePaise = orderValue * 100; // Convert to paise
    const feeCalculation = calculateDeliveryFee(orderValuePaise, 5, config); // Assuming 5km distance
    
    setDeliveryFee(feeCalculation.totalFee / 100); // Convert back to rupees
    setIsFreeDelivery(feeCalculation.isFreeDelivery);

    // Get delivery message
    const messageInfo = getDeliveryFeeMessage(orderValuePaise, 5);
    setDeliveryMessage(messageInfo.message);

    // Calculate threshold information
    if (!feeCalculation.isFreeDelivery) {
      const freeDeliveryThreshold = config.freeDeliveryThresholdPaise / 100;
      const amountNeeded = freeDeliveryThreshold - orderValue;
      
      if (amountNeeded > 0) {
        setThresholdInfo({
          amountNeeded,
          savings: feeCalculation.totalFee / 100
        });
      } else {
        setThresholdInfo(null);
      }
    } else {
      setThresholdInfo(null);
    }
  }, [orderValue, config]);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(productId, newQuantity);
    } else {
      onRemoveItem(productId);
    }
  };

  const finalTotal = orderValue + (isFreeDelivery ? 0 : deliveryFee);

  if (items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
        <p className="text-muted-foreground mb-6">
          Add some products to get started
        </p>
        <Button onClick={() => window.history.back()}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cart Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.product.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex gap-3 p-4">
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={item.product.images[0] || '/placeholder.svg'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded"
                    loading="lazy"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-1 -right-1 h-6 w-6 bg-white shadow-sm"
                    onClick={() => onToggleWishlist(item.product.id)}
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    by {item.product.vendor.name}
                  </p>
                  
                  {/* Selected Add-ons */}
                  {item.selectedAddOns.length > 0 && (
                    <div className="mt-2">
                      {item.selectedAddOns.map((addOnId) => {
                        const addOn = item.product.addOns.find(a => a.id === addOnId);
                        return addOn ? (
                          <Badge key={addOnId} variant="outline" className="text-xs mr-1">
                            {addOn.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">₹{formatPrice(item.totalPrice)}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{formatPrice(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onRemoveItem(item.product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delivery Fee Banner */}
      {thresholdInfo && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">
                  Add ₹{Math.round(thresholdInfo.amountNeeded)} more for FREE delivery!
                </p>
                <p className="text-sm text-orange-700">
                  You'll save ₹{Math.round(thresholdInfo.savings)} on delivery charges
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free Delivery Celebration */}
      {isFreeDelivery && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  🎉 FREE Delivery Unlocked!
                </p>
                <p className="text-sm text-green-700">
                  You saved ₹{Math.round(thresholdInfo?.savings || 0)} on delivery
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Items ({items.length})</span>
            <span>₹{formatPrice(subtotal)}</span>
          </div>
          
          {totalAddOnPrice > 0 && (
            <div className="flex justify-between">
              <span>Add-ons</span>
              <span>₹{formatPrice(totalAddOnPrice)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{formatPrice(orderValue)}</span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>Delivery</span>
            </div>
            <div className="text-right">
              {isFreeDelivery ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
              ) : (
                <span>₹{formatPrice(deliveryFee)}</span>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>₹{formatPrice(finalTotal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Bottom CTA - Mobile Pattern */}
      <div className="sticky bottom-0 bg-background border-t p-4 -mx-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">₹{formatPrice(finalTotal)}</p>
          </div>
          <div className="text-right">
            {isFreeDelivery ? (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                FREE Delivery
              </Badge>
            ) : (
              <p className="text-sm text-muted-foreground">
                + ₹{formatPrice(deliveryFee)} delivery
              </p>
            )}
          </div>
        </div>
        
        <Button 
          onClick={onProceedToCheckout}
          className="w-full h-12 text-lg font-semibold"
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default CartWithDeliveryFees;
