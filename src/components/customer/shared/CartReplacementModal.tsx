import { AlertCircle } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface CartReplacementModalProps {
  isOpen: boolean;
  currentPartner: string;
  newPartner: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CartReplacementModal = ({
  isOpen,
  currentPartner,
  newPartner,
  onConfirm,
  onCancel,
}: CartReplacementModalProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onCancel}>
      <SheetContent side="bottom" className="h-auto rounded-t-xl sm:max-w-[480px] sm:left-1/2 sm:-translate-x-1/2">
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <h2 className="text-lg font-semibold">Items already in cart</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Your cart contains items from <span className="font-semibold text-foreground">{currentPartner}</span>. 
            Do you want to discard the selection and add items from <span className="font-semibold text-foreground">{newPartner}</span>?
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 pb-6 flex flex-col gap-2">
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
            Start Fresh
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

