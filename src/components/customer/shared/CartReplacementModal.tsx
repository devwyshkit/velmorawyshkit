import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <DialogTitle className="text-lg">Items already in cart</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Your cart contains items from <span className="font-semibold text-foreground">{currentPartner}</span>. 
            Do you want to discard the selection and add items from <span className="font-semibold text-foreground">{newPartner}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Start Fresh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

