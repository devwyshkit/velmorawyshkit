/**
 * Delivery Fee Banner - Swiggy/Zomato Pattern
 * Dynamic delivery fee messaging with threshold alerts
 * Mobile-optimized with proper touch targets
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Truck, 
  CheckCircle, 
  Info, 
  Gift,
  AlertCircle
} from 'lucide-react';
import { getDeliveryFeeMessage, calculateDeliveryFee } from '@/lib/pricing/deliveryFee';
import { createDefaultDeliveryFeeConfig } from '@/lib/pricing/deliveryFee';

interface DeliveryFeeBannerProps {
  orderValue: number; // in rupees
  distance: number; // in km
  className?: string;
  onThresholdReached?: () => void;
}

export const DeliveryFeeBanner: React.FC<DeliveryFeeBannerProps> = ({
  orderValue,
  distance,
  className,
  onThresholdReached
}) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [thresholdInfo, setThresholdInfo] = useState<{
    amountNeeded: number;
    savings: number;
  } | null>(null);
  const [config] = useState(createDefaultDeliveryFeeConfig());

  useEffect(() => {
    // Calculate delivery fee
    const orderValuePaise = orderValue * 100; // Convert to paise
    const feeCalculation = calculateDeliveryFee(orderValuePaise, distance, config);
    
    setDeliveryFee(feeCalculation.totalFee / 100); // Convert back to rupees
    setIsFreeDelivery(feeCalculation.isFreeDelivery);

    // Get delivery message
    const messageInfo = getDeliveryFeeMessage(orderValuePaise, distance);
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
      onThresholdReached?.();
    }
  }, [orderValue, distance, config, onThresholdReached]);

  const getMessageType = () => {
    if (isFreeDelivery) return 'free';
    if (deliveryMessage.includes('Add') && deliveryMessage.includes('more')) return 'threshold';
    return 'fee';
  };

  const messageType = getMessageType();

  return (
    <div className={className}>
      {/* Main Delivery Fee Display */}
      <Card className={`transition-all duration-200 ${
        isFreeDelivery 
          ? 'border-green-200 bg-green-50' 
          : messageType === 'threshold'
          ? 'border-orange-200 bg-orange-50'
          : 'border-muted'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                isFreeDelivery 
                  ? 'bg-green-100' 
                  : messageType === 'threshold'
                  ? 'bg-orange-100'
                  : 'bg-muted'
              }`}>
                <Truck className={`h-5 w-5 ${
                  isFreeDelivery 
                    ? 'text-green-600' 
                    : messageType === 'threshold'
                    ? 'text-orange-600'
                    : 'text-muted-foreground'
                }`} />
              </div>
              <div>
                <p className="font-medium text-sm">Delivery Fee</p>
                <p className="text-xs text-muted-foreground">
                  {deliveryTime}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              {isFreeDelivery ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <Badge className="bg-green-600 text-white">
                    FREE
                  </Badge>
                </div>
              ) : (
                <div className="text-right">
                  <p className="font-bold text-lg">₹{Math.round(deliveryFee).toLocaleString()}</p>
                  {messageType === 'threshold' && (
                    <p className="text-xs text-orange-600">Add ₹{Math.round(thresholdInfo?.amountNeeded || 0)} more for FREE delivery!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Alert - Swiggy Pattern */}
      {thresholdInfo && (
        <Card className="mt-3 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Gift className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-orange-800 mb-1">
                  You're almost there!
                </p>
                <p className="text-sm text-orange-700 mb-3">
                  Add ₹{Math.round(thresholdInfo.amountNeeded)} more to your cart and save ₹{Math.round(thresholdInfo.savings)} on delivery!
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, ((orderValue / (orderValue + thresholdInfo.amountNeeded)) * 100))}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-orange-600 font-medium">
                    {Math.round(((orderValue / (orderValue + thresholdInfo.amountNeeded)) * 100))}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free Delivery Celebration */}
      {isFreeDelivery && (
        <Card className="mt-3 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  🎉 FREE Delivery Unlocked!
                </p>
                <p className="text-sm text-green-700">
                  You saved ₹{Math.round(thresholdInfo?.savings || 0)} on delivery charges
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Information */}
      <Card className="mt-3">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">
                {isFreeDelivery ? 'FREE' : `₹${Math.round(deliveryFee).toLocaleString()}`}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order Value</span>
              <span className="font-medium">₹{orderValue.toLocaleString()}</span>
            </div>

            {!isFreeDelivery && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Free Delivery Threshold</span>
                <span className="font-medium">₹5,000</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Delivery charges may vary based on distance and order value</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryFeeBanner;
