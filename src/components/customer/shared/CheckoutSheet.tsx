import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, ChevronRight, CheckCircle, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { getCartItems } from "@/lib/mock-cart";
import { createOrder } from "@/lib/mock-orders";
import { AddressStep } from "./checkout-steps/AddressStep";
import { PaymentStep } from "./checkout-steps/PaymentStep";
import { ConfirmationStep } from "./checkout-steps/ConfirmationStep";
import { logger } from "@/lib/logger";
import { CartItemData } from "@/lib/integrations/supabase-data";

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  house: string;
  area: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

interface CheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'address' | 'payment' | 'confirmation';

export const CheckoutSheet = ({ isOpen, onClose }: CheckoutSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCartCount, clearCart } = useCart();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');

  // Address step data
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [gstin, setGstin] = useState<string>("");

  // Payment step data
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Order result
  const [orderId, setOrderId] = useState<string>("");
  const [needsFileUpload, setNeedsFileUpload] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const calculateEstimatedDelivery = useCallback((items: CartItemData[]) => {
    if (!items || items.length === 0) return "Feb 15, 2025";
    
    const preparationTimes = items
      .map(item => item.preparationTime || item.preparation_time || '')
      .filter(Boolean)
      .map(time => {
        const match = time.match(/(\d+)-?(\d+)?\s*(hour|day|min)/);
        if (!match) return 0;
        const max = parseInt(match[2] || match[1]);
        const unit = match[3];
        if (unit === 'day') return max;
        if (unit === 'hour') return Math.ceil(max / 24);
        return 0;
      });
    
    const maxPrepDays = Math.max(...preparationTimes, 0);
    
    const deliveryTimes = items
      .map(item => item.deliveryTime || item.delivery_time || '')
      .filter(Boolean)
      .map(time => {
        const match = time.match(/(\d+)-?(\d+)?\s*(day|hour|min)/);
        if (!match) return 1;
        const max = parseInt(match[2] || match[1]);
        const unit = match[3];
        if (unit === 'day') return max;
        if (unit === 'hour') return Math.ceil(max / 24);
        return 1;
      });
    
    const maxDeliveryDays = Math.max(...deliveryTimes, 1);
    const totalDays = maxPrepDays + maxDeliveryDays;
    const previewBuffer = items.some((item: CartItemData) => 
      item.personalizations && item.personalizations.length > 0
    ) ? 3 : 0;
    
    const finalDays = totalDays + previewBuffer;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + finalDays);
    
    return deliveryDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Swiggy 2025: Load cart synchronously (localStorage is synchronous)
  const loadCart = useCallback(() => {
    try {
      // No artificial delay - localStorage is synchronous
      const items = getCartItems();
      setCartItems(items);
      const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setCartTotal(total);
      const estimated = calculateEstimatedDelivery(items);
      setEstimatedDelivery(estimated);
    } catch (error) {
      logger.error('Failed to load cart', error instanceof Error ? error : new Error(String(error)));
    }
  }, [calculateEstimatedDelivery]);

  useEffect(() => {
    if (isOpen) {
      loadCart();
      setCurrentStep('address');
      setSelectedAddress(null);
      setGstin("");
      setPaymentMethod("");
      setOrderId("");
      setNeedsFileUpload(false);
    }
  }, [isOpen, loadCart]);

  const handleAddressConfirm = (address: Address, gstinValue?: string) => {
    setSelectedAddress(address);
    setGstin(gstinValue || "");
    setCurrentStep('payment');
  };

  const handlePaymentConfirm = async (method: string) => {
    setPaymentMethod(method);
    await processOrderCreation();
  };

  const processOrderCreation = async () => {
    if (!user || !selectedAddress) {
      toast({
        title: "Missing information",
        description: "Please select an address",
        variant: "destructive",
      });
      return;
    }

    const cartItemsSnapshot = [...cartItems];
    if (cartItemsSnapshot.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOrder(true);
    try {
      const needsFiles = cartItemsSnapshot.some((item: CartItemData) => 
        item.personalizations?.length > 0
      );
      setNeedsFileUpload(needsFiles);

      const order = createOrder({
        customer_id: user.id,
        store_id: cartItemsSnapshot[0]?.store_id,
        items: cartItemsSnapshot.map((item: CartItemData) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity || 1,
          price: item.price,
          personalizations: item.personalizations || [],
        })),
        delivery_address: {
          house: selectedAddress.house,
          area: selectedAddress.area,
          city: selectedAddress.city,
          pincode: selectedAddress.pincode,
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          label: selectedAddress.label,
        },
        payment_method: paymentMethod || 'card',
        gstin: gstin,
        total_amount: cartTotal,
        status: needsFiles ? 'preview_pending' : 'confirmed',
      });

      setOrderId(order.id);
      await clearCart();
      await refreshCartCount();
      setCurrentStep('confirmation');
    } catch (error: unknown) {
      // Swiggy 2025: Structured logging
      logger.error('Order creation failed', error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Order creation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('address');
    } else if (currentStep === 'confirmation') {
      // Don't allow going back from confirmation
    }
  };

  const handleClose = () => {
    if (currentStep === 'confirmation') {
      // Allow closing from confirmation
      setCurrentStep('address');
      setSelectedAddress(null);
      setGstin("");
      setPaymentMethod("");
      setOrderId("");
      setNeedsFileUpload(false);
      onClose();
    } else {
      // Close from address or payment
      setCurrentStep('address');
      setSelectedAddress(null);
      setGstin("");
      setPaymentMethod("");
      onClose();
    }
  };

  const steps: { id: CheckoutStep; label: string }[] = [
    { id: 'address', label: 'Address' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmation', label: 'Confirm' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()} modal={false}>
      <SheetContent 
        side="bottom" 
        className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-2 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Stepper Header - Swiggy 2025 Pattern */}
        <div className="px-4 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            {currentStep !== 'address' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1" />
            <h2 className="text-lg font-semibold flex-1 text-center">
              {currentStep === 'address' && 'Select Address'}
              {currentStep === 'payment' && 'Payment'}
              {currentStep === 'confirmation' && 'Order Confirmed'}
            </h2>
            <div className="flex-1" />
            {currentStep === 'address' && <div className="w-8" />}
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                    ${index < currentStepIndex 
                      ? 'bg-primary text-primary-foreground' 
                      : index === currentStepIndex 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {index < currentStepIndex ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`
                    text-xs font-medium hidden sm:block
                    ${index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    h-0.5 flex-1 mx-2
                    ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory">
          <div className="snap-start min-h-full">
            {currentStep === 'address' && (
              <AddressStep
                onConfirm={handleAddressConfirm}
                cartItems={cartItems}
                cartTotal={cartTotal}
              />
            )}
            
            {currentStep === 'payment' && (
              <PaymentStep
                onConfirm={handlePaymentConfirm}
                totalAmount={cartTotal}
                isProcessing={isCreatingOrder}
              />
            )}
            
            {currentStep === 'confirmation' && (
              <ConfirmationStep
                orderId={orderId}
                estimatedDelivery={estimatedDelivery || calculateEstimatedDelivery(cartItems)}
                needsFileUpload={needsFileUpload}
                onViewOrder={() => {
                  onClose();
                  navigate(RouteMap.track(orderId));
                }}
                onContinueShopping={() => {
                  onClose();
                  navigate(RouteMap.home());
                }}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};


