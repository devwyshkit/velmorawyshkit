import { Badge } from "@/components/ui/badge";
import { Truck, Clock, MapPin, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Global E-commerce Standard Delivery Estimate - Amazon Pattern
// Detailed delivery information with time estimates

interface DeliveryEstimateProps {
  deliveryTime: string;
  deliveryFee: number;
  deliveryDate?: string;
  expressAvailable?: boolean;
  freeDeliveryThreshold?: number;
  currentCartValue?: number;
  location?: string;
  vendor?: {
    distance: string;
    preparationTime: string;
  };
  className?: string;
}

export const DeliveryEstimate = ({
  deliveryTime,
  deliveryFee,
  deliveryDate,
  expressAvailable = false,
  freeDeliveryThreshold,
  currentCartValue = 0,
  location = "Mumbai",
  vendor,
  className
}: DeliveryEstimateProps) => {
  const freeDeliveryNeeded = freeDeliveryThreshold && currentCartValue < freeDeliveryThreshold 
    ? freeDeliveryThreshold - currentCartValue 
    : 0;

  // Calculate estimated delivery date if not provided
  const getEstimatedDate = () => {
    if (deliveryDate) return deliveryDate;
    
    const now = new Date();
    const timeMatch = deliveryTime.match(/(\d+)\s*(min|hour|day)/);
    
    if (!timeMatch) return "Today";
    
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    
    if (unit === "min" && value < 60) {
      return "Today";
    } else if (unit === "hour" && value < 24) {
      return "Today";
    } else if (unit === "day" && value === 1) {
      return "Tomorrow";
    } else {
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + (unit === "day" ? value : 1));
      return futureDate.toLocaleDateString('en-IN', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Primary Delivery Info */}
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              Delivers by {getEstimatedDate()}
            </span>
            <Badge variant="outline" className="text-xs">
              {deliveryTime}
            </Badge>
          </div>
          
          {/* Location Info */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span>to {location}</span>
          </div>
        </div>
      </div>

      {/* Delivery Fee Information */}
      <div className="space-y-1">
        {deliveryFee === 0 ? (
          <div className="text-sm text-green-600 font-medium">
            ✓ Free delivery
          </div>
        ) : (
          <div className="text-sm">
            <span className="text-muted-foreground">Delivery: </span>
            <span className="font-medium">₹{deliveryFee}</span>
          </div>
        )}

        {/* Free Delivery Threshold */}
        {freeDeliveryNeeded > 0 && (
          <div className="text-xs text-amber-600">
            Add ₹{freeDeliveryNeeded} more for free delivery
          </div>
        )}
      </div>

      {/* Express Delivery Option */}
      {expressAvailable && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
          <Zap className="h-4 w-4 text-blue-600" />
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-800">Express Delivery</div>
            <div className="text-xs text-blue-600">Delivered within 1 hour (+₹99)</div>
          </div>
        </div>
      )}

      {/* Vendor Preparation Details */}
      {vendor && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Prep: {vendor.preparationTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{vendor.distance} away</span>
          </div>
        </div>
      )}
    </div>
  );
};