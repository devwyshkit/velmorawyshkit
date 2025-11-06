import { useState, useEffect } from "react";
import { ShoppingBag, Clock, Package, CheckCircle2, Truck, Eye, RefreshCw, Tag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { OrderDetail } from "@/components/partner/OrderDetail";
import { PreviewUploadSheet } from "@/components/partner/PreviewUploadSheet";
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
  logistics_provider?: 'porter' | 'delhivery' | null;
  tracking_number?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  add_ons?: Array<{ name: string; price: number }>;
  preview_status?: 'pending' | 'preview_ready' | 'preview_approved' | 'revision_requested' | null;
  preview_url?: string;
  personalizations?: Array<{ id: string; label?: string }>;
}

/**
 * Partner Orders Page
 * Tabs by status, real-time updates, preview management (Fiverr 2025 pattern)
 * Follows Swiggy/Zomato order management pattern
 */
export const PartnerOrders = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("new");
  const [previewUploadOpen, setPreviewUploadOpen] = useState(false);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<string>("");

  useEffect(() => {
    loadOrders();
    setupRealtimeSubscription();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get store_id for this partner
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!store) {
        // Silent error handling - show empty state (Swiggy 2025 pattern)
        setLoading(false);
        return;
      }

      // Load orders with order_items
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            name,
            quantity,
            price,
            preview_status,
            preview_url,
            personalizations
          )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Silent error handling - show empty state (Swiggy 2025 pattern)
        setOrders([]);
        setLoading(false);
        return;
      }
      
      if (data) {
        // Transform data to match Order interface
        const transformedOrders = (data || []).map((order: any) => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: 'Customer', // Would fetch from customer profile
          customer_phone: typeof order.delivery_address === 'object' ? order.delivery_address?.phone || '' : '',
          items: order.order_items?.map((item: any) => ({
            id: item.id,
            name: item.name || item.item_name,
            quantity: item.quantity,
            price: item.price || item.unit_price,
            preview_status: item.preview_status,
            personalizations: item.personalizations,
          })) || [],
          total: order.total_amount,
          partner_status: order.status,
          proof_urls: [],
          proof_approved: false,
          created_at: order.created_at,
          delivery_address: typeof order.delivery_address === 'object' 
            ? `${order.delivery_address?.address_line1 || ''}, ${order.delivery_address?.city || ''}`
            : order.delivery_address || '',
        }));
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      // Silent error handling - show empty state (Swiggy 2025 pattern)
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('partner-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders(); // Reload on any change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          loadOrders(); // Reload when order items change (preview status updates)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Check if order has items needing preview upload
  // Simplified rule: If item has personalizations, preview required
  const hasPreviewPendingItems = (order: Order): boolean => {
    return order.items.some(item => 
      item.preview_status === 'pending' && 
      item.personalizations && item.personalizations.length > 0
    );
  };

  // Check if order has items with preview ready for review
  const hasPreviewReadyItems = (order: Order): boolean => {
    return order.items.some(item => item.preview_status === 'preview_ready');
  };

  // Check if order has revision requested items
  const hasRevisionRequestedItems = (order: Order): boolean => {
    return order.items.some(item => item.preview_status === 'revision_requested');
  };

  // Check if order has approved previews
  const hasApprovedPreviews = (order: Order): boolean => {
    return order.items.some(item => item.preview_status === 'preview_approved');
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
      case 'needs-preview':
        return orders.filter(hasPreviewPendingItems);
      case 'preview-review':
        return orders.filter(hasPreviewReadyItems);
      case 'revision':
        return orders.filter(hasRevisionRequestedItems);
      case 'in-production':
        return orders.filter(hasApprovedPreviews);
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

  const handleUploadPreview = (orderItemId: string) => {
    setSelectedOrderItemId(orderItemId);
    setPreviewUploadOpen(true);
  };

  const handlePreviewUploadSuccess = () => {
    loadOrders();
  };

  // Count orders by status
  const newCount = orders.filter(o => o.partner_status === 'pending').length;
  const preparingCount = orders.filter(o => o.partner_status === 'preparing').length;
  const readyCount = orders.filter(o => o.partner_status === 'ready').length;
  const needsPreviewCount = orders.filter(hasPreviewPendingItems).length;
  const previewReviewCount = orders.filter(hasPreviewReadyItems).length;
  const revisionCount = orders.filter(hasRevisionRequestedItems).length;
  const inProductionCount = orders.filter(hasApprovedPreviews).length;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage orders and upload previews (Fiverr 2025 pattern)
        </p>
      </div>

      {/* Tabs by Status + Preview Status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 overflow-x-auto">
          <TabsTrigger value="new" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
            {newCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {newCount}
              </Badge>
            )}
          </TabsTrigger>
          
          {/* Preview Management Tabs (Fiverr Pattern) */}
          <TabsTrigger value="needs-preview" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden md:inline">Needs Preview</span>
            {needsPreviewCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {needsPreviewCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preview-review" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Under Review</span>
            {previewReviewCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {previewReviewCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revision" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden md:inline">Revision</span>
            {revisionCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {revisionCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-production" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden md:inline">In Production</span>
            {inProductionCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {inProductionCount}
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
                onUploadPreview={handleUploadPreview}
              />
            ))
          )}
        </TabsContent>

        {/* Needs Preview Upload */}
        <TabsContent value="needs-preview" className="space-y-3 mt-6">
          {filterOrdersByStatus('needs-preview').length === 0 ? (
            <EmptyState icon={Eye} message="No orders need preview upload" />
          ) : (
            filterOrdersByStatus('needs-preview').map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onClick={() => handleOrderClick(order)}
                onUploadPreview={handleUploadPreview}
              />
            ))
          )}
        </TabsContent>

        {/* Preview Under Review */}
        <TabsContent value="preview-review" className="space-y-3 mt-6">
          {filterOrdersByStatus('preview-review').length === 0 ? (
            <EmptyState icon={Clock} message="No previews under review" />
          ) : (
            filterOrdersByStatus('preview-review').map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onClick={() => handleOrderClick(order)}
              />
            ))
          )}
        </TabsContent>

        {/* Revision Requested */}
        <TabsContent value="revision" className="space-y-3 mt-6">
          {filterOrdersByStatus('revision').length === 0 ? (
            <EmptyState icon={RefreshCw} message="No revision requests" />
          ) : (
            filterOrdersByStatus('revision').map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onClick={() => handleOrderClick(order)}
                onUploadPreview={handleUploadPreview}
              />
            ))
          )}
        </TabsContent>

        {/* In Production */}
        <TabsContent value="in-production" className="space-y-3 mt-6">
          {filterOrdersByStatus('in-production').length === 0 ? (
            <EmptyState icon={Tag} message="No orders in production" />
          ) : (
            filterOrdersByStatus('in-production').map((order) => (
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

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={isMobile ? "h-[90vh] rounded-t-xl overflow-y-auto" : "w-full sm:max-w-2xl overflow-y-auto"}
        >
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          {selectedOrder && (
            <OrderDetail 
              order={selectedOrder} 
              onUpdate={handleOrderUpdate}
              onUploadPreview={handleUploadPreview}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Preview Upload Sheet (Swiggy 2025 pattern) */}
      {selectedOrderItemId && (
        <PreviewUploadSheet
          isOpen={previewUploadOpen}
          onOpenChange={setPreviewUploadOpen}
          orderItemId={selectedOrderItemId}
          onSuccess={handlePreviewUploadSuccess}
        />
      )}
    </div>
  );
};

// Order Card Component
const OrderCard = ({ 
  order, 
  onClick, 
  onUploadPreview 
}: { 
  order: Order; 
  onClick: () => void;
  onUploadPreview?: (orderItemId: string) => void;
}) => {
  // Simplified rule: If item has personalizations, preview required
  const hasPreviewPending = order.items.some(item => 
    item.preview_status === 'pending' && 
    item.personalizations && item.personalizations.length > 0
  );
  const hasPreviewReady = order.items.some(item => item.preview_status === 'preview_ready');
  const hasRevision = order.items.some(item => item.preview_status === 'revision_requested');

  return (
    <Card 
      className="cursor-pointer hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Order Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="font-semibold">{order.order_number}</p>
              <StatusBadge status={order.partner_status as any} />
              {hasPreviewPending && (
                <Badge variant="destructive" className="text-xs">
                  Preview Required
                </Badge>
              )}
              {hasPreviewReady && (
                <Badge variant="secondary" className="text-xs">
                  Preview Under Review
                </Badge>
              )}
              {hasRevision && (
                <Badge variant="destructive" className="text-xs">
                  Revision Requested
                </Badge>
              )}
              {order.logistics_provider && (
                <Badge variant="outline" className="text-xs">
                  {order.logistics_provider === 'porter' ? '🚚 Porter' : '📦 Delhivery'}
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

            {/* Items with Preview Status */}
            <div className="space-y-1 mb-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  {item.preview_status === 'pending' && item.personalizations && item.personalizations.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUploadPreview?.(item.id);
                      }}
                    >
                      Upload Preview
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <p className="text-lg font-bold text-primary">
              ₹{(order.total / 100).toLocaleString('en-IN')}
            </p>

            {/* Tracking Info */}
            {order.tracking_number && (
              <p className="text-xs text-muted-foreground mt-1">
                Tracking: {order.tracking_number}
              </p>
            )}
          </div>
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

