/**
 * Tiered Pricing Display Component
 * Swiggy/Zomato Pattern: Price automatically updates when quantity changes
 * NO tier list shown - just the current price with discount badge
 */

import { useMemo } from 'react';
import { PricingTier, CalculatedPrice } from '@/types/product';
import { calculateTieredPrice, formatPrice, getNextTierInfo } from '@/lib/pricing/tieredPricing';
import { Badge } from '@/components/ui/badge';
import { TrendingDown } from 'lucide-react';

interface TieredPricingDisplayProps {
  quantity: number;
  tiers: PricingTier[];
  className?: string;
  showSavings?: boolean; // Show savings compared to base price
  showNextTierHint?: boolean; // Show "Add X more to save Y%"
}

export function TieredPricingDisplay({
  quantity,
  tiers,
  className = '',
  showSavings = true,
  showNextTierHint = true,
}: TieredPricingDisplayProps) {
  // Calculate current price based on quantity
  const calculation: CalculatedPrice = useMemo(() => {
    return calculateTieredPrice(quantity, tiers);
  }, [quantity, tiers]);
  
  // Get next tier information
  const nextTierInfo = useMemo(() => {
    return getNextTierInfo(quantity, tiers);
  }, [quantity, tiers]);
  
  // Show base price (first tier) for comparison
  const basePrice = useMemo(() => {
    return tiers[0]?.pricePerItem || 0;
  }, [tiers]);
  
  const hasDiscount = calculation.discountPercent > 0;
  const showBasePriceStrikethrough = hasDiscount && showSavings;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Price Display */}
      <div className="flex items-baseline gap-3">
        {/* Current Price (Large & Bold) */}
        <div className="text-3xl md:text-4xl font-bold text-foreground">
          {formatPrice(calculation.pricePerItem)}
        </div>
        
        {/* Base Price (Strikethrough if discount applies) */}
        {showBasePriceStrikethrough && basePrice > calculation.pricePerItem && (
          <div className="text-lg md:text-xl text-muted-foreground line-through">
            {formatPrice(basePrice)}
          </div>
        )}
        
        {/* Discount Badge */}
        {hasDiscount && (
          <Badge variant="destructive" className="text-sm font-semibold px-2 py-1">
            <TrendingDown className="w-3 h-3 mr-1 inline" />
            {calculation.discountPercent}% OFF
          </Badge>
        )}
      </div>
      
      {/* Price per item label */}
      <div className="text-sm text-muted-foreground">
        per item
        {quantity > 1 && (
          <span className="ml-2 font-medium text-foreground">
            • Total: {formatPrice(calculation.subtotal)}
          </span>
        )}
      </div>
      
      {/* Savings Message */}
      {showSavings && calculation.savings > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-green-600 dark:bg-green-500"></span>
          You save {formatPrice(calculation.savings)} on this order!
        </div>
      )}
      
      {/* Next Tier Hint (Swiggy pattern: "Add X more to unlock Y% discount") */}
      {showNextTierHint && nextTierInfo?.hasNextTier && nextTierInfo.message && (
        <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 px-3 py-2 rounded-md">
          <TrendingDown className="w-4 h-4" />
          {nextTierInfo.message}
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant for cart items
 */
export function CompactPricingDisplay({
  quantity,
  tiers,
}: {
  quantity: number;
  tiers: PricingTier[];
}) {
  const calculation = useMemo(() => {
    return calculateTieredPrice(quantity, tiers);
  }, [quantity, tiers]);
  
  const hasDiscount = calculation.discountPercent > 0;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-semibold">
        {formatPrice(calculation.pricePerItem)}
      </span>
      {hasDiscount && (
        <Badge variant="secondary" className="text-xs">
          -{calculation.discountPercent}%
        </Badge>
      )}
    </div>
  );
}

/**
 * Quantity selector with live price update
 * Swiggy/Zomato pattern: As you change quantity, price updates immediately
 */
interface QuantityPriceSelectorProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  tiers: PricingTier[];
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantityPriceSelector({
  quantity,
  onQuantityChange,
  tiers,
  min = 1,
  max = 9999,
  disabled = false,
}: QuantityPriceSelectorProps) {
  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };
  
  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Quantity Label */}
      <label className="text-sm font-medium text-foreground">
        Quantity
      </label>
      
      {/* Quantity Stepper */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border rounded-md">
          <button
            onClick={handleDecrement}
            disabled={disabled || quantity <= min}
            className="px-4 py-2 text-lg font-semibold hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            disabled={disabled}
            min={min}
            max={max}
            className="w-16 text-center border-x py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            aria-label="Quantity"
          />
          
          <button
            onClick={handleIncrement}
            disabled={disabled || quantity >= max}
            className="px-4 py-2 text-lg font-semibold hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      
      {/* Live Price Display */}
      <TieredPricingDisplay
        quantity={quantity}
        tiers={tiers}
        showSavings={true}
        showNextTierHint={true}
      />
    </div>
  );
}

