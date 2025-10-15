import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Store, ShieldCheck, Truck, RotateCcw } from "lucide-react";

// Global E-commerce Standards Header - Phase 15 Implementation
// Addresses missing "Become a Vendor", trust signals, delivery promises

interface GlobalEcommerceHeaderProps {
  showVendorLink?: boolean;
  showTrustBadges?: boolean;
  showDeliveryPromise?: boolean;
  className?: string;
}

export const GlobalEcommerceHeader = ({
  showVendorLink = true,
  showTrustBadges = true,
  showDeliveryPromise = true,
  className = ""
}: GlobalEcommerceHeaderProps) => {
  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-muted/30 border-b ${className}`}>
      {/* Left: Global E-commerce Standards */}
      <div className="flex items-center gap-4">
        {showVendorLink && (
          <Link to="/seller">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary/80 font-medium"
            >
              <Store className="h-4 w-4 mr-2" />
              Become a Vendor
            </Button>
          </Link>
        )}
        
        {showDeliveryPromise && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>Same-day delivery available</span>
          </div>
        )}
      </div>

      {/* Right: Trust Badges */}
      {showTrustBadges && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Secure
          </Badge>
          
          <Badge variant="secondary" className="bg-info/10 text-info border-info/20">
            <RotateCcw className="h-3 w-3 mr-1" />
            Easy Returns
          </Badge>
          
          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
            <Store className="h-3 w-3 mr-1" />
            1000+ Vendors
          </Badge>
        </div>
      )}
    </div>
  );
};

// Utility function to get delivery estimate
export const getDeliveryEstimate = (vendorLocation: string, customerLocation: string) => {
  // Mock logic - in real implementation would use vendor/customer location
  const isSameCity = vendorLocation.toLowerCase().includes(customerLocation.toLowerCase());
  
  if (isSameCity) {
    return {
      time: "35-60 mins",
      type: "hyperlocal",
      fee: 0,
      freeDeliveryThreshold: 500
    };
  }
  
  return {
    time: "1-2 days",
    type: "standard",
    fee: 50,
    freeDeliveryThreshold: 1000
  };
};

// Trust score calculation for vendor badges
export const calculateTrustScore = (vendor: {
  rating: number;
  reviewCount: number;
  completedOrders: number;
  responseTime: number; // in hours
}) => {
  const ratingScore = (vendor.rating / 5) * 40;
  const reviewScore = Math.min(vendor.reviewCount / 100, 1) * 30;
  const orderScore = Math.min(vendor.completedOrders / 1000, 1) * 20;
  const responseScore = Math.max(0, (24 - vendor.responseTime) / 24) * 10;
  
  return Math.round(ratingScore + reviewScore + orderScore + responseScore);
};