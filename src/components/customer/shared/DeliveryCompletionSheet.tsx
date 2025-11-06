import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, RotateCcw, FileText, Package, Download, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { cn } from "@/lib/utils";
import { downloadInvoice } from "@/lib/mock-invoice";

interface DeliveryCompletionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  deliveredAt?: Date | string;
  onRateOrder?: () => void;
  onReorder?: () => void;
  onViewDetails?: () => void;
  onReturnRefund?: () => void;
}

/**
 * DeliveryCompletionSheet - Swiggy 2025 Pattern
 * Shows success animation and next actions when order is delivered
 * Auto-opens when order status changes to 'delivered'
 */
export const DeliveryCompletionSheet = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  deliveredAt,
  onRateOrder,
  onReorder,
  onViewDetails,
}: DeliveryCompletionSheetProps) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  // Show confetti animation on open
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleRateOrder = () => {
    onClose();
    if (onRateOrder) {
      onRateOrder();
    }
  };

  const handleReorder = () => {
    onClose();
    if (onReorder) {
      onReorder();
    } else {
      // Navigate to order details or reorder flow
      navigate(RouteMap.track(orderId));
    }
  };

  const handleViewDetails = () => {
    onClose();
    if (onViewDetails) {
      onViewDetails();
    } else {
      navigate(RouteMap.track(orderId));
    }
  };

  const formatDeliveredAt = () => {
    if (!deliveredAt) return 'Just now';
    const date = typeof deliveredAt === 'string' ? new Date(deliveredAt) : deliveredAt;
    if (isNaN(date.getTime())) return 'Just now';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent
        side="bottom"
        className="max-h-[75vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-6xl animate-bounce">🎉</div>
            </div>
          </div>
        )}

        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory">
        <SheetHeader className="text-center px-6 pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle2 className="h-20 w-20 text-green-500 animate-scale-in" />
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            </div>
          </div>
          <SheetTitle className="text-2xl font-bold">Order Delivered Successfully!</SheetTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {orderNumber && `Order ${orderNumber}`}
            {deliveredAt && ` • Delivered on ${formatDeliveredAt()}`}
          </p>
        </SheetHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Success Message */}
          <div className="text-center space-y-2 py-4">
            <Package className="h-12 w-12 mx-auto text-primary/50" />
            <p className="text-base text-muted-foreground">
              Your order has been delivered. We hope you love it!
            </p>
          </div>

          {/* Primary CTA - Rate Order */}
          <Button
            onClick={handleRateOrder}
            className="w-full h-14 text-base font-semibold shadow-lg"
            size="lg"
          >
            <Star className="mr-2 h-5 w-5 fill-current" />
            Rate Your Experience
          </Button>

          {/* Secondary Actions - Swiggy 2025 Pattern */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => {
                downloadInvoice(orderId);
              }}
              variant="outline"
              className="h-12"
            >
              <Download className="mr-2 h-4 w-4" />
              Receipt
            </Button>
            <Button
              onClick={handleReorder}
              variant="outline"
              className="h-12"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reorder
            </Button>
            <Button
              onClick={() => {
                onClose();
                if (onReturnRefund) {
                  onReturnRefund();
                } else {
                  navigate(RouteMap.returnRequest(orderId));
                }
              }}
              variant="outline"
              className="h-12"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Return
            </Button>
          </div>
          
          {/* View Details Button */}
          <Button
            onClick={handleViewDetails}
            variant="ghost"
            className="w-full h-10"
          >
            View Full Order Details
          </Button>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Your feedback helps us improve. Thank you for choosing Wyshkit!
          </p>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

