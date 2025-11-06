import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RouteMap } from "@/routes";
import { CheckCircle2, AlertCircle, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderById } from "@/lib/mock-orders";
import { useToast } from "@/hooks/use-toast";
import { generateReturnId } from "@/lib/utils/id-generator";
import { safeJsonParse } from "@/lib/utils/safe-json";
import { safeSetItem } from "@/lib/mock-storage";
import { Order } from "@/lib/mock-orders";
import { cn } from "@/lib/utils";

/**
 * ReturnRequest - Swiggy 2025 Pattern
 * 
 * Multi-step return flow:
 * 1. Reason selection
 * 2. Item selection (if multiple items)
 * 3. Pickup scheduling
 * 4. Refund timeline
 * 5. Confirmation
 */
// Helper to load order synchronously (Swiggy 2025 pattern)
const loadOrderSync = (orderId: string | undefined, userId: string | undefined): Order | null => {
  if (!orderId || !userId) return null;
  try {
    const orderData = getOrderById(orderId);
    if (orderData && orderData.customer_id === userId && orderData.status === 'delivered') {
      return orderData;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const ReturnRequest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  // Swiggy 2025: Initialize order synchronously if id/user available
  const [order, setOrder] = useState<Order | null>(() => loadOrderSync(id, user?.id));
  const [step, setStep] = useState<'reason' | 'items' | 'pickup' | 'timeline' | 'confirmation'>('reason');
  const [selectedReason, setSelectedReason] = useState<string>('');
  // Pre-select all items if order is loaded synchronously
  const [selectedItems, setSelectedItems] = useState<string[]>(() => {
    const initialOrder = loadOrderSync(id, user?.id);
    return initialOrder?.order_items?.map((item: { id: string }) => item.id) || [];
  });
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnReasons = [
    { id: 'damaged', label: 'Item damaged', description: 'Product arrived damaged or defective' },
    { id: 'wrong_item', label: 'Wrong item received', description: 'Received different product than ordered' },
    { id: 'size_fit', label: 'Size/fit issue', description: 'Product doesn\'t fit as expected' },
    { id: 'quality', label: 'Quality issue', description: 'Product quality not as expected' },
    { id: 'not_as_described', label: 'Not as described', description: 'Product different from description' },
    { id: 'other', label: 'Other reason', description: 'Something else' },
  ];

  const timeSlots = [
    { id: '10-12', label: '10:00 AM - 12:00 PM' },
    { id: '12-2', label: '12:00 PM - 2:00 PM' },
    { id: '2-4', label: '2:00 PM - 4:00 PM' },
    { id: '4-6', label: '4:00 PM - 6:00 PM' },
    { id: '6-8', label: '6:00 PM - 8:00 PM' },
  ];

  // Swiggy 2025: Refresh order when id/user changes (synchronous)
  useEffect(() => {
    if (id && user) {
      const orderData = loadOrderSync(id, user.id);
      if (orderData) {
        setOrder(orderData);
        // Pre-select all items
        setSelectedItems(orderData.order_items?.map((item: { id: string }) => item.id) || []);
      } else {
        toast({
          title: 'Order not found',
          description: 'We couldn\'t find this order or it\'s not eligible for return.',
          variant: 'destructive',
        });
        navigate(RouteMap.orders());
      }
    } else if (id && !user) {
      // Wait for user to load
    } else if (!id) {
      // No id - redirect
      navigate(RouteMap.orders());
    }
  }, [id, user, navigate, toast]);

  const canReturn = () => {
    if (!order) return false;
    // Swiggy 2025: Can return if order is delivered (within return window)
    return order.status === 'delivered';
  };

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleContinue = () => {
    if (!selectedReason) {
      toast({
        title: 'Please select a reason',
        description: 'We need to know why you\'re returning this order.',
        variant: 'destructive',
      });
      return;
    }

    if (step === 'reason') {
      // If multiple items, go to item selection, otherwise skip to pickup
      if (order && order.order_items?.length > 1) {
        setStep('items');
      } else {
        setStep('pickup');
      }
    } else if (step === 'items') {
      if (selectedItems.length === 0) {
        toast({
          title: 'Please select items',
          description: 'Please select at least one item to return.',
          variant: 'destructive',
        });
        return;
      }
      setStep('pickup');
    } else if (step === 'pickup') {
      if (!pickupDate || !pickupTimeSlot) {
        toast({
          title: 'Please select pickup details',
          description: 'Please select a date and time slot for pickup.',
          variant: 'destructive',
        });
        return;
      }
      setStep('timeline');
    }
  };

  const handleSubmitReturn = async () => {
    if (!order || !selectedReason || selectedItems.length === 0) return;

    setIsSubmitting(true);
    try {
      // Mock: Store return request in localStorage
      const returnRequests = safeJsonParse(localStorage.getItem('wyshkit_return_requests'), [] as Array<{ id: string; order_id: string; reason: string; items: string[]; status: string; created_at: string }>);
      const newReturn = {
        id: generateReturnId(),
        order_id: order.id,
        order_number: order.order_number,
        items: selectedItems,
        reason: selectedReason,
        notes: additionalNotes,
        pickup_date: pickupDate,
        pickup_time_slot: pickupTimeSlot,
        status: 'pending',
        created_at: new Date().toISOString(),
        refund_amount: order.order_items
          .filter((item) => selectedItems.includes(item.id))
          .reduce((sum: number, item) => sum + item.total_price, 0),
      };
      returnRequests.push(newReturn);
      localStorage.setItem('wyshkit_return_requests', JSON.stringify(returnRequests));

      // Update order items to show return requested
      const orders = safeJsonParse(localStorage.getItem('wyshkit_mock_orders'), [] as Order[]);
      const orderIndex = orders.findIndex((o) => o.id === order.id);
      if (orderIndex >= 0) {
        orders[orderIndex].order_items = orders[orderIndex].order_items.map((item) => 
          selectedItems.includes(item.id) 
            ? { ...item, return_requested: true, return_status: 'pending' }
            : item
        );
        orders[orderIndex].updated_at = new Date().toISOString();
        safeSetItem('wyshkit_mock_orders', orders);
      }

      setStep('confirmation');
    } catch (error) {
      toast({
        title: 'Return request failed',
        description: 'We couldn\'t process your return request. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRefundTimeline = () => {
    // Swiggy 2025: Refund timeline after pickup
    return {
      estimated: '5-7 business days after pickup',
      steps: [
        { label: 'Return request submitted', time: 'Immediate', status: 'completed' },
        { label: 'Pickup scheduled', time: pickupDate, status: 'pending' },
        { label: 'Item picked up', time: 'After pickup', status: 'pending' },
        { label: 'Quality check', time: '1-2 days', status: 'pending' },
        { label: 'Refund processed', time: '5-7 business days', status: 'pending' },
      ],
    };
  };

  const getSelectedItemsTotal = () => {
    if (!order) return 0;
    return order.order_items
      .filter((item) => selectedItems.includes(item.id))
      .reduce((sum: number, item) => sum + item.total_price, 0);
  };

  // Get next available dates (next 7 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    }
    return dates;
  };

  // Swiggy 2025: Show loading only if id/user not available yet (async auth check)
  // Otherwise, order is loaded synchronously, so no loading state needed
  if (!id || !user) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Return Order" showBackButton />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </main>
        <CustomerBottomNav />
      </div>
    );
  }

  if (!order || !canReturn()) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Return Order" showBackButton />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold mb-2">Order Cannot Be Returned</h3>
                <p className="text-sm text-muted-foreground">
                  {!order 
                    ? 'Order not found.'
                    : order.status !== 'delivered'
                    ? 'This order has not been delivered yet. You can cancel it instead.'
                    : 'This order is not eligible for return. Please contact support for assistance.'}
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
  const availableDates = getAvailableDates();

  return (
    <>
      <Helmet>
        <title>Return Order | Wyshkit</title>
        <meta name="description" content="Return your order" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader 
          title={
            step === 'reason' ? 'Return Order' : 
            step === 'items' ? 'Select Items' :
            step === 'pickup' ? 'Schedule Pickup' :
            step === 'timeline' ? 'Return Timeline' : 
            'Return Requested'
          } 
          showBackButton 
          onBackClick={() => {
            if (step === 'reason') {
              navigate(RouteMap.track(order.id));
            } else if (step === 'items') {
              setStep('reason');
            } else if (step === 'pickup') {
              setStep(order.order_items?.length > 1 ? 'items' : 'reason');
            } else if (step === 'timeline') {
              setStep('pickup');
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
                <h2 className="text-lg font-semibold mb-2">Why are you returning this order?</h2>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us improve our service.
                </p>
              </div>

              <RadioGroup value={selectedReason} onValueChange={handleReasonSelect}>
                <div className="space-y-2">
                  {returnReasons.map((reason) => (
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
                    placeholder="Tell us more about why you're returning..."
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

          {/* Step 2: Item Selection (if multiple items) */}
          {step === 'items' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Select Items to Return</h2>
                <p className="text-sm text-muted-foreground">
                  Choose which items you want to return.
                </p>
              </div>

              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleItemToggle(item.id)}
                          className="mt-1"
                        />
                        {item.item_image_url && (
                          <img
                            src={item.item_image_url}
                            alt={item.item_name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold mt-2">
                            ₹{item.total_price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedItems.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Refund Amount</span>
                      <span className="text-lg font-bold">₹{getSelectedItemsTotal().toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleContinue}
                  className="w-full h-12"
                  disabled={selectedItems.length === 0}
                >
                  Continue
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

          {/* Step 3: Pickup Scheduling */}
          {step === 'pickup' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Schedule Pickup</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a convenient date and time for pickup.
                </p>
              </div>

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{order.delivery_address?.area || 'Your address'}, {order.delivery_address?.city || 'Your city'}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block">Select Date</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableDates.map((date) => (
                      <Button
                        key={date.value}
                        variant={pickupDate === date.value ? 'default' : 'outline'}
                        onClick={() => setPickupDate(date.value)}
                        className="h-12"
                      >
                        {date.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Select Time Slot</Label>
                  <RadioGroup value={pickupTimeSlot} onValueChange={setPickupTimeSlot}>
                    <div className="space-y-2">
                      {timeSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center space-x-3">
                          <RadioGroupItem value={slot.id} id={slot.id} />
                          <Label htmlFor={slot.id} className="cursor-pointer flex-1">
                            {slot.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleContinue}
                  className="w-full h-12"
                  disabled={!pickupDate || !pickupTimeSlot}
                >
                  Continue
                </Button>
                <Button
                  onClick={() => setStep(order.order_items?.length > 1 ? 'items' : 'reason')}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Refund Timeline */}
          {step === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">Return Timeline</h2>
                <p className="text-sm text-muted-foreground">
                  Your refund will be processed after we receive and verify the items.
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

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Refund Amount</span>
                    <span className="text-lg font-bold">₹{getSelectedItemsTotal().toLocaleString('en-IN')}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleSubmitReturn}
                  className="w-full h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Return Request'}
                </Button>
                <Button
                  onClick={() => setStep('pickup')}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
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
                    <h2 className="text-xl font-bold mb-2">Return Request Submitted</h2>
                    <p className="text-sm text-muted-foreground">
                      Your return request has been submitted. We'll pick up the items on the scheduled date.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pickup Date</span>
                    <span className="font-medium">
                      {new Date(pickupDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time Slot</span>
                    <span className="font-medium">
                      {timeSlots.find(s => s.id === pickupTimeSlot)?.label}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Refund Amount</span>
                    <span className="font-semibold">₹{getSelectedItemsTotal().toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Time</span>
                    <span className="font-medium">{refundTimeline.estimated}</span>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    You'll receive an email confirmation shortly. Our team will pick up the items on the scheduled date.
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


