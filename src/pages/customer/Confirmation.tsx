import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RouteMap } from "@/routes";
import { CheckCircle2, Package, Clock, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useAuth } from "@/contexts/AuthContext";

export const Confirmation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const orderId = id || 'ORD-' + Date.now();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              item_name,
              quantity,
              total_price,
              customization_files,
              preview_status
            )
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (data && !error) {
          const hasPreviewPending = data.order_items?.some((item: any) => 
            item.preview_status && item.preview_status !== 'approved' && item.preview_status !== 'cancelled'
          ) || false;
          
          setOrder({
            id: data.order_number || orderId,
            items: data.order_items || [],
            total: data.total_amount || 0,
            estimatedDelivery: data.scheduled_date ? 'Scheduled delivery' : '45-60 mins',
            deliveryAddress: typeof data.delivery_address === 'string' 
              ? data.delivery_address 
              : `${data.delivery_address?.street || ''}, ${data.delivery_address?.city || ''}`,
            hasCustomItems: data.order_items?.some((item: any) => 
              item.customization_files && item.customization_files.length > 0
            ) || false,
            needsPreview: hasPreviewPending
          });
          // Set invoice URL if available
          if (data.refrens_invoice_url) {
            setInvoiceUrl(data.refrens_invoice_url);
          }
        }
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();

    toast({
      title: "Order Placed Successfully! 🎉",
      description: "Your order has been confirmed",
    });
  }, [orderId, user, toast]);

  // Mock fallback data
  if (!order && !loading) {
    const mockOrder = {
      id: orderId,
      items: [
        { item_name: 'Premium Gift Hamper', quantity: 2, total_price: 2499 },
        { item_name: 'Artisan Chocolate Box', quantity: 1, total_price: 1299 },
      ],
      total: 7796,
      estimatedDelivery: '45-60 mins',
      deliveryAddress: '123 MG Road, Bangalore, Karnataka - 560001',
      hasCustomItems: false
    };
    setOrder(mockOrder);
    setLoading(false);
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader />
      
      {/* Success Animation */}
      <div className="bg-gradient-primary text-white py-12 px-4 text-center">
        <div className="max-w-screen-xl mx-auto">
          <CheckCircle2 className="h-20 w-20 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-sm opacity-90">Order ID: {order?.id || orderId}</p>
          {order?.needsPreview && (
            <p className="text-sm opacity-90 mt-2">
              We'll send you a preview for approval within 24 hours
            </p>
          )}
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
                <p className="text-sm text-muted-foreground">{order?.estimatedDelivery || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Delivery Address</h3>
                <p className="text-sm text-muted-foreground">{order?.deliveryAddress || 'N/A'}</p>
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
              {order?.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.item_name || item.name} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    ₹{((item.total_price || item.price || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-border flex justify-between">
                <span className="font-semibold">Total Paid</span>
                <span className="font-bold text-primary text-lg">
                  ₹{order?.total?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                (Incl. all taxes)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Custom Items Note - Show only for custom items */}
        {order?.hasCustomItems && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-blue-900 mb-1">
                🎨 Preview in ~2 hours
              </p>
              <p className="text-xs text-blue-700">
                Your approval needed before production starts. Custom items are non-refundable after approval.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate(RouteMap.track(order.id))}
            className="w-full h-12"
            size="lg"
          >
            Track Order
          </Button>
          {invoiceUrl && (
            <Button
              onClick={() => window.open(invoiceUrl, '_blank')}
              variant="outline"
              className="w-full h-12 gap-2"
              size="lg"
            >
              <FileText className="h-5 w-5" />
              Download Invoice
            </Button>
          )}
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

