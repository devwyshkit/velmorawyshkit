import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Global E-commerce Standard Price Comparison - Amazon/Flipkart Pattern
// Market price comparison with competitive indicators

interface PriceComparisonProps {
  currentPrice: number;
  originalPrice?: number;
  marketPrices?: {
    vendor: string;
    price: number;
    availability: "available" | "out_of_stock" | "limited";
  }[];
  priceHistory?: {
    period: string;
    trend: "up" | "down" | "stable";
    percentage: number;
  };
  showFullComparison?: boolean;
  className?: string;
}

export const PriceComparison = ({
  currentPrice,
  originalPrice,
  marketPrices = [],
  priceHistory,
  showFullComparison = false,
  className
}: PriceComparisonProps) => {
  const discount = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const savings = originalPrice ? originalPrice - currentPrice : 0;
  
  // Calculate price advantage
  const marketAverage = marketPrices.length > 0 
    ? marketPrices.reduce((sum, p) => sum + p.price, 0) / marketPrices.length 
    : currentPrice;
  
  const priceAdvantage = marketAverage > currentPrice 
    ? Math.round(((marketAverage - currentPrice) / marketAverage) * 100)
    : 0;

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up": return TrendingUp;
      case "down": return TrendingDown;
      default: return Minus;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main Price Display */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xl font-bold text-foreground">₹{currentPrice.toLocaleString()}</span>
        
        {originalPrice && originalPrice > currentPrice && (
          <>
            <span className="text-sm text-muted-foreground line-through">₹{originalPrice.toLocaleString()}</span>
            <Badge variant="destructive" className="text-xs">
              {discount}% OFF
            </Badge>
          </>
        )}
      </div>

      {/* Savings Information */}
      {savings > 0 && (
        <p className="text-sm text-green-600 font-medium">
          You save ₹{savings.toLocaleString()}
        </p>
      )}

      {/* Price Advantage */}
      {priceAdvantage > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {priceAdvantage}% lower than market
          </Badge>
        </div>
      )}

      {/* Price History Trend */}
      {priceHistory && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(() => {
            const TrendIcon = getTrendIcon(priceHistory.trend);
            return (
              <>
                <TrendIcon className={cn(
                  "h-3 w-3",
                  priceHistory.trend === "down" ? "text-green-600" : 
                  priceHistory.trend === "up" ? "text-red-500" : "text-gray-500"
                )} />
                <span>
                  Price {priceHistory.trend === "down" ? "dropped" : priceHistory.trend === "up" ? "increased" : "stable"} by {priceHistory.percentage}% in {priceHistory.period}
                </span>
              </>
            );
          })()}
        </div>
      )}

      {/* Quick Market Comparison */}
      {!showFullComparison && marketPrices.length > 0 && (
        <Button variant="ghost" size="sm" className="h-6 text-xs p-0 text-primary">
          Compare prices across {marketPrices.length} vendors →
        </Button>
      )}

      {/* Full Market Comparison */}
      {showFullComparison && marketPrices.length > 0 && (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
          <h4 className="text-sm font-medium">Price Comparison</h4>
          <div className="space-y-1">
            {marketPrices.slice(0, 3).map((vendor, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{vendor.vendor}</span>
                  <Badge 
                    variant={vendor.availability === "available" ? "outline" : "secondary"}
                    className="text-xs"
                  >
                    {vendor.availability === "available" ? "In Stock" : 
                     vendor.availability === "limited" ? "Limited" : "Out of Stock"}
                  </Badge>
                </div>
                <span className={cn(
                  "font-medium",
                  vendor.price > currentPrice ? "text-red-500" : 
                  vendor.price < currentPrice ? "text-green-600" : "text-foreground"
                )}>
                  ₹{vendor.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};