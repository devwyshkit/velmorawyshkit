import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign,
  ShoppingBag,
  Users,
  AlertCircle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/shared/StatsCard";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  gmvToday: number;
  ordersToday: number;
  activePartners: number;
  pendingApprovals: number;
  openDisputes: number;
  escalatedDisputes: number;
  duePayouts: number;
}

/**
 * Admin Dashboard
 * Overview metrics and quick actions
 * Real-time updates via Supabase subscriptions
 * Following Swiggy/Zomato ops dashboard pattern
 */
export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    gmvToday: 0,
    ordersToday: 0,
    activePartners: 0,
    pendingApprovals: 0,
    openDisputes: 0,
    escalatedDisputes: 0,
    duePayouts: 0,
  });

  useEffect(() => {
    loadDashboardStats();
    
    // Setup real-time subscriptions
    const ordersChannel = supabase
      .channel('admin-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        toast({
          title: "New Order!",
          description: `Order #${payload.new.order_number} placed`,
          duration: 5000,
        });
        loadDashboardStats(); // Refresh stats
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];

      // Parallel queries for performance
      const [ordersResult, partnersResult, disputesResult, payoutsResult] = await Promise.all([
        // Today's orders
        supabase
          .from('orders')
          .select('total')
          .gte('created_at', today)
          .eq('status', 'completed'),
        
        // Partner stats
        supabase
          .from('partners')
          .select('status')
          .eq('is_active', true),
        
        // Disputes
        supabase
          .from('disputes')
          .select('status')
          .eq('status', 'open'),
        
        // Due payouts (mock for now)
        Promise.resolve({ data: [], count: 120 }),
      ]);

      const gmv = ordersResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const activePartners = partnersResult.data?.filter(p => p.status === 'approved').length || 0;
      const pendingApprovals = partnersResult.data?.filter(p => p.status === 'pending').length || 0;

      setStats({
        gmvToday: gmv,
        ordersToday: ordersResult.data?.length || 0,
        activePartners,
        pendingApprovals,
        openDisputes: disputesResult.data?.length || 0,
        escalatedDisputes: 5, // Mock - would calculate >48 hours
        duePayouts: payoutsResult.count || 120,
      });
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      
      // Use mock data for development
      setStats({
        gmvToday: 1250000000, // ₹12.5 Cr
        ordersToday: 45230,
        activePartners: 1250,
        pendingApprovals: 18,
        openDisputes: 23,
        escalatedDisputes: 5,
        duePayouts: 120,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48 md:h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Page Header - Responsive sizing */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stats Cards - Mobile First: 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title="GMV Today"
          value={`₹${(stats.gmvToday / 10000000).toFixed(1)} Cr`}
          icon={DollarSign}
          trend="+15% from yesterday"
          trendDirection="up"
        />
        <StatsCard
          title="Orders Today"
          value={stats.ordersToday.toLocaleString('en-IN')}
          icon={ShoppingBag}
          trend="+8% from yesterday"
          trendDirection="up"
        />
        <StatsCard
          title="Active Partners"
          value={stats.activePartners.toLocaleString('en-IN')}
          icon={Users}
          trend={`${stats.pendingApprovals} pending approval`}
        />
        <StatsCard
          title="Open Disputes"
          value={stats.openDisputes}
          icon={AlertCircle}
          trend={`${stats.escalatedDisputes} escalated`}
          trendDirection={stats.escalatedDisputes > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Quick Action Cards - Mobile First: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Pending Partner Approvals */}
        {stats.pendingApprovals > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/partners")}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pending Approvals</CardTitle>
                <Badge variant="destructive">{stats.pendingApprovals}</Badge>
          </div>
        </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {stats.pendingApprovals} partners awaiting review
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2">
                Review Queue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Escalated Disputes */}
        {stats.escalatedDisputes > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-destructive/50" onClick={() => navigate("/admin/disputes")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Escalated Disputes</CardTitle>
                <Badge variant="destructive">{stats.escalatedDisputes}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Disputes unresolved for &gt;48 hours
              </p>
              <Button variant="destructive" size="sm" className="w-full gap-2">
                Review Now
                <ArrowRight className="h-4 w-4" />
                </Button>
            </CardContent>
          </Card>
        )}

        {/* Due Payouts */}
        {stats.duePayouts > 0 && (
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/payouts")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Due Payouts</CardTitle>
                <Badge>{stats.duePayouts}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Partners ready for payout cycle
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2">
                Process Payouts
                <ArrowRight className="h-4 w-4" />
              </Button>
        </CardContent>
      </Card>
        )}
      </div>

      {/* Revenue Trend Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
              Chart will be added with recharts library
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="shrink-0">10:45 AM</Badge>
              <span className="text-muted-foreground">New partner signup:</span>
              <span className="font-medium">GiftCraft (pending approval)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="outline" className="shrink-0">10:30 AM</Badge>
              <span className="text-muted-foreground">Order completed:</span>
              <span className="font-medium">#ORD-12350 (₹6,249)</span>
                </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="destructive" className="shrink-0">10:15 AM</Badge>
              <span className="text-muted-foreground">Dispute escalated:</span>
              <span className="font-medium">#DSP-456 (&gt;48 hours)</span>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

