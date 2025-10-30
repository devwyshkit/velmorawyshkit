import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
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
import { isAuthenticated } from "@/lib/integrations/supabase-client";

interface CheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutSheet = ({ isOpen, onClose }: CheckoutSheetProps) => {
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
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliverySlot, setDeliverySlot] = useState<string>("anytime");

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

  // Mock cart data - using state to handle async
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadCart = async () => {
      const authed = await isAuthenticated();
      if (!authed) {
        onClose();
        navigate(RouteMap.login());
        return;
      }
      // In a full impl, fetch cart from server here
      setCartItems([]);
      setSubtotal(0);
      setTotal(0);
    };
    loadCart();
  }, [isOpen]);

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
GST (18%): ₹${estimate.gst.toLocaleString('en-IN')}
${'-'.repeat(40)}
Total: ₹${estimate.total.toLocaleString('en-IN')}

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

    if (!deliveryDate) {
      toast({
        title: "Delivery date required",
        description: "Please select a delivery date for your gift",
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
          navigate(`${RouteMap.confirmation()}?orderId=${orderId}`);
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
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Drag Handle - Material Design 3 */}
        <div className="flex justify-center py-2">
          <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">Checkout</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Delivery Address */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Delivery Address</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="saved-address" className="text-sm text-muted-foreground">
                  Use saved
                </Label>
                <Switch
                  id="saved-address"
                  checked={savedAddress}
                  onCheckedChange={setSavedAddress}
                />
              </div>
            </div>
            
            {savedAddress ? (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{address}</p>
              </div>
            ) : (
              <Input
                ref={addressInputRef}
                placeholder="Enter delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            )}
          </div>

          {/* Scheduled Delivery - MANDATORY for gifting */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Delivery Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                />
              </PopoverContent>
            </Popover>
            
            {/* Optional Time Slots */}
            {deliveryDate && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Delivery Time (Optional)</Label>
                <RadioGroup value={deliverySlot} onValueChange={setDeliverySlot}>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <Label htmlFor="morning" className="text-sm">Morning (9-12)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="afternoon" id="afternoon" />
                      <Label htmlFor="afternoon" className="text-sm">Afternoon (12-5)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="evening" id="evening" />
                      <Label htmlFor="evening" className="text-sm">Evening (5-9)</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Contactless Delivery */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="contactless" className="text-sm font-medium">
                Contactless Delivery
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Leave at doorstep
              </p>
            </div>
            <Switch
              id="contactless"
              checked={contactlessDelivery}
              onCheckedChange={setContactlessDelivery}
            />
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-sm">
              Delivery Instructions (Optional)
            </Label>
            <Textarea
              id="instructions"
              placeholder="e.g., Ring the bell twice, Call before delivery..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <Separator />

          {/* GSTIN for Business */}
          <div className="space-y-2">
            <Label htmlFor="gstin-checkout" className="text-sm">
              GSTIN (Optional - for business purchases)
            </Label>
            <Input
              id="gstin-checkout"
              placeholder="Enter GSTIN"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />
            {gstin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadEstimate}
                className="w-full"
              >
                Download Invoice Estimate
              </Button>
            )}
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex-1 cursor-pointer">
                  UPI (PhonePe, Google Pay, Paytm)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                <RadioGroupItem value="netbanking" id="netbanking" />
                <Label htmlFor="netbanking" className="flex-1 cursor-pointer">
                  Net Banking
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Footer with Total and Pay Button */}
        <div className="sticky bottom-0 bg-white border-t border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total (incl. GST 18%)
            </span>
            <span className="text-2xl font-bold text-primary">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
          <Button
            onClick={handlePayment}
            className="w-full h-12 text-base"
            size="lg"
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

