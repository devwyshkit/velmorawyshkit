/**
 * Partner Orders Page
 * Real-time order tracking with status updates and proof upload
 * Mobile-first (reuses customer UI Tabs, Card, Sheet components)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Loader2, Package, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPartnerOrders,
  updateOrderStatus,
  type PartnerOrder,
} from '@/lib/integrations/supabase-data';
import { supabase } from '@/lib/integrations/supabase-client';
import { cn } from '@/lib/utils';

export const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PartnerOrder | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Proof upload state
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  
  // Tracking number state
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    loadOrders();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('partner_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_orders',
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setPartnerId(profile.id);
        const fetchedOrders = await fetchPartnerOrders(profile.id);
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({ title: 'Error loading orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      toast({ title: `Order marked as ${newStatus}` });
      loadOrders();
    } else {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleProofUpload = async (orderId: string) => {
    if (!proofFiles || proofFiles.length === 0) {
      toast({ title: 'Please select proof images', variant: 'destructive' });
      return;
    }

    setUploadingProof(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < proofFiles.length; i++) {
        const file = proofFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${orderId}-proof-${i + 1}-${Date.now()}.${fileExt}`;
        const filePath = `order-proofs/${partnerId}/${fileName}`;

        const { error, data } = await supabase.storage
          .from('order-proofs')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('order-proofs')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // Update order with proof images
      const success = await updateOrderStatus(orderId, 'preparing', {
        proof_images: uploadedUrls,
      });

      if (success) {
        toast({ title: 'Proof uploaded successfully!' });
        loadOrders();
        setProofFiles(null);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Proof upload failed:', error);
      toast({ title: 'Failed to upload proof', variant: 'destructive' });
    } finally {
      setUploadingProof(false);
    }
  };

  const handleDispatch = async (orderId: string) => {
    if (!trackingNumber.trim()) {
      toast({ title: 'Please enter tracking number', variant: 'destructive' });
      return;
    }

    const success = await updateOrderStatus(orderId, 'dispatched', {
      tracking_number: trackingNumber,
      dispatched_at: new Date().toISOString(),
    });

    if (success) {
      toast({ title: 'Order dispatched!' });
      loadOrders();
      setTrackingNumber('');
      setSelectedOrder(null);
    }
  };

  const filterOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      preparing: { variant: 'default' as const, label: 'Preparing', icon: Package },
      ready: { variant: 'default' as const, label: 'Ready', icon: CheckCircle },
      dispatched: { variant: 'outline' as const, label: 'Dispatched', icon: CheckCircle },
      completed: { variant: 'outline' as const, label: 'Completed', icon: CheckCircle },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <Badge variant={badge.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const OrderCard = ({ order }: { order: PartnerOrder }) => (
    <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedOrder(order)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Order #{order.order_id.slice(0, 8)}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">{order.items.length} item(s)</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {order.items.map((item) => item.name).join(', ')}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-lg font-bold">₹{(order.total_amount / 100).toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">
            Your payout: ₹{(order.partner_payout / 100).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
      </div>

      {/* Tabs for order status filtering (mobile-first) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {['pending', 'preparing', 'ready', 'dispatched', 'completed', 'cancelled'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filterOrdersByStatus(status).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No {status} orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterOrdersByStatus(status).map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle>Order #{selectedOrder.order_id.slice(0, 8)}</SheetTitle>
                <SheetDescription>
                  {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">{getStatusBadge(selectedOrder.status)}</div>
                </div>

                {/* Items */}
                <div>
                  <Label>Items</Label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">₹{(item.price / 100).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept/Decline Order (Swiggy/Zomato pattern) */}
                {selectedOrder.status === 'pending' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'preparing')}
                        className="flex-1"
                        size="lg"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept Order
                      </Button>
                      <Button
                        onClick={() => {
                          if (confirm('Are you sure you want to decline this order?')) {
                            handleStatusUpdate(selectedOrder.id, 'cancelled');
                          }
                        }}
                        variant="destructive"
                        className="flex-1"
                        size="lg"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

                {/* Proof Upload (for customizable items) */}
                {selectedOrder.status === 'preparing' && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <Label>Upload Customization Proof</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setProofFiles(e.target.files)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload photos of personalized items for customer approval
                    </p>
                    <Button
                      onClick={() => handleProofUpload(selectedOrder.id)}
                      disabled={uploadingProof || !proofFiles}
                      className="w-full"
                    >
                      {uploadingProof && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Proof
                    </Button>
                  </div>
                )}

                {/* Proof Images (if uploaded) */}
                {selectedOrder.proof_images && selectedOrder.proof_images.length > 0 && (
                  <div>
                    <Label>Uploaded Proofs</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {selectedOrder.proof_images.map((url, idx) => (
                        <img key={idx} src={url} alt={`Proof ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      ))}
                    </div>
                    {selectedOrder.proof_approved && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Approved by customer
                      </p>
                    )}
                  </div>
                )}

                {/* Tracking Number (for dispatch) */}
                {selectedOrder.status === 'ready' && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <Label>Dispatch Order</Label>
                    <Input
                      placeholder="Enter tracking number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                    <Button
                      onClick={() => handleDispatch(selectedOrder.id)}
                      disabled={!trackingNumber.trim()}
                      className="w-full"
                    >
                      Mark as Dispatched
                    </Button>
                  </div>
                )}

                {/* Quick Actions */}
                {selectedOrder.status === 'preparing' && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'ready')}
                    className="w-full"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Ready
                  </Button>
                )}

                {/* Financials */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Total</span>
                    <span className="font-medium">₹{(selectedOrder.total_amount / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee ({selectedOrder.commission_rate}%)</span>
                    <span className="font-medium text-red-600">
                      - ₹{((selectedOrder.total_amount * selectedOrder.commission_rate) / 10000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Your Payout</span>
                    <span className="text-green-600">₹{(selectedOrder.partner_payout / 100).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

