import { useState, useEffect } from "react";
import { ShoppingBag, Clock, Package, CheckCircle2, Truck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { OrderDetail } from "@/components/partner/OrderDetail";
import { useIsMobile } from "@/hooks/use-mobile";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  items: OrderItem[];
  total: number;
  partner_status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'shipped';
  proof_urls?: string[];
  proof_approved: boolean;
  created_at: string;
  delivery_address?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  add_ons?: Array<{ name: string; price: number }>;
}

/**
 * Partner Orders Page
 * Tabs by status, real-time updates, proof approval
 * Follows Swiggy/Zomato order management pattern
 */
export const PartnerOrders = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    loadOrders();
    setupRealtimeSubscription();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Orders fetch failed, using mock:', error);
        // Mock orders for development
        setOrders([
          {
            id: '1',
            order_number: 'ORD-12345',
            customer_name: 'Priya M.',
            customer_phone: '+91 98765 43210',
            items: [
              {
                id: '1',
                name: 'Premium Gift Hamper',
                quantity: 2,
                price: 249900,
                add_ons: [
                  { name: 'Company Logo Engraving', price: 20000 },
                  { name: 'Gift Wrapping', price: 14900 }
                ]
              }
            ],
            total: 569600,  // (2499 + 200 + 149) * 2 = 5696
            partner_status: 'pending',
            proof_urls: ['https://picsum.photos/800/600?random=1'],  // Customer uploaded logo
            proof_approved: false,
            created_at: new Date().toISOString(),
            delivery_address: 'Bangalore, Karnataka',
          },
          {
            id: '2',
            order_number: 'ORD-12346',
            customer_name: 'Rahul S.',
            items: [
              { id: '2', name: 'Chocolate Box', quantity: 1, price: 129900 }
            ],
            total: 129900,
            partner_status: 'accepted',
            proof_approved: true,
            created_at: new Date(Date.now() - 10 * 60000).toISOString(),
            delivery_address: 'Mumbai, Maharashtra',
          },
        ]);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription (Zomato pattern for new orders)
  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('partner-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `partner_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders(prev => [payload.new as Order, ...prev]);
          // Silent success - orders list updates automatically (Swiggy 2025 pattern)
          // Badge count in navigation will reflect new order
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Filter orders by status
  const filterOrdersByStatus = (status: string) => {
    switch (status) {
      case 'new':
        return orders.filter(o => o.partner_status === 'pending');
      case 'preparing':
        return orders.filter(o => o.partner_status === 'preparing');
      case 'ready':
        return orders.filter(o => o.partner_status === 'ready');
      case 'completed':
        return orders.filter(o => o.partner_status === 'shipped');
      default:
        return orders;
    }
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleOrderUpdate = () => {
    setSelectedOrder(null);
    loadOrders();
  };

  // Count orders by status
  const newCount = orders.filter(o => o.partner_status === 'pending').length;
  const preparingCount = orders.filter(o => o.partner_status === 'preparing').length;
  const readyCount = orders.filter(o => o.partner_status === 'ready').length;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage orders and approve customization proofs
        </p>
      </div>

      {/* Tabs by Status (Swiggy/Zomato pattern) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="new" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
            {newCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {newCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Preparing</span>
            {preparingCount > 0 && <Badge variant="secondary" className="ml-1">{preparingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ready" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Ready</span>
            {readyCount > 0 && <Badge variant="secondary" className="ml-1">{readyCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Completed</span>
          </TabsTrigger>
        </TabsList>

        {/* New Orders */}
        <TabsContent value="new" className="space-y-3 mt-6">
          {filterOrdersByStatus('new').length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No new orders</h3>
                <p className="text-sm text-muted-foreground">
                  New orders will appear here in real-time
                </p>
              </CardContent>
            </Card>
          ) : (
            filterOrdersByStatus('new').map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => handleOrderClick(order)}
              />
            ))
          )}
        </TabsContent>

        {/* Preparing Orders */}
        <TabsContent value="preparing" className="space-y-3 mt-6">
          {filterOrdersByStatus('preparing').length === 0 ? (
            <EmptyState icon={Package} message="No orders in preparation" />
          ) : (
            filterOrdersByStatus('preparing').map((order) => (
              <OrderCard key={order.id} order={order} onClick={() => handleOrderClick(order)} />
            ))
          )}
        </TabsContent>

        {/* Ready Orders */}
        <TabsContent value="ready" className="space-y-3 mt-6">
          {filterOrdersByStatus('ready').length === 0 ? (
            <EmptyState icon={CheckCircle2} message="No orders ready for pickup" />
          ) : (
            filterOrdersByStatus('ready').map((order) => (
              <OrderCard key={order.id} order={order} onClick={() => handleOrderClick(order)} />
            ))
          )}
        </TabsContent>

        {/* Completed Orders */}
        <TabsContent value="completed" className="space-y-3 mt-6">
          {filterOrdersByStatus('completed').length === 0 ? (
            <EmptyState icon={Truck} message="No completed orders yet" />
          ) : (
            filterOrdersByStatus('completed').map((order) => (
              <OrderCard key={order.id} order={order} onClick={() => handleOrderClick(order)} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Order Detail Sheet (with Proof Approval) - Swiggy 2025: Bottom on mobile, Right on desktop */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={isMobile ? "h-[90vh] rounded-t-xl overflow-y-auto" : "w-full sm:max-w-2xl overflow-y-auto"}
        >
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <OrderDetail order={selectedOrder} onUpdate={handleOrderUpdate} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, onClick }: { order: Order; onClick: () => void }) => {
  const hasCustomization = order.proof_urls && order.proof_urls.length > 0;
  const needsProofApproval = hasCustomization && !order.proof_approved;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Order Header */}
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold">{order.order_number}</p>
              <StatusBadge status={order.partner_status as any} />
              {needsProofApproval && (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-900 border-amber-200">
                  🎨 Proof Pending
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(order.created_at)}
              </span>
            </div>

            {/* Customer Info */}
            <p className="text-sm text-muted-foreground mb-1">
              {order.customer_name} • {order.delivery_address}
            </p>

            {/* Items */}
            <p className="text-sm mb-2">
              {order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
            </p>

            {/* Total */}
            <p className="text-lg font-bold text-primary">
              ₹{(order.total / 100).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Quick Actions (for new orders) */}
          {order.partner_status === 'pending' && (
            <div className="flex flex-col gap-2">
              <Button size="sm" className="h-8">
                Accept
              </Button>
              <Button size="sm" variant="outline" className="h-8">
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Empty State Component
const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <Card>
    <CardContent className="p-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </CardContent>
  </Card>
);

// Helper: Format time ago
function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

