import { AlertCircle, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CartReplacementModalProps {
  isOpen: boolean;
  currentPartner: string;
  newPartner: string;
  currentCartCount?: number;
  currentCartTotal?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CartReplacementModal = ({
  isOpen,
  currentPartner,
  newPartner,
  currentCartCount = 0,
  currentCartTotal = 0,
  onConfirm,
  onCancel,
}: CartReplacementModalProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onCancel} modal={false}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[480px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden">
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-4">
          {/* Header */}
          <div className="pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <h2 className="text-lg font-semibold">Replace Cart?</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Your cart has items from <span className="font-semibold text-foreground">{currentPartner}</span>. 
              Adding items from <span className="font-semibold text-foreground">{newPartner}</span> will replace your current cart.
            </p>
          </div>

          {/* Cart Summary Card - Swiggy 2025 Pattern */}
          {(currentCartCount > 0 || currentCartTotal > 0) && (
            <Card className="mb-4 border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShoppingCart className="h-5 w-5 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Current Cart ({currentCartCount} {currentCartCount === 1 ? 'item' : 'items'})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">₹{currentCartTotal.toLocaleString('en-IN')}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      This will be removed if you proceed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning Message */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              You can only order from one store at a time. Your current cart will be cleared to add items from <span className="font-semibold text-foreground">{newPartner}</span>.
            </p>
          </div>
        </div>

        {/* Actions - Sticky footer (Swiggy 2025 pattern) */}
        <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4 flex flex-col gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full"
          >
            Replace Cart
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

