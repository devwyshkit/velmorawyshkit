import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Info, CheckCircle } from 'lucide-react';
import { getDeliveryFeeMessage, getDeliveryTimeEstimate, calculateDeliveryFee } from '@/lib/pricing/deliveryFee';
import { createDefaultDeliveryFeeConfig } from '@/lib/pricing/deliveryFee';

interface DeliveryFeeCalculatorProps {
  orderValue: number; // in rupees
  distance: number; // in km
  quantity: number;
  isCustomizable: boolean;
  className?: string;
}

export const DeliveryFeeCalculator: React.FC<DeliveryFeeCalculatorProps> = ({
  orderValue,
  distance,
  quantity,
  isCustomizable,
  className
}) => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
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

    // Calculate delivery time
    const timeInfo = getDeliveryTimeEstimate(quantity, distance, isCustomizable);
    setDeliveryTime(timeInfo.message);
  }, [orderValue, distance, quantity, isCustomizable, config]);

  const getDeliveryMessageType = () => {
    if (isFreeDelivery) return 'free';
    if (deliveryMessage.includes('Add') && deliveryMessage.includes('more')) return 'threshold';
    return 'fee';
  };

  const messageType = getDeliveryMessageType();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5" />
          Delivery Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Fee */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Delivery Fee</span>
          <div className="flex items-center gap-2">
            {isFreeDelivery ? (
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                FREE
              </Badge>
            ) : (
              <span className="font-semibold">₹{Math.round(deliveryFee).toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Delivery Message - Swiggy Style */}
        <div className={`p-4 rounded-lg text-sm ${
          messageType === 'free' ? 'bg-green-50 text-green-800 border border-green-200' :
          messageType === 'threshold' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
          'bg-gray-50 text-gray-800 border border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            {messageType === 'free' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : messageType === 'threshold' ? (
              <Info className="w-4 h-4 text-blue-600" />
            ) : (
              <Info className="w-4 h-4 text-gray-600" />
            )}
            <span className="font-medium">{deliveryMessage}</span>
          </div>
          {messageType === 'threshold' && (
            <div className="mt-2 text-xs text-blue-700">
              💡 Tip: Add more items to your cart to get FREE delivery!
            </div>
          )}
        </div>

        {/* Delivery Time */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estimated Delivery</span>
          <span className="text-sm text-gray-600">{deliveryTime}</span>
        </div>

        {/* Free Delivery Threshold */}
        {!isFreeDelivery && (
          <div className="text-xs text-gray-500">
            Free delivery on orders above ₹{Math.round(config.freeDeliveryThresholdPaise / 100).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
