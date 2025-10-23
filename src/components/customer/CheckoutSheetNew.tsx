import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Truck, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  loadGooglePlaces,
  initAutocomplete,
  formatAddress,
} from "@/lib/integrations/google-places";
import {
  initiatePayment,
  calculateTotalWithGST,
  formatAmountForRazorpay,
  generateEstimate,
} from "@/lib/integrations/razorpay";
import { getGuestCart } from "@/lib/integrations/supabase-client";
import { DeliveryFeeCalculator } from "./DeliveryFeeCalculator";
import { PaymentRefundPolicy } from "@/components/shared/PaymentRefundPolicy";

interface CheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutSheetNew = ({ isOpen, onClose }: CheckoutSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  const [savedAddress, setSavedAddress] = useState(true);
  const [address, setAddress] = useState("123 MG Road, Bangalore, Karnataka - 560001");
  const [instructions, setInstructions] = useState("");
  const [gstin, setGstin] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [contactlessDelivery, setContactlessDelivery] = useState(false);

  useEffect(() => {
    if (isOpen && !savedAddress && addressInputRef.current) {
      loadGooglePlaces().then(() => {
        if (addressInputRef.current) {
          initAutocomplete(addressInputRef.current, (place) => {
            const formattedAddress = formatAddress(place);
            setAddress(formattedAddress);
          });
        }
      });
    }
  }, [isOpen, savedAddress]);

  // Mock cart data
  const cartItems = getGuestCart();
  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );
  
  // Calculate delivery fee (mock distance calculation)
  const distance = 5; // Mock distance in km
  const totalQuantity = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const hasCustomizableItems = cartItems.some((item: any) => item.customization);
  
  // Calculate delivery fee using the new system
  const deliveryFeePaise = subtotal >= 5000 ? 0 : Math.min(80, Math.max(30, 80 - Math.floor(subtotal / 100) * 5));
  const deliveryFee = deliveryFeePaise;
  
  const totalWithDelivery = subtotal + deliveryFee;
  const total = calculateTotalWithGST(totalWithDelivery);

  const handleDownloadEstimate = () => {
    const estimate = generateEstimate(cartItems, gstin);
    
    const estimateText = `
WYSHKIT - Tax Estimate
${gstin ? `GSTIN: ${gstin}` : ''}
${'-'.repeat(40)}
Items:
${cartItems.map((item: any) => `${item.name} x${item.quantity}: ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n')}
${'-'.repeat(40)}
Subtotal: ₹${estimate.subtotal.toLocaleString('en-IN')}
Delivery Fee: ₹${deliveryFee.toLocaleString('en-IN')}
GST (18%): ₹${estimate.gst.toLocaleString('en-IN')}
${'-'.repeat(40)}
Total: ₹${total.toLocaleString('en-IN')}

HSN Code: 9985
Delivery Address: ${address}
${contactlessDelivery ? 'Contactless Delivery Requested' : ''}
    `;

    const blob = new Blob([estimateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wyshkit-invoice-estimate.txt';
    a.click();

    toast({
      title: "Estimate downloaded",
      description: "Your invoice estimate has been downloaded",
    });
  };

  const handlePayment = async () => {
    if (!address) {
      toast({
        title: "Address required",
        description: "Please provide a delivery address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || '';
      
      // Create order on backend (mock for now)
      const orderId = `order_${Date.now()}`;

      await initiatePayment({
        key: razorpayKey,
        amount: formatAmountForRazorpay(total),
        currency: 'INR',
        name: 'Wyshkit',
        description: 'Gift Purchase',
        order_id: orderId,
        handler: async (response: any) => {
          toast({
            title: "Payment successful!",
            description: "Your order has been placed",
          });

          // Navigate to confirmation
          navigate(`/customer/confirmation?orderId=${orderId}`);
          onClose();
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9876543210',
        },
        theme: {
          color: '#CD1C18',
        },
      });
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <div className="space-y-6 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Checkout</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadEstimate}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Estimate
            </Button>
          </div>

          {/* Delivery Address */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Delivery Address
            </h3>
            
            <div className="flex items-center gap-2 mb-3">
              <Switch
                checked={savedAddress}
                onCheckedChange={setSavedAddress}
              />
              <Label>Use saved address</Label>
            </div>

            {savedAddress ? (
              <div className="p-3 border rounded-lg bg-gray-50">
                <p className="font-medium">Home</p>
                <p className="text-sm text-gray-600">{address}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    ref={addressInputRef}
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter delivery address"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="instructions">Delivery Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Any specific instructions for delivery..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={contactlessDelivery}
                onCheckedChange={setContactlessDelivery}
              />
              <Label>Contactless delivery</Label>
            </div>
          </div>

          {/* GSTIN */}
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (Optional)</Label>
            <Input
              id="gstin"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="Enter GSTIN for business invoice"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi">UPI</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card">Credit/Debit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="netbanking" id="netbanking" />
                <Label htmlFor="netbanking">Net Banking</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Delivery Information */}
          <DeliveryFeeCalculator
            orderValue={subtotal}
            distance={distance}
            quantity={totalQuantity}
            isCustomizable={hasCustomizableItems}
          />

          {/* Payment & Refund Policy */}
          <PaymentRefundPolicy
            orderType={totalQuantity >= 50 ? 'bulk' : 'individual'}
            hasCustomization={hasCustomizableItems}
          />

          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {cartItems.map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{Math.round((totalWithDelivery * 0.18)).toLocaleString()}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Processing..." : `Pay ₹${total.toLocaleString()}`}
          </Button>

          {/* Terms */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>By placing this order, you agree to our terms and conditions.</p>
            <p>100% advance payment required. Customized orders cannot be cancelled once approved.</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
