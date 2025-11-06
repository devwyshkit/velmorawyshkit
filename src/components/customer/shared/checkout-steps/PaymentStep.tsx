import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

interface PaymentStepProps {
  onConfirm: (method: string) => void;
  totalAmount: number;
  isProcessing?: boolean;
}

export const PaymentStep = ({ onConfirm, totalAmount, isProcessing = false }: PaymentStepProps) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  
  const handleConfirm = () => {
    onConfirm(selectedMethod);
  };
  
  return (
    <div className="p-4 space-y-6 pb-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Select payment method</h3>
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
              <RadioGroupItem value="card" id="card" />
              <span className="font-medium text-sm">Credit/Debit Cards</span>
            </div>
            <Button variant="ghost" size="sm">+ Add new card</Button>
          </Label>
          
          <Label className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 flex-1">
              <RadioGroupItem value="wallet" id="wallet" />
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
        disabled={isProcessing}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Confirm & Place Order'
        )}
      </Button>
    </div>
  );
};


