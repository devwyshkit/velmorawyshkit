import { useState, useEffect } from "react";
import { Truck, Package, MapPin, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReadyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  delivery_address: string;
  total: number;
  ready_at: string;
  store_name: string;
  logistics_provider?: 'porter' | 'delhivery' | null;
  tracking_number?: string;
}

export const AdminLogisticsManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<'porter' | 'delhivery' | ''>('');

  useEffect(() => {
    loadReadyOrders();
  }, []);

  const loadReadyOrders = async () => {
    setLoading(true);
    try {
      // Load orders that are ready for shipment (status = 'ready' or 'production' with all previews approved)
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          delivery_address,
          logistics_provider,
          tracking_number,
          updated_at,
          store_id (
            name
          ),
          customer_id (
            name
          )
        `)
        .in('status', ['ready', 'production'])
        .order('updated_at', { ascending: true });

      if (error) throw error;

      const transformedOrders: ReadyOrder[] = (orders || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `ORD-${order.id.substring(0, 8)}`,
        customer_name: order.customer_id?.name || 'Unknown',
        delivery_address: order.delivery_address || 'Address not provided',
        total: order.total || 0,
        ready_at: order.updated_at,
        store_name: order.store_id?.name || 'Unknown Store',
        logistics_provider: order.logistics_provider || null,
        tracking_number: order.tracking_number || undefined,
      }));

      setReadyOrders(transformedOrders);
    } catch (error: any) {
      console.error('Failed to load ready orders:', error);
      toast({
        title: "Failed to load orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === readyOrders.filter(o => !o.logistics_provider).length) {
      setSelectedOrders(new Set());
    } else {
      const unassignedIds = readyOrders
        .filter(o => !o.logistics_provider)
        .map(o => o.id);
      setSelectedOrders(new Set(unassignedIds));
    }
  };

  const handleAssignLogistics = async () => {
    if (!selectedProvider) {
      toast({
        title: "Select provider",
        description: "Please select a logistics provider",
        variant: "destructive",
      });
      return;
    }

    if (selectedOrders.size === 0) {
      toast({
        title: "Select orders",
        description: "Please select at least one order",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const orderIds = Array.from(selectedOrders);
      const trackingNumbers: Record<string, string> = {};

      // Generate tracking numbers (in production, this would call Porter/Delhivery API)
      for (const orderId of orderIds) {
        const order = readyOrders.find(o => o.id === orderId);
        if (order) {
          // Mock tracking number - in production, call logistics API
          const trackingNumber = `${selectedProvider.toUpperCase()}-${Date.now()}-${orderId.substring(0, 8).toUpperCase()}`;
          trackingNumbers[orderId] = trackingNumber;
        }
      }

      // Update orders with logistics provider and tracking number
      for (const orderId of orderIds) {
        const { error } = await supabase
          .from('orders')
          .update({
            logistics_provider: selectedProvider,
            tracking_number: trackingNumbers[orderId],
            logistics_assigned_at: new Date().toISOString(),
            logistics_status: 'assigned',
          })
          .eq('id', orderId);

        if (error) throw error;
      }

      toast({
        title: "Logistics assigned",
        description: `Assigned ${orderIds.length} order(s) to ${selectedProvider}`,
      });

      setSelectedOrders(new Set());
      setSelectedProvider('');
      loadReadyOrders();
    } catch (error: any) {
      console.error('Failed to assign logistics:', error);
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unassignedOrders = readyOrders.filter(o => !o.logistics_provider);
  const assignedOrders = readyOrders.filter(o => o.logistics_provider);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Logistics Management</h1>
        <p className="text-sm text-muted-foreground">
          Assign Porter or Delhivery to orders ready for shipment
        </p>
      </div>

      <Tabs defaultValue="unassigned" className="w-full">
        <TabsList>
          <TabsTrigger value="unassigned">
            Unassigned ({unassignedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Assigned ({assignedOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Unassigned Orders Tab */}
        <TabsContent value="unassigned" className="space-y-4 mt-6">
          {unassignedOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All Orders Assigned</h3>
                <p className="text-sm text-muted-foreground">
                  All ready orders have been assigned to logistics partners
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Bulk Assignment */}
              {selectedOrders.size > 0 && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-base">Bulk Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Select value={selectedProvider} onValueChange={(v: any) => setSelectedProvider(v)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="porter">🚚 Porter</SelectItem>
                          <SelectItem value="delhivery">📦 Delhivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAssignLogistics}
                        disabled={loading || !selectedProvider}
                      >
                        Assign to {selectedProvider ? (selectedProvider === 'porter' ? 'Porter' : 'Delhivery') : 'Provider'} ({selectedOrders.size} orders)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrders(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Orders List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {unassignedOrders.length} order(s) ready for assignment
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedOrders.size === unassignedOrders.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                {unassignedOrders.map((order) => (
                  <Card
                    key={order.id}
                    className={selectedOrders.has(order.id) ? 'border-primary bg-primary/5' : ''}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="mt-1 h-4 w-4"
                          aria-label={`Select order ${order.order_number}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{order.order_number}</p>
                            <Badge variant="outline">Ready</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {order.customer_name} • {order.store_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {order.delivery_address}
                          </div>
                          <p className="text-sm font-medium mt-2">
                            ₹{(order.total / 100).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={selectedOrders.has(order.id) ? selectedProvider : ''}
                            onValueChange={(v: any) => {
                              setSelectedProvider(v);
                              setSelectedOrders(new Set([order.id]));
                            }}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Assign" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="porter">🚚 Porter</SelectItem>
                              <SelectItem value="delhivery">📦 Delhivery</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Assigned Orders Tab */}
        <TabsContent value="assigned" className="space-y-3 mt-6">
          {assignedOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Assigned Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Orders assigned to logistics partners will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            assignedOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{order.order_number}</p>
                        <Badge variant={order.logistics_provider === 'porter' ? 'default' : 'secondary'}>
                          {order.logistics_provider === 'porter' ? '🚚 Porter' : '📦 Delhivery'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {order.customer_name} • {order.store_name}
                      </p>
                      {order.tracking_number && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Tracking: {order.tracking_number}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {order.delivery_address}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      View
                    </Button>
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
