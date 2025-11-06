import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Phase 1 Cleanup: Removed Supabase imports - pure mock mode
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getOrdersByCustomer } from "@/lib/mock-orders";

export const PreviewNotificationBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [previewReadyOrders, setPreviewReadyOrders] = useState<Array<{
    orderId: string;
    orderNumber?: string;
    itemName?: string;
  }>>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkPreviewStatus = async () => {
      try {
        // Phase 1 Cleanup: Always use mock orders - no conditionals
        const mockOrders = getOrdersByCustomer(user.id);
        
        // Find orders with preview_ready items
        const previewReadyItems: Array<{
          orderId: string;
          orderNumber?: string;
          itemName?: string;
        }> = [];
        
        for (const order of mockOrders) {
          // Swiggy 2025: Only show preview notification if item has personalizations
          const readyItem = order.order_items.find((item: any) => 
            item.preview_status === 'preview_ready' &&
            item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
          );
          
          if (readyItem) {
            previewReadyItems.push({
              orderId: order.id,
              orderNumber: order.order_number,
              itemName: readyItem.item_name,
            });
          }
        }
        
        // Remove duplicates
        const uniqueOrders = Array.from(
          new Map(
            previewReadyItems.map(item => [item.orderId, item])
          ).values()
        );
        
        setPreviewReadyOrders(uniqueOrders);
        setIsVisible(uniqueOrders.length > 0);
      } catch (error: any) {
        // Silent error handling - show empty state (Swiggy 2025 pattern)
        console.error('Failed to check preview status:', error);
      }
    };

    checkPreviewStatus();

    // Phase 5: Optimized polling - Swiggy 2025 pattern (20s for better UX)
    const intervalId = setInterval(() => {
      checkPreviewStatus();
    }, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  if (!isVisible || previewReadyOrders.length === 0) return null;

  const handleReviewClick = () => {
    if (previewReadyOrders.length > 0) {
      // Navigate to track page with hash - preview sheet will auto-open (Swiggy 2025 pattern)
      navigate(`${RouteMap.track(previewReadyOrders[0].orderId)}#preview`);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground shadow-lg",
      "animate-in slide-in-from-top duration-300 ease-out",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
    )}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <ImageIcon className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                Preview Ready {previewReadyOrders.length > 1 && `(${previewReadyOrders.length})`}
              </p>
              <p className="text-xs opacity-90">
                {previewReadyOrders.length === 1 
                  ? `Your design preview for ${previewReadyOrders[0].itemName || 'your order'} is ready`
                  : `${previewReadyOrders.length} design previews are ready for review`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReviewClick}
              className="h-8"
            >
              Review Now
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

