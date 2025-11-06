import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PaymentMethodsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentMethodSelect: (method: string) => void;
}

export const PaymentMethodsSheet = ({ isOpen, onClose, totalAmount, onPaymentMethodSelect }: PaymentMethodsSheetProps) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  
  const handleConfirm = () => {
    // Phase 1: Don't close payment sheet here - let CheckoutCoordinator handle transition
    // This prevents premature checkout close before order creation completes
    onPaymentMethodSelect(selectedMethod);
    // Removed: onClose(); - CheckoutCoordinator will close payment sheet after order creation
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden">
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-4">
          <div className="space-y-6 pb-4">
          <div>
            <h2 className="text-lg font-semibold">Select payment method</h2>
            <p className="text-sm text-muted-foreground">Total: ₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
          
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            <div className="space-y-3">
              <Label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <RadioGroupItem value="upi" id="upi" />
                  <div>
                    <span className="font-medium text-sm">UPI</span>
                    <p className="text-xs text-muted-foreground">
                      Google Pay ••••1234
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Change UPI App</Button>
              </Label>
              
              <Label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <RadioGroupItem value="cards" id="cards" />
                  <span className="font-medium text-sm">Credit/Debit Cards</span>
                </div>
                <Button variant="ghost" size="sm">+ Add new card</Button>
              </Label>
              
              <Label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <RadioGroupItem value="wallets" id="wallets" />
                  <div>
                    <span className="font-medium text-sm">Wallets</span>
                    <p className="text-xs text-muted-foreground">
                      Paytm • PhonePe • Amazon Pay
                    </p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <Button 
            className="w-full"
            onClick={handleConfirm}
          >
            Confirm & Continue
          </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

