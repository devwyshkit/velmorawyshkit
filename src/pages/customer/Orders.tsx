import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Package, RefreshCw, FileText, Undo2, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { QuickReorderSheet } from "@/components/customer/shared/QuickReorderSheet";
import { OrderDetailsSheet } from "@/components/customer/shared/OrderDetailsSheet";
import { RatingSheet } from "@/components/customer/RatingSheet";
// Phase 1 Cleanup: Removed Supabase imports - pure mock mode
import { useAuth } from "@/contexts/AuthContext";
import { getOrdersByCustomer, prePopulateOrders } from "@/lib/mock-orders";

interface Order {
  id: string;
  date: string;
  itemName: string;
  recipient: string;
  total: number;
  status: 'delivered' | 'in-transit' | 'preview-pending';
  image: string;
}

interface OrderRow {
  id: string;
  created_at: string;
  order_number?: string;
  status: string;
  total_amount: number;
  customer_id: string;
}

// Helper to format orders (Swiggy 2025 pattern)
const formatOrders = (mockOrders: ReturnType<typeof getOrdersByCustomer>): Order[] => {
  return mockOrders.map((order) => {
    const firstItem = order.order_items?.[0];
    const statusMap: Record<string, Order['status']> = {
      'delivered': 'delivered',
      'out_for_delivery': 'in-transit',
      'in_production': 'in-transit',
      'preview_pending': 'preview-pending',
      'preview_ready': 'preview-pending',
      'preview_approved': 'in-transit',
      'confirmed': 'in-transit',
    };
    
    const formattedStatus = statusMap[order.status] || 'in-transit';
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    
    return {
      id: order.order_number || order.id,
      date: formattedStatus === 'delivered' ? `Delivered ${dateStr}` : dateStr,
      itemName: firstItem?.item_name || 'Order Items',
      recipient: order.delivery_address?.name || 'Customer',
      total: order.total_amount / 100, // Convert from paise
      status: formattedStatus,
      image: firstItem?.item_image_url || 'https://via.placeholder.com/100',
    };
  });
};

// Helper to load orders synchronously (Swiggy 2025 pattern)
const loadOrdersSync = (userId?: string): Order[] => {
  if (!userId) return [];
  try {
    prePopulateOrders(userId);
    const mockOrders = getOrdersByCustomer(userId);
    return formatOrders(mockOrders);
  } catch (error) {
    return [];
  }
};

export const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reorderOrderId, setReorderOrderId] = useState<string | null>(null);
  const [orderDetailsId, setOrderDetailsId] = useState<string | null>(null);
  // Swiggy 2025: Initialize orders synchronously to prevent empty flash
  const [orders, setOrders] = useState<Order[]>(() => loadOrdersSync(user?.id));
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);

  // Refresh orders when user changes (Swiggy 2025 pattern)
  useEffect(() => {
    if (user) {
      const formattedOrders = loadOrdersSync(user.id);
      setOrders(formattedOrders);
    } else {
      setOrders([]);
    }
  }, [user]);

  // Phase 6: Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return order.status !== 'delivered';
    if (filterStatus === 'delivered') return order.status === 'delivered';
    if (filterStatus === 'cancelled') return order.status === 'cancelled'; // Future status
    return true;
  });

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-700">✓ Delivered</Badge>;
      case 'in-transit':
        return <Badge variant="secondary">🚗 In Transit</Badge>;
      case 'preview-pending':
        return <Badge variant="outline" className="border-orange-300 text-orange-700">⏰ Preview Pending</Badge>;
    }
  };

  const canReturn = (status: Order['status']) => status === 'delivered';

  return (
    <>
      <Helmet>
        <title>My Orders | Wyshkit</title>
        <meta name="description" content="View your order history and track deliveries" />
      </Helmet>
      <div className="min-h-screen bg-background pb-[112px]">
        <CustomerMobileHeader title="Orders" showBackButton />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-4">
        {/* Phase 6: Filter tabs (Swiggy 2025 pattern) */}
        {!loading && orders.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(['all', 'active', 'delivered'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="whitespace-nowrap"
              >
                {status === 'all' && 'All Orders'}
                {status === 'active' && 'Active'}
                {status === 'delivered' && 'Delivered'}
              </Button>
            ))}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start exploring and place your first order
            </p>
            <Button onClick={() => navigate(RouteMap.home())}>
              Start Shopping
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No {filterStatus === 'all' ? '' : filterStatus} orders</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {filterStatus === 'delivered' && 'You haven\'t received any orders yet'}
              {filterStatus === 'active' && 'No active orders'}
            </p>
            {filterStatus !== 'all' && (
              <Button variant="outline" onClick={() => setFilterStatus('all')}>
                View All Orders
              </Button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden cursor-pointer" onClick={() => setOrderDetailsId(order.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">#{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 mb-3">
                  <img 
                    src={order.image} 
                    alt={order.itemName}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">{order.itemName}</p>
                    <p className="text-xs text-muted-foreground">To: {order.recipient}</p>
                    <p className="font-semibold mt-1">₹{order.total.toLocaleString('en-IN')}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {order.status === 'delivered' && (
                    <>
                      {/* Phase 6: Rate Order button for delivered orders */}
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRatingOrderId(order.id);
                        }}
                        className="flex items-center gap-1 bg-primary"
                      >
                        <Star className="h-3 w-3" />
                        Rate Order
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setReorderOrderId(order.id);
                        }}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reorder
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          /* Invoice download - future enhancement */
                        }}
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Invoice
                      </Button>
                      {canReturn(order.status) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(RouteMap.returnRequest(order.id));
                          }}
                          className="flex items-center gap-1"
                        >
                          <Undo2 className="h-3 w-3" />
                          Return
                        </Button>
                      )}
                    </>
                  )}
                  {order.status === 'in-transit' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(RouteMap.track(order.id))}
                    >
                      Track Order
                    </Button>
                  )}
                  {(order.status === 'preview-pending' || order.status === 'in-transit') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (['confirmed', 'preview_pending', 'preview-pending', 'in_production'].includes(order.status)) {
                          navigate(RouteMap.orderCancellation(order.id));
                        } else {
                          navigate(RouteMap.track(order.id));
                        }
                      }}
                    >
                      {['confirmed', 'preview_pending', 'preview-pending', 'in_production'].includes(order.status) ? 'Cancel Order' : 'Track Order'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
      
      <CustomerBottomNav />

      {/* Quick Reorder Sheet */}
      {reorderOrderId && (
        <QuickReorderSheet
          isOpen={!!reorderOrderId}
          onClose={() => setReorderOrderId(null)}
          orderId={reorderOrderId}
        />
      )}

      {/* Order Details Sheet */}
      {orderDetailsId && (
        <OrderDetailsSheet
          isOpen={!!orderDetailsId}
          onClose={() => setOrderDetailsId(null)}
          orderId={orderDetailsId}
        />
      )}

      {/* Rating Sheet - Phase 6: For delivered orders */}
      {ratingOrderId && (() => {
        const order = orders.find(o => o.id === ratingOrderId);
        return order ? (
          <RatingSheet
            isOpen={!!ratingOrderId}
            onClose={() => setRatingOrderId(null)}
            orderId={ratingOrderId}
            orderItems={[{
              id: ratingOrderId,
              name: order.itemName,
              image: order.image,
              quantity: 1,
            }]}
          />
        ) : null;
      })()}
      </div>
    </>
  );
};

