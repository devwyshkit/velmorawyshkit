import { useState, useEffect, useCallback } from "react";
import { AddressSelectionSheet } from "@/components/customer/shared/AddressSelectionSheet";
import { PaymentMethodsSheet } from "@/components/customer/shared/PaymentMethodsSheet";
import { OrderConfirmationSheet } from "@/components/customer/shared/OrderConfirmationSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { fetchCartItems } from "@/lib/integrations/supabase-data";
import { initiatePayment, formatAmountForRazorpay } from "@/lib/integrations/razorpay";

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

interface CheckoutCoordinatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutCoordinator = ({ isOpen, onClose }: CheckoutCoordinatorProps) => {
  const { user } = useAuth();
  const { refreshCartCount, clearCart } = useCart();

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  // Step management
  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'confirmation' | null>(null);

  // Address step data
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [gstin, setGstin] = useState<string>("");

  // Payment step data
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Order result
  const [orderId, setOrderId] = useState<string>("");
  const [needsFileUpload, setNeedsFileUpload] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

  const calculateEstimatedDelivery = useCallback((items: any[]) => {
    if (!items || items.length === 0) return "Feb 15, 2025";
    
    // Get max preparation time from items
    const preparationTimes = items
      .map(item => item.preparationTime || item.preparation_time || '')
      .filter(Boolean)
      .map(time => {
        // Parse "2-3 hours", "3-5 days", etc.
        const match = time.match(/(\d+)-?(\d+)?\s*(hour|day|min)/);
        if (!match) return 0;
        const max = parseInt(match[2] || match[1]);
        const unit = match[3];
        if (unit === 'day') return max;
        if (unit === 'hour') return Math.ceil(max / 24);
        return 0; // minutes - less than a day
      });
    
    const maxPrepDays = Math.max(...preparationTimes, 0);
    
    // Get max delivery time
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
        return 1; // default to 1 day
      });
    
    const maxDeliveryDays = Math.max(...deliveryTimes, 1);
    
    // Calculate total days
    const totalDays = maxPrepDays + maxDeliveryDays;
    
    // Add buffer for preview items (add extra days for preview approval)
    const previewBuffer = items.some((item: any) => 
      item.personalizations?.some((p: any) => p.requiresPreview === true)
    ) ? 3 : 0; // Add 3 days for preview process
    
    const finalDays = totalDays + previewBuffer;
    
    // Calculate date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + finalDays);
    
    return deliveryDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const loadCart = useCallback(async () => {
    try {
      const items = await fetchCartItems();
      setCartItems(items);
      const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setCartTotal(total);
      
      // Calculate estimated delivery
      const estimated = calculateEstimatedDelivery(items);
      setEstimatedDelivery(estimated);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, [calculateEstimatedDelivery]);

  // Load cart when opened
  useEffect(() => {
    if (isOpen && !currentStep) {
      loadCart();
      setCurrentStep('address');
    }
  }, [isOpen, currentStep, loadCart]);

  const handleStartCheckout = () => {
    setCurrentStep('address');
  };

  const handleAddressConfirm = (address: Address, gstinValue?: string) => {
    setSelectedAddress(address);
    setGstin(gstinValue || "");
    setCurrentStep('payment');
  };

  const handlePaymentConfirm = async (method: string) => {
    setPaymentMethod(method);
    
    // Create order
    await createOrder();
  };

  const createOrder = async () => {
    if (!user || !selectedAddress) return;

    try {
      // Check if any personalizations require preview (Fiverr 2025 pattern: only engraving/printing, not gift wrap)
      const needsFiles = cartItems.some((item: any) => 
        item.personalizations?.some((p: any) => p.requiresPreview === true)
      );
      setNeedsFileUpload(needsFiles);

      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          store_id: cartItems[0]?.store_id || null,
          delivery_address: {
            house: selectedAddress.house,
            area: selectedAddress.area,
            city: selectedAddress.city,
            pincode: selectedAddress.pincode,
            name: selectedAddress.name,
            phone: selectedAddress.phone,
            label: selectedAddress.label
          },
          payment_method: paymentMethod || 'card',
          gstin: gstin || null,
          is_business_order: !!gstin,
          status: needsFiles ? 'preview_pending' : 'confirmed',
          subtotal: cartTotal,
          total_amount: cartTotal,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      setOrderId(order.id);

      // Create order_items
      const orderItems = cartItems.map((item: any) => ({
        order_id: order.id,
        item_id: item.id,
        item_name: item.name,
        item_image_url: item.image,
        quantity: item.quantity || 1,
        unit_price: item.price,
        total_price: item.price * (item.quantity || 1),
        personalizations: item.personalizations || [], // Use personalizations (matches DB schema)
        preview_status: item.personalizations?.some((p: any) => p.requiresPreview === true) ? 'pending' : null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create Razorpay order via backend API
      const paymentOrderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formatAmountForRazorpay(order.total_amount),
          currency: 'INR',
          receipt: order.id,
          notes: {
            order_id: order.id,
            customer_id: user.id,
            has_custom_items: needsFiles.toString(),
            auto_capture: (!needsFiles).toString(), // Auto-capture for non-custom items
          }
        })
      });

      if (!paymentOrderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const razorpayOrder = await paymentOrderResponse.json();

      // Initiate Razorpay payment
      await initiatePayment({
        key: import.meta.env.VITE_RAZORPAY_KEY || '',
        amount: formatAmountForRazorpay(order.total_amount),
        currency: 'INR',
        name: 'Wyshkit',
        description: `Order ${order.id || 'payment'}`,
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          // Payment successful - verify on backend
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: razorpayOrder.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            });

            if (verifyRes.ok) {
              // Payment verified - clear cart and show confirmation
              clearCart();
              refreshCartCount();
              setCurrentStep('confirmation');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            // Error handled silently (Swiggy 2025 pattern)
            // In production, show inline error in current sheet
          }
        },
        prefill: {
          email: user?.email || '',
          name: user?.full_name || '',
        },
        theme: {
          color: '#CD1C18', // Wyshkit red
        }
      });

      // Note: Cart clearing and confirmation happen in payment handler
      // Only proceed if payment is successful

    } catch (error: any) {
      console.error('Error creating order:', error);
      // No toast - handle error inline or show retry UI (Swiggy 2025 pattern)
      // Error will be visible in console for debugging
      // In production, could show inline error in current sheet
    }
  };

  const handleClose = () => {
    setCurrentStep(null);
    setSelectedAddress(null);
    setGstin("");
    setPaymentMethod("");
    setOrderId("");
    setNeedsFileUpload(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {currentStep === 'address' && (
        <AddressSelectionSheet
          isOpen={true}
          onClose={handleClose}
          onAddressConfirm={handleAddressConfirm}
          cartItems={cartItems}
          cartTotal={cartTotal}
        />
      )}

      {currentStep === 'payment' && (
        <PaymentMethodsSheet
          isOpen={true}
          onClose={handleClose}
          totalAmount={cartTotal}
          onPaymentMethodSelect={handlePaymentConfirm}
        />
      )}

      {currentStep === 'confirmation' && (
        <OrderConfirmationSheet
          isOpen={true}
          onClose={handleClose}
          orderId={orderId}
          estimatedDelivery={estimatedDelivery || calculateEstimatedDelivery(cartItems)}
          needsFileUpload={needsFileUpload}
        />
      )}
    </>
  );
};

