import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { useIsMobile } from "@/hooks/use-mobile";

interface KittingJob {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  status: string;
  total_units: number;
  units_completed: number;
  components_received_at: string | null;
  created_at: string;
  components: Array<{
    id: string;
    name: string;
    quantity_needed: number;
    quantity_received: number;
    status: string;
    eta: string | null;
  }>;
}

/**
 * KittingDashboard - Partner's view of active assembly jobs
 * Shows component arrival status and enables kitting workflow
 */
export const KittingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<KittingJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKittingJobs();
    setupRealtimeSubscription();
  }, [user]);

  const loadKittingJobs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kitting_jobs')
        .select(`
          *,
          orders(order_number, customer_name:delivery_address),
          kitting_components(
            id,
            component_product_id,
            quantity_needed,
            quantity_received,
            status,
            eta,
            partner_products(name)
          )
        `)
        .eq('partner_id', user.id)
        .in('status', ['awaiting_components', 'ready_to_kit', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Kitting jobs fetch failed, using mock:', error);
        // Mock data for development
        setJobs([
          {
            id: '1',
            order_id: 'ord1',
            order_number: '#WK-8742',
            customer_name: 'Rahul Enterprises',
            status: 'awaiting_components',
            total_units: 20,
            units_completed: 0,
            components_received_at: null,
            created_at: new Date().toISOString(),
            components: [
              {
                id: 'c1',
                name: 'Boat Rockerz Headphones',
                quantity_needed: 20,
                quantity_received: 20,
                status: 'delivered',
                eta: null,
              },
              {
                id: 'c2',
                name: 'Premium Chocolate Box',
                quantity_needed: 20,
                quantity_received: 15,
                status: 'shipped',
                eta: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              },
            ],
          },
        ]);
      } else {
        const formattedJobs = (data || []).map((job: any) => ({
          id: job.id,
          order_id: job.order_id,
          order_number: job.orders?.order_number || 'N/A',
          customer_name: job.orders?.customer_name || 'Customer',
          status: job.status,
          total_units: job.total_units,
          units_completed: job.units_completed,
          components_received_at: job.components_received_at,
          created_at: job.created_at,
          components: (job.kitting_components || []).map((kc: any) => ({
            id: kc.id,
            name: kc.partner_products?.name || 'Component',
            quantity_needed: kc.quantity_needed,
            quantity_received: kc.quantity_received,
            status: kc.status,
            eta: kc.eta,
          })),
        }));
        setJobs(formattedJobs);
      }
    } catch (error) {
      console.error('Load kitting jobs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('kitting-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kitting_components',
        },
        (payload) => {
          // Reload jobs when component status changes
          loadKittingJobs();
          
          const newStatus = (payload.new as any).status;
          if (newStatus === 'delivered') {
            toast({
              title: "Component Delivered! 📦",
              description: "A component for your kitting job has arrived",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      awaiting_components: { label: 'Awaiting Components', variant: 'secondary' },
      ready_to_kit: { label: 'Ready to Kit', variant: 'default' },
      in_progress: { label: 'In Progress', variant: 'default' },
      qc_pending: { label: 'QC Pending', variant: 'outline' },
      completed: { label: 'Completed', variant: 'default' },
      shipped: { label: 'Shipped', variant: 'default' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const allComponentsReceived = (job: KittingJob) => {
    return job.components.every(c => c.status === 'delivered');
  };

  const componentsProgress = (job: KittingJob) => {
    const total = job.components.reduce((sum, c) => sum + c.quantity_needed, 0);
    const received = job.components.reduce((sum, c) => sum + c.quantity_received, 0);
    return Math.round((received / total) * 100);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading kitting jobs...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Kitting Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Track component arrivals and manage hamper assembly
        </p>
      </div>

      {/* Active Jobs */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No active kitting jobs</h3>
              <p className="text-sm text-muted-foreground">
                Kitting jobs will appear here when customers order hampers
              </p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Order {job.order_number}
                      {getStatusBadge(job.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.customer_name} • {job.total_units} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="font-bold text-lg">
                      {job.units_completed}/{job.total_units}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Components Status */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Component Arrivals</p>
                    <p className="text-xs text-muted-foreground">
                      {componentsProgress(job)}% received
                    </p>
                  </div>
                  <Progress value={componentsProgress(job)} className="h-2 mb-3" />

                  <div className="space-y-2">
                    {job.components.map((component) => (
                      <div
                        key={component.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {component.status === 'delivered' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-600" />
                          )}
                          <span className="font-medium">{component.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {component.quantity_received}/{component.quantity_needed}
                          </span>
                          <Badge
                            variant={
                              component.status === 'delivered' ? 'default' :
                              component.status === 'shipped' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {component.status === 'delivered' ? 'Delivered ✓' :
                             component.status === 'shipped' ? 'In Transit' : 'Ordered'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {allComponentsReceived(job) ? (
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/partner/kitting/${job.id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {job.status === 'ready_to_kit' ? 'Start Kitting' : 'Continue Kitting'}
                    </Button>
                  ) : (
                    <Button className="w-full" disabled variant="outline">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Awaiting Components
                    </Button>
                  )}
                </div>

                {/* ETA Info */}
                {!allComponentsReceived(job) && (
                  <p className="text-xs text-center text-muted-foreground">
                    Expected components arrival in 2-3 days
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

