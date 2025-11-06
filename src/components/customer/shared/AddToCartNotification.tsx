import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface AddToCartNotificationProps {
  productName: string;
  quantity: number;
  isVisible: boolean;
  onClose: () => void;
}

export const AddToCartNotification = ({
  productName,
  quantity,
  isVisible,
  onClose,
}: AddToCartNotificationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-dismiss after 3 seconds (Swiggy 2025 pattern)
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => onClose(), 300); // Wait for animation to complete
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-50 px-4 pointer-events-none",
        // Mobile: Above nav + StickyCartBar | Desktop: Above StickyCartBar only
        isMobile ? "bottom-[calc(56px+56px)]" : "bottom-[56px]",
        "transition-all duration-300 ease-in-out",
        isAnimating && isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      )}
    >
      <div className="max-w-md mx-auto bg-background border border-border rounded-lg shadow-lg p-4 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {productName}
            </p>
            <p className="text-xs text-muted-foreground">
              Added to cart ({quantity} {quantity === 1 ? "item" : "items"})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

