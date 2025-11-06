import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RouteMap } from "@/routes";
import { X, AlertCircle, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderById, updateOrderStatus } from "@/lib/mock-orders";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * OrderCancellation - Swiggy 2025 Pattern
 * 
 * Multi-step cancellation flow:
 * 1. Reason selection
 * 2. Refund timeline display
 * 3. Confirmation
 */
export const OrderCancellation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'reason' | 'timeline' | 'confirmation'>('reason');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const cancellationReasons = [
    { id: 'change_mind', label: 'Changed my mind', description: 'I don\'t need this order anymore' },
    { id: 'wrong_item', label: 'Wrong item ordered', description: 'I ordered the wrong product' },
    { id: 'duplicate', label: 'Duplicate order', description: 'I placed this order by mistake' },
    { id: 'delivery_time', label: 'Delivery time too long', description: 'Delivery will take too long' },
    { id: 'price', label: 'Found better price', description: 'Found a better deal elsewhere' },
    { id: 'other', label: 'Other reason', description: 'Something else' },
  ];

  useEffect(() => {
    if (id && user) {
      loadOrder();
    }
  }, [id, user]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const orderData = getOrderById(id || '');
      if (orderData && orderData.customer_id === user?.id) {
        setOrder(orderData);
      } else {
        toast({
          title: 'Order not found',
          description: 'We couldn\'t find this order. Please try again.',
          variant: 'destructive',
        });
        navigate(RouteMap.orders());
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load order details.',
        variant: 'destructive',
      });
      navigate(RouteMap.orders());
    } finally {
      setLoading(false);
    }
  };

  const canCancel = () => {
    if (!order) return false;
    // Swiggy 2025: Can cancel if order is confirmed, preview_pending, or in_production
    // Cannot cancel if already delivered, cancelled, or in-transit
    const cancellableStatuses = ['confirmed', 'preview_pending', 'in_production'];
    return cancellableStatuses.includes(order.status);
  };

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
  };

  const handleContinue = () => {
    if (!selectedReason) {
      toast({
        title: 'Please select a reason',
        description: 'We need to know why you\'re cancelling this order.',
        variant: 'destructive',
      });
      return;
    }
    setStep('timeline');
  };

  const handleCancelOrder = async () => {
    if (!order || !selectedReason) return;

    setIsCancelling(true);
    try {
      // Update order status to cancelled
      const success = updateOrderStatus(order.id, 'cancelled', {
        cancellation_reason: selectedReason,
        cancellation_notes: additionalNotes,
        cancelled_at: new Date().toISOString(),
      });

      if (success) {
        setStep('confirmation');
      } else {
        throw new Error('Failed to cancel order');
      }
    } catch (error) {
      toast({
        title: 'Cancellation failed',
        description: 'We couldn\'t cancel your order. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getRefundTimeline = () => {
    // Swiggy 2025: Refund timeline based on payment method
    const paymentMethod = order?.payment_method || 'card';
    
    if (paymentMethod.includes('upi') || paymentMethod.includes('wallet')) {
      return {
        estimated: '5-7 minutes',
        steps: [
          { label: 'Order cancelled', time: 'Immediate', status: 'completed' },
          { label: 'Refund initiated', time: 'Within 1 minute', status: 'pending' },
          { label: 'Refund processed', time: '5-7 minutes', status: 'pending' },
        ],
      };
    } else if (paymentMethod.includes('card')) {
      return {
        estimated: '5-7 business days',
        steps: [
          { label: 'Order cancelled', time: 'Immediate', status: 'completed' },
          { label: 'Refund initiated', time: 'Within 1 minute', status: 'pending' },
          { label: 'Refund processed', time: '5-7 business days', status: 'pending' },
        ],
      };
    } else {
      return {
        estimated: '3-5 business days',
        steps: [
          { label: 'Order cancelled', time: 'Immediate', status: 'completed' },
          { label: 'Refund initiated', time: 'Within 1 minute', status: 'pending' },
          { label: 'Refund processed', time: '3-5 business days', status: 'pending' },
        ],
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Cancel Order" showBackButton />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </main>
        <CustomerBottomNav />
      </div>
    );
  }

  if (!order || !canCancel()) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Cancel Order" showBackButton />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold mb-2">Order Cannot Be Cancelled</h3>
                <p className="text-sm text-muted-foreground">
                  {!order 
                    ? 'Order not found.'
                    : order.status === 'delivered'
                    ? 'This order has already been delivered. You can request a return instead.'
                    : order.status === 'cancelled'
                    ? 'This order has already been cancelled.'
                    : 'This order cannot be cancelled at this time. Please contact support for assistance.'}
                </p>
              </div>
              <Button onClick={() => navigate(RouteMap.orders())} className="w-full">
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </main>
        <CustomerBottomNav />
      </div>
    );
  }

  const refundTimeline = getRefundTimeline();

  return (
    <>
      <Helmet>
        <title>Cancel Order | Wyshkit</title>
        <meta name="description" content="Cancel your order" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader 
          title={step === 'reason' ? 'Cancel Order' : step === 'timeline' ? 'Refund Timeline' : 'Order Cancelled'} 
          showBackButton 
          onBack={() => {
            if (step === 'reason') {
              navigate(RouteMap.track(order.id));
            } else if (step === 'timeline') {
              setStep('reason');
            } else {
              navigate(RouteMap.orders());
            }
          }}
        />

        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-4 md:space-y-6">
          {/* Order Summary */}
          {step !== 'confirmation' && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {order.order_items?.[0]?.item_image_url && (
                    <img
                      src={order.order_items[0].item_image_url}
                      alt={order.order_items[0].item_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{order.order_items?.[0]?.item_name || 'Order Items'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.order_items?.length || 1} item{order.order_items?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm font-semibold mt-2">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Reason Selection */}
          {step === 'reason' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Why are you cancelling this order?</h2>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us improve our service.
                </p>
              </div>

              <RadioGroup value={selectedReason} onValueChange={handleReasonSelect}>
                <div className="space-y-2">
                  {cancellationReasons.map((reason) => (
                    <div key={reason.id} className="flex items-start space-x-3">
                      <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                      <Label
                        htmlFor={reason.id}
                        className="flex-1 cursor-pointer py-2"
                      >
                        <div className="font-medium">{reason.label}</div>
                        <div className="text-sm text-muted-foreground">{reason.description}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              {selectedReason === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Details (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Tell us more about why you're cancelling..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleContinue}
                  className="w-full h-12"
                  disabled={!selectedReason}
                >
                  Continue
                </Button>
                <Button
                  onClick={() => navigate(RouteMap.track(order.id))}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Refund Timeline */}
          {step === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Refund Timeline</h2>
                <p className="text-sm text-muted-foreground">
                  Your refund will be processed based on your payment method.
                </p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="text-center py-4">
                    <Clock className="h-12 w-12 mx-auto text-primary mb-3" />
                    <p className="text-2xl font-bold">{refundTimeline.estimated}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Estimated refund time
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {refundTimeline.steps.map((stepItem, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          stepItem.status === 'completed' 
                            ? "bg-green-100 text-green-700" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {stepItem.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{stepItem.label}</p>
                          <p className="text-xs text-muted-foreground">{stepItem.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleCancelOrder}
                  className="w-full h-12"
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
                <Button
                  onClick={() => setStep('reason')}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirmation' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <CheckCircle2 className="h-20 w-20 text-green-500" />
                      <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">Order Cancelled Successfully</h2>
                    <p className="text-sm text-muted-foreground">
                      Your order has been cancelled and refund will be processed as per the timeline.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Refund Amount</span>
                    <span className="font-semibold">₹{order.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Time</span>
                    <span className="font-medium">{refundTimeline.estimated}</span>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    You'll receive an email confirmation shortly. The refund will be credited to your original payment method.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => navigate(RouteMap.orders())}
                  className="w-full h-12"
                >
                  View My Orders
                </Button>
                <Button
                  onClick={() => navigate(RouteMap.home())}
                  variant="outline"
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          )}
        </main>
        <CustomerBottomNav />
      </div>
    </>
  );
};


