/**
 * Delivery Fee Banner Component
 * Swiggy/Zomato Pattern: "Add ₹200 more for FREE delivery!"
 * Progressive disclosure - encourages users to increase cart value
 */

import { useMemo } from 'react';
import { useDeliveryFee } from '@/hooks/useDeliveryFee';
import { formatPrice } from '@/lib/pricing/tieredPricing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, CheckCircle2, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DeliveryFeeBannerProps {
  cartSubtotal: number; // in paise
  distanceKm?: number;
  freeThreshold?: number; // in paise
  showProgress?: boolean; // Show progress bar to free delivery
  className?: string;
}

export function DeliveryFeeBanner({
  cartSubtotal,
  distanceKm = 0,
  freeThreshold = 500000, // ₹5000 default
  showProgress = true,
  className = '',
}: DeliveryFeeBannerProps) {
  const { deliveryFee, bannerMessage, progressPercentage, isCloseToFreeDelivery } = useDeliveryFee({
    cartSubtotal,
    distanceKm,
    freeThreshold,
  });
  
  // Determine banner variant based on state
  const variant = useMemo(() => {
    if (deliveryFee.isFree) return 'success';
    if (isCloseToFreeDelivery) return 'default';
    return 'default';
  }, [deliveryFee.isFree, isCloseToFreeDelivery]);
  
  // Icon based on state
  const icon = useMemo(() => {
    if (deliveryFee.isFree) return <CheckCircle2 className="h-5 w-5" />;
    if (isCloseToFreeDelivery) return <TrendingUp className="h-5 w-5" />;
    return <Truck className="h-5 w-5" />;
  }, [deliveryFee.isFree, isCloseToFreeDelivery]);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Alert variant={variant === 'success' ? 'default' : 'default'} className={`${deliveryFee.isFree ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : isCloseToFreeDelivery ? 'border-primary bg-primary/5' : ''}`}>
        <div className="flex items-start gap-3">
          <div className={`${deliveryFee.isFree ? 'text-green-600 dark:text-green-500' : isCloseToFreeDelivery ? 'text-primary' : 'text-muted-foreground'}`}>
            {icon}
          </div>
          <div className="flex-1">
            <AlertDescription className="text-sm font-medium">
              {bannerMessage.message}
            </AlertDescription>
            
            {/* Progress bar to free delivery */}
            {showProgress && !deliveryFee.isFree && (
              <div className="mt-3 space-y-1">
                <Progress value={progressPercentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(cartSubtotal)}</span>
                  <span>Free at {formatPrice(freeThreshold)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Compact delivery fee display for cart summary
 */
export function CompactDeliveryFee({
  cartSubtotal,
  freeThreshold = 500000,
}: {
  cartSubtotal: number;
  freeThreshold?: number;
}) {
  const { deliveryFee, formatFee } = useDeliveryFee({
    cartSubtotal,
    freeThreshold,
  });
  
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">Delivery</span>
      </div>
      
      <div className="flex items-center gap-2">
        {deliveryFee.isFree ? (
          <>
            <span className="text-green-600 dark:text-green-500 font-semibold">
              FREE
            </span>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          </>
        ) : (
          <span className="font-semibold">{formatFee()}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Inline delivery fee message (for product detail page)
 */
export function InlineDeliveryMessage({
  cartSubtotal,
  freeThreshold = 500000,
  className = '',
}: {
  cartSubtotal: number;
  freeThreshold?: number;
  className?: string;
}) {
  const { deliveryFee, isCloseToFreeDelivery } = useDeliveryFee({
    cartSubtotal,
    freeThreshold,
  });
  
  if (deliveryFee.isFree) {
    return (
      <div className={`flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-500 ${className}`}>
        <CheckCircle2 className="h-4 w-4" />
        <span>FREE Delivery on this order</span>
      </div>
    );
  }
  
  if (isCloseToFreeDelivery) {
    return (
      <div className={`flex items-center gap-2 text-sm font-medium text-primary ${className}`}>
        <TrendingUp className="h-4 w-4" />
        <span>{deliveryFee.message}</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <Truck className="h-4 w-4" />
      <span>Delivery: {formatPrice(deliveryFee.fee)}</span>
    </div>
  );
}

