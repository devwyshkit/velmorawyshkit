import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { ComplianceFooter } from "@/components/customer/shared/ComplianceFooter";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
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
import { supabase, isAuthenticated } from "@/lib/integrations/supabase-client";

export const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCartCount } = useCart();
  const addressInputRef = useRef<HTMLInputElement>(null);
  
  const [savedAddress, setSavedAddress] = useState(true);
  const [address, setAddress] = useState("123 MG Road, Bangalore, Karnataka - 560001");
  const [instructions, setInstructions] = useState("");
  const [gstin, setGstin] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [contactlessDelivery, setContactlessDelivery] = useState(false);
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState<string>("");
  const [campaignDiscount, setCampaignDiscount] = useState(0); // NEW: Campaign discount amount

  // Delivery time slots (Swiggy/Zomato pattern)
  const timeSlots = [
    { id: "10-12", label: "10:00 AM - 12:00 PM", available: true },
    { id: "12-2", label: "12:00 PM - 2:00 PM", available: true },
    { id: "2-4", label: "2:00 PM - 4:00 PM", available: true },
    { id: "4-6", label: "4:00 PM - 6:00 PM", available: true },
    { id: "6-8", label: "6:00 PM - 8:00 PM", available: true },
  ];

  useEffect(() => {
    if (!savedAddress && addressInputRef.current) {
      loadGooglePlaces().then(() => {
        if (addressInputRef.current) {
          initAutocomplete(addressInputRef.current, (place) => {
            const formattedAddress = formatAddress(place);
            setAddress(formattedAddress);
          });
        }
      });
    }
  }, [savedAddress]);

  // Load cart data
  // Enforce auth: redirect if not authenticated
  useEffect(() => {
    (async () => {
      const authed = await isAuthenticated();
      if (!authed) navigate(RouteMap.login());
    })();
  }, []);
  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );
  
  // Calculate campaign discounts
  useEffect(() => {
    checkAndApplyCampaignDiscounts();
  }, []);

  const checkAndApplyCampaignDiscounts = async () => {
    try {
      const productIds = cartItems.map((item: any) => item.id);
      if (productIds.length === 0) return;

      // Fetch active campaigns for cart products
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (error || !campaigns || campaigns.length === 0) return;

      // Calculate total discount
      let totalDiscount = 0;
      const itemDiscounts: Record<string, number> = {};

      for (const item of cartItems) {
        // Find campaigns that include this product
        const applicableCampaigns = campaigns.filter(c => {
          const products = Array.isArray(c.products) ? c.products : [];
          return products.includes(item.id);
        });

        if (applicableCampaigns.length > 0) {
          // Apply highest discount
          const campaign = applicableCampaigns[0]; // Take first (could sort by value)
          let itemDiscount = 0;

          if (campaign.discount_type === 'percentage') {
            itemDiscount = Math.round((item.price * item.quantity * campaign.discount_value) / 100);
          } else {
            itemDiscount = campaign.discount_value * item.quantity;
          }

          itemDiscounts[item.id] = itemDiscount;
          totalDiscount += itemDiscount;
        }
      }

      if (totalDiscount > 0) {
        setCampaignDiscount(totalDiscount);
        toast({
          title: "🎉 Campaign discount applied!",
          description: `You saved ₹${(totalDiscount / 100).toFixed(0)} on this order`,
        });
      }
    } catch (error) {
      // Handle error silently in production
    }
  };
  
  const total = calculateTotalWithGST(subtotal - campaignDiscount);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to proceed with checkout",
        variant: "destructive",
      });
      navigate(RouteMap.cart());
    }
  }, [cartItems.length, navigate, toast]);

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

    if (!deliveryTimeSlot) {
      toast({
        title: "Time slot required",
        description: "Please select a delivery time slot",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || '';
      
      // Create order in database
      const orderNumber = `ORD-${Date.now()}`;
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: null, // Guest checkout
          status: 'pending',
          items: cartItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal: subtotal,
          campaign_discount: campaignDiscount,
          tax: calculateTotalWithGST(subtotal - campaignDiscount) - (subtotal - campaignDiscount),
          total: total,
          delivery_address: address,
          delivery_instructions: instructions,
          delivery_time_slot: deliveryTimeSlot,
          contactless_delivery: contactlessDelivery,
          gstin: gstin || null,
          payment_method: paymentMethod,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        // Handle error silently in production
        toast({
          title: "Order creation failed",
          description: "Please try again",
          variant: "destructive",
        });
        return;
      }

      const orderId = orderData.id;

      await initiatePayment({
        key: razorpayKey,
        amount: formatAmountForRazorpay(total),
        currency: 'INR',
        name: 'Wyshkit',
        description: 'Gift Purchase',
        order_id: orderNumber,
        handler: async (response: any) => {
          // Update order with payment details
          await supabase
            .from('orders')
            .update({
              payment_status: 'completed',
              payment_id: response.razorpay_payment_id,
              status: 'confirmed',
            })
            .eq('id', orderId);

          // Clear cart after successful payment
          clearGuestCart();
          refreshCartCount();

          toast({
            title: "Payment successful!",
            description: "Your order has been placed",
          });

          // Navigate to confirmation
          navigate(`${RouteMap.confirmation()}?orderId=${orderNumber}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again";
      toast({
        title: "Payment failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader showBackButton title="Checkout" />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
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
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{address}</p>
              </div>
            ) : (
              <Input
                ref={addressInputRef}
                placeholder="Enter delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-sm"
              />
            )}
              </div>

          {/* Contactless Delivery */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
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

          {/* Delivery Time Slot */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Delivery Time Slot <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setDeliveryTimeSlot(slot.id)}
                  disabled={!slot.available}
                  className={`
                    relative p-3 rounded-lg border-2 text-left transition-all
                    ${deliveryTimeSlot === slot.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/50'
                    }
                    ${!slot.available && 'opacity-50 cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{slot.label}</span>
                    {deliveryTimeSlot === slot.id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {!slot.available && (
                    <span className="text-xs text-muted-foreground mt-1 block">Not available</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-sm font-medium">
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
            <Label htmlFor="gstin-checkout" className="text-sm font-medium">
              GSTIN (Optional - for business purchases)
            </Label>
                  <Input
              id="gstin-checkout"
              placeholder="Enter GSTIN"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
              className="text-sm"
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
              <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex-1 cursor-pointer text-sm">
                  UPI (PhonePe, Google Pay, Paytm)
                  </Label>
                </div>
              <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer text-sm">
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="netbanking" id="netbanking" />
                <Label htmlFor="netbanking" className="flex-1 cursor-pointer text-sm">
                  Net Banking
                </Label>
      </div>
            </RadioGroup>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-lg p-4 border border-border space-y-3">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items ({cartItems.length})</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {campaignDiscount > 0 && (
                <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                  <span className="flex items-center gap-1">
                    🎉 Campaign Discount
                  </span>
                  <span className="font-medium">-₹{(campaignDiscount / 100).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>GST (18%)</span>
                <span>₹{(calculateTotalWithGST(subtotal - campaignDiscount) - (subtotal - campaignDiscount)).toLocaleString('en-IN')}</span>
          </div>
          <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Amount</span>
                <span className="text-xl font-bold text-primary">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            className="w-full h-12 text-base sticky bottom-20 md:bottom-4"
            size="lg"
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay ₹${total.toLocaleString('en-IN')}`}
          </Button>
        </div>
      </main>

      <ComplianceFooter />
      <CustomerBottomNav />
    </div>
  );
};

