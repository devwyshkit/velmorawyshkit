import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, CreditCard, Truck, Calendar, Receipt } from "lucide-react";
import { supabase } from "@/lib/integrations/supabase-client";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderDetailsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_image_url?: string;
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_amount: number;
  delivery_address: any;
  payment_method?: string;
  payment_status?: string;
  logistics_provider?: 'porter' | 'delhivery' | null;
  tracking_number?: string | null;
  delivery_eta?: string | null;
  scheduled_for?: string | null;
  items: OrderItem[];
}

export const OrderDetailsSheet = ({
  isOpen,
  onClose,
  orderId,
}: OrderDetailsSheetProps) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    }
  }, [isOpen, orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      // Fetch order with all details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          created_at,
          total_amount,
          delivery_address,
          payment_method,
          payment_status,
          logistics_provider,
          tracking_number,
          delivery_eta,
          scheduled_for
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        // Silent error handling - show empty state (Swiggy 2025 pattern)
        setLoading(false);
        return;
      }

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('id, item_name, quantity, unit_price, total_price, item_image_url')
        .eq('order_id', orderId);

      if (itemsError) {
        // Silent error handling - continue with empty items (Swiggy 2025 pattern)
      }

      setOrderDetails({
        id: order.id,
        order_number: order.order_number || order.id,
        status: order.status || 'confirmed',
        created_at: order.created_at,
        total_amount: order.total_amount || 0,
        delivery_address: order.delivery_address || {},
        payment_method: order.payment_method || 'Online Payment',
        payment_status: order.payment_status || 'paid',
        logistics_provider: order.logistics_provider || null,
        tracking_number: order.tracking_number || null,
        delivery_eta: order.delivery_eta || null,
        scheduled_for: order.scheduled_for || null,
        items: items || [],
      });
    } catch (error) {
      // Silent error handling - show empty state (Swiggy 2025 pattern)
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      confirmed: { variant: 'default', label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
      in_production: { variant: 'secondary', label: 'In Production' },
      out_for_delivery: { variant: 'secondary', label: 'Out for Delivery', className: 'bg-orange-100 text-orange-700' },
      delivered: { variant: 'default', label: 'Delivered', className: 'bg-green-100 text-green-700' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };

    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status };
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const calculateBreakdown = () => {
    if (!orderDetails) return null;

    const subtotal = orderDetails.items.reduce((sum, item) => sum + item.total_price, 0);
    const taxes = Math.round(subtotal * 0.18); // 18% GST
    const delivery = subtotal > 1000 ? 0 : 50; // Free delivery over ₹1000
    const total = subtotal + taxes + delivery;

    return { subtotal, taxes, delivery, total };
  };

  const formatAddress = (address: any): string => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    if (address.full) return address.full;
    
    const parts = [
      address.house,
      address.street,
      address.area,
      address.city,
      address.state,
      address.pincode,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-xl sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2 flex flex-col overflow-hidden">
        {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
        <div className="flex justify-center pt-2 pb-4 flex-shrink-0">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Scrollable Content - Swiggy 2025 Pattern: Snap scrolling */}
        <div className="flex-1 overflow-y-auto snap-y snap-mandatory px-6">
          <SheetHeader className="text-left pb-4">
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>Complete breakdown of your order</SheetDescription>
          </SheetHeader>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : orderDetails ? (
            <div className="space-y-4 mt-6">
            {/* Order Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">#{orderDetails.order_number}</span>
                      {getStatusBadge(orderDetails.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Placed on {new Date(orderDetails.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {orderDetails.scheduled_for && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Scheduled for {new Date(orderDetails.scheduled_for).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Items</h3>
                </div>
                <div className="space-y-3">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      {item.item_image_url && (
                        <img
                          src={item.item_image_url}
                          alt={item.item_name}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.item_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <p className="font-semibold text-sm">
                        ₹{item.total_price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Breakdown */}
            {(() => {
              const breakdown = calculateBreakdown();
              if (!breakdown) return null;

              return (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Price Breakdown</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{breakdown.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span>₹{breakdown.taxes.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery</span>
                        <span>{breakdown.delivery === 0 ? 'Free' : `₹${breakdown.delivery.toLocaleString('en-IN')}`}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{breakdown.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Delivery Details */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Delivery Address</h3>
                </div>
                <p className="text-sm">{formatAddress(orderDetails.delivery_address)}</p>
                
                {orderDetails.logistics_provider && orderDetails.tracking_number && (
                  <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Tracked via {orderDetails.logistics_provider === 'porter' ? 'Porter' : 'Delhivery'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tracking ID: {orderDetails.tracking_number}
                    </p>
                    {orderDetails.delivery_eta && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ETA: {new Date(orderDetails.delivery_eta).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Payment</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span>{orderDetails.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={orderDetails.payment_status === 'paid' ? 'default' : 'secondary'}
                      className={orderDetails.payment_status === 'paid' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {orderDetails.payment_status === 'paid' ? 'Paid' : orderDetails.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Order not found</p>
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};



