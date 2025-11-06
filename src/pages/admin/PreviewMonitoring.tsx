import { useState, useEffect } from "react";
import { Eye, Clock, AlertTriangle, DollarSign, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useNavigate } from "react-router-dom";

interface PreviewMonitoringData {
  pendingUpload: Array<{
    order_id: string;
    order_number: string;
    item_id: string;
    item_name: string;
    store_name: string;
    created_at: string;
    hours_waiting: number;
  }>;
  pendingApproval: Array<{
    order_id: string;
    order_number: string;
    item_id: string;
    item_name: string;
    store_name: string;
    preview_uploaded_at: string;
    hours_waiting: number;
  }>;
  multipleRevisions: Array<{
    order_id: string;
    order_number: string;
    item_id: string;
    item_name: string;
    store_name: string;
    revision_count: number;
  }>;
  paymentNotCaptured: Array<{
    order_id: string;
    order_number: string;
    customer_name: string;
    amount: number;
    preview_approved_at: string;
    hours_waiting: number;
  }>;
}

export const AdminPreviewMonitoring = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PreviewMonitoringData>({
    pendingUpload: [],
    pendingApproval: [],
    multipleRevisions: [],
    paymentNotCaptured: [],
  });

  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      // Load orders with order_items that need attention
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          id,
          name,
          preview_status,
          preview_uploaded_at,
          revision_count,
          created_at,
          order_id (
            id,
            order_number,
            total,
            created_at,
            store_id (
              name
            ),
            customer_id (
              name
            )
          )
        `)
        .in('preview_status', ['pending', 'preview_ready']);

      if (error) throw error;

      // Process data
      const pendingUpload: PreviewMonitoringData['pendingUpload'] = [];
      const pendingApproval: PreviewMonitoringData['pendingApproval'] = [];
      const multipleRevisions: PreviewMonitoringData['multipleRevisions'] = [];
      const paymentNotCaptured: PreviewMonitoringData['paymentNotCaptured'] = [];

      orderItems?.forEach((item: any) => {
        const order = item.order_id;
        const storeName = order?.store_id?.name || 'Unknown Store';
        const customerName = order?.customer_id?.name || 'Unknown Customer';

        // Items pending preview upload (>24h)
        if (item.preview_status === 'pending') {
          const created = new Date(item.created_at);
          const hoursWaiting = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
          
          if (hoursWaiting > 24) {
            pendingUpload.push({
              order_id: order?.id,
              order_number: order?.order_number || 'N/A',
              item_id: item.id,
              item_name: item.name,
              store_name: storeName,
              created_at: item.created_at,
              hours_waiting: Math.floor(hoursWaiting),
            });
          }
        }

        // Items pending customer approval (>48h)
        if (item.preview_status === 'preview_ready' && item.preview_uploaded_at) {
          const uploaded = new Date(item.preview_uploaded_at);
          const hoursWaiting = (now.getTime() - uploaded.getTime()) / (1000 * 60 * 60);
          
          if (hoursWaiting > 48) {
            pendingApproval.push({
              order_id: order?.id,
              order_number: order?.order_number || 'N/A',
              item_id: item.id,
              item_name: item.name,
              store_name: storeName,
              preview_uploaded_at: item.preview_uploaded_at,
              hours_waiting: Math.floor(hoursWaiting),
            });
          }
        }

        // Items with multiple revisions (>3)
        if (item.revision_count && item.revision_count > 3) {
          multipleRevisions.push({
            order_id: order?.id,
            order_number: order?.order_number || 'N/A',
            item_id: item.id,
            item_name: item.name,
            store_name: storeName,
            revision_count: item.revision_count,
          });
        }
      });

      // Load orders with approved previews but payment not captured
      const { data: approvedOrders, error: paymentError } = await supabase
        .from('order_items')
        .select(`
          id,
          preview_status,
          preview_uploaded_at,
          order_id (
            id,
            order_number,
            total,
            customer_id (
              name
            ),
            payment_status
          )
        `)
        .eq('preview_status', 'preview_approved');

      if (!paymentError && approvedOrders) {
        approvedOrders.forEach((item: any) => {
          const order = item.order_id;
          if (order && order.payment_status !== 'captured') {
            const approved = item.preview_uploaded_at ? new Date(item.preview_uploaded_at) : new Date(order.created_at);
            const hoursWaiting = (now.getTime() - approved.getTime()) / (1000 * 60 * 60);
            
            paymentNotCaptured.push({
              order_id: order.id,
              order_number: order.order_number || 'N/A',
              customer_name: order.customer_id?.name || 'Unknown',
              amount: order.total || 0,
              preview_approved_at: item.preview_uploaded_at || order.created_at,
              hours_waiting: Math.floor(hoursWaiting),
            });
          }
        });
      }

      setData({
        pendingUpload,
        pendingApproval,
        multipleRevisions,
        paymentNotCaptured,
      });
    } catch (error: any) {
      console.error('Failed to load monitoring data:', error);
      toast({
        title: "Failed to load data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Preview Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Monitor preview uploads, customer approvals, and payment capture
        </p>
      </div>

      <Tabs defaultValue="pending-upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending-upload" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pending Upload ({data.pendingUpload.length})
          </TabsTrigger>
          <TabsTrigger value="pending-approval" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval ({data.pendingApproval.length})
          </TabsTrigger>
          <TabsTrigger value="revisions" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Multiple Revisions ({data.multipleRevisions.length})
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payment Issues ({data.paymentNotCaptured.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Upload Tab */}
        <TabsContent value="pending-upload" className="space-y-3 mt-6">
          {data.pendingUpload.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All Good!</h3>
                <p className="text-sm text-muted-foreground">
                  No orders pending preview upload for more than 24 hours
                </p>
              </CardContent>
            </Card>
          ) : (
            data.pendingUpload.map((item) => (
              <Card key={item.item_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{item.order_number}</p>
                        <Badge variant="destructive">Waiting {item.hours_waiting}h</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">Store: {item.store_name}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/orders/${item.order_id}`)}
                    >
                      View Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pending Approval Tab */}
        <TabsContent value="pending-approval" className="space-y-3 mt-6">
          {data.pendingApproval.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All Good!</h3>
                <p className="text-sm text-muted-foreground">
                  No previews waiting for customer approval for more than 48 hours
                </p>
              </CardContent>
            </Card>
          ) : (
            data.pendingApproval.map((item) => (
              <Card key={item.item_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{item.order_number}</p>
                        <Badge variant="secondary">Waiting {item.hours_waiting}h</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">Store: {item.store_name}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/orders/${item.order_id}`)}
                    >
                      View Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Multiple Revisions Tab */}
        <TabsContent value="revisions" className="space-y-3 mt-6">
          {data.multipleRevisions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All Good!</h3>
                <p className="text-sm text-muted-foreground">
                  No orders with more than 3 revision requests
                </p>
              </CardContent>
            </Card>
          ) : (
            data.multipleRevisions.map((item) => (
              <Card key={item.item_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{item.order_number}</p>
                        <Badge variant="destructive">{item.revision_count} Revisions</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">Store: {item.store_name}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/orders/${item.order_id}`)}
                    >
                      View Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Payment Issues Tab */}
        <TabsContent value="payment" className="space-y-3 mt-6">
          {data.paymentNotCaptured.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All Good!</h3>
                <p className="text-sm text-muted-foreground">
                  All approved previews have payment captured
                </p>
              </CardContent>
            </Card>
          ) : (
            data.paymentNotCaptured.map((item) => (
              <Card key={item.order_id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{item.order_number}</p>
                        <Badge variant="destructive">Payment Not Captured</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Customer: {item.customer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Amount: ₹{(item.amount / 100).toLocaleString('en-IN')} • Waiting {item.hours_waiting}h
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/orders/${item.order_id}`)}
                      >
                        View Order
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          toast({
                            title: "Payment capture",
                            description: "This will trigger payment capture via Edge Function",
                          });
                        }}
                      >
                        Capture Payment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
