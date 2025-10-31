import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RouteMap } from "@/routes";
import { CheckCircle2, Package, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useToast } from "@/hooks/use-toast";

export const Confirmation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const orderId = id || 'ORD-' + Date.now();

  useEffect(() => {
    toast({
      title: "Order Placed Successfully! 🎉",
      description: "Your order has been confirmed",
    });
  }, []);

  // Mock order data
  const order = {
    id: orderId,
    items: [
      { name: 'Premium Gift Hamper', quantity: 2, price: 2499 },
      { name: 'Artisan Chocolate Box', quantity: 1, price: 1299 },
    ],
    total: 7796,
    estimatedDelivery: '45-60 mins',
    deliveryAddress: '123 MG Road, Bangalore, Karnataka - 560001',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />
      
      {/* Success Animation */}
      <div className="bg-gradient-primary text-white py-12 px-4 text-center">
        <div className="max-w-screen-xl mx-auto">
          <CheckCircle2 className="h-20 w-20 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-sm opacity-90">Order ID: {order.id}</p>
        </div>
      </div>

      {/* Order Details */}
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Delivery Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Estimated Delivery</h3>
                <p className="text-sm text-muted-foreground">{order.estimatedDelivery}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Delivery Address</h3>
                <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Order Items</h3>
            </div>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-border flex justify-between">
                <span className="font-semibold">Total Paid</span>
                <span className="font-bold text-primary text-lg">
                  ₹{order.total.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                (Incl. all taxes)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Custom Items Note */}
        <Card className="bg-info/10 border-info">
          <CardContent className="p-4">
            <p className="text-sm text-info-foreground">
              <strong>Note for Custom Items:</strong> You'll receive a proof for approval before final production. 
              Custom items are non-refundable after proof approval.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate(RouteMap.track(order.id))}
            className="w-full h-12"
            size="lg"
          >
            Track Order
          </Button>
          <Button
            onClick={() => navigate(RouteMap.home())}
            variant="outline"
            className="w-full h-12"
            size="lg"
          >
            Continue Shopping
          </Button>
        </div>

        {/* Loyalty Nudge */}
        <Card className="bg-gradient-warm border-0">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold mb-1">🎁 Earn 2x Points!</h3>
            <p className="text-sm text-muted-foreground">
              Refer a friend and earn double loyalty points on your next order.
            </p>
            <Button variant="link" className="mt-2 text-primary">
              Refer Now
            </Button>
          </CardContent>
        </Card>
      </main>

      <CustomerBottomNav />
    </div>
  );
};

