import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RouteMap } from "@/routes";
import { Package, MapPin, CreditCard, Truck, Calendar, Receipt, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderById } from "@/lib/mock-orders";
import { downloadInvoice } from "@/lib/mock-invoice";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * OrderDetails - Swiggy 2025 Pattern
 * 
 * Full page view for order details:
 * - Mobile: Full page with bottom nav
 * - Desktop: Full page view
 */
// Helper to load order synchronously (Swiggy 2025 pattern)
const loadOrderSync = (orderId: string | undefined, userId: string | undefined): any | null => {
  if (!orderId || !userId) return null;
  try {
    const orderData = getOrderById(orderId);
    if (orderData && orderData.customer_id === userId) {
      return orderData;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  // Swiggy 2025: Initialize order synchronously if id is available
  const [order, setOrder] = useState<any>(() => loadOrderSync(id, user?.id));

  useEffect(() => {
    if (id && user) {
      // Load order synchronously when id/user available
      const orderData = loadOrderSync(id, user.id);
      if (orderData) {
        setOrder(orderData);
      } else {
        toast({
          title: 'Order not found',
          description: 'We couldn\'t find this order.',
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

  const calculateBreakdown = () => {
    if (!order) return null;
    const subtotal = order.subtotal || order.total_amount * 0.85;
    const taxes = order.total_amount - subtotal - (order.delivery_charge || 0);
    const delivery = order.delivery_charge || 0;
    return { subtotal, taxes, delivery, total: order.total_amount };
  };

  const formatAddress = (address: any) => {
    if (!address) return 'No address provided';
    const parts = [
      address.house,
      address.area,
      address.city,
      address.pincode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; label: string; className?: string }> = {
      confirmed: { variant: 'default', label: 'Confirmed' },
      'preview_pending': { variant: 'outline', label: 'Preview Pending', className: 'border-orange-300 text-orange-700' },
      'in_production': { variant: 'secondary', label: 'In Production' },
      'in-transit': { variant: 'secondary', label: 'In Transit' },
      delivered: { variant: 'default', label: 'Delivered', className: 'bg-green-100 text-green-700' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Swiggy 2025: Show loading only if id/user not available yet (async auth check)
  // Otherwise, order is loaded synchronously, so no loading state needed
  if (!id || !user) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Order Details" showBackButton />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <CustomerBottomNav />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Order Details" showBackButton />
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Order not found</p>
              <Button onClick={() => navigate(RouteMap.orders())} className="mt-4">
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </main>
        <CustomerBottomNav />
      </div>
    );
  }

  const breakdown = calculateBreakdown();

  return (
    <>
      <Helmet>
        <title>Order Details | Wyshkit</title>
        <meta name="description" content="View order details" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Order Details" showBackButton />

        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-4 md:space-y-6">
          {/* Order Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                      {order.order_number || `Order ${order.id.slice(-8)}`}
                    </h2>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadInvoice(order.id)}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Invoice
                </Button>
              </div>
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
                {order.order_items?.map((item: any) => (
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
          {breakdown && (
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
          )}

          {/* Delivery Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Delivery Address</h3>
              </div>
              <p className="text-sm">{formatAddress(order.delivery_address)}</p>
              
              {order.logistics_provider && order.tracking_number && (
                <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {order.logistics_provider === 'porter' ? 'Porter' : 'Delhivery'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tracking: {order.tracking_number}
                  </p>
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="capitalize">{order.payment_method || 'Not specified'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            {order.status === 'confirmed' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(RouteMap.orderCancellation(order.id))}
              >
                Cancel Order
              </Button>
            )}
            {order.status === 'delivered' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(RouteMap.returnRequest(order.id))}
              >
                Return Order
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate(RouteMap.track(order.id))}
            >
              Track Order
            </Button>
          </div>
        </main>
        <CustomerBottomNav />
      </div>
    </>
  );
};


