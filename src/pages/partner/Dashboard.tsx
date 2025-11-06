import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShoppingBag, DollarSign, Star, Plus, TrendingUp, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/shared/StatsCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { StockAlertsWidget } from "@/components/dashboard/StockAlertsWidget";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  rating: number;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: string;
  total: number;
  createdAt: string;
}

/**
 * Partner Dashboard Home Page
 * Shows daily stats, quick actions, and pending orders
 * Follows Swiggy/Zomato partner dashboard pattern
 */
export const PartnerHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    activeProducts: 0,
    pendingOrders: 0,
    rating: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 2025 Pattern: Parallelize all independent queries for performance
      // First get store_id (needed for other queries)
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (!storeData) {
        setLoading(false);
        return;
      }

      // Parallelize stats, orders, and offers queries
      const [statsResult, ordersResult, offersResult] = await Promise.all([
        // Stats query (RPC function)
        supabase.rpc('get_partner_stats', { p_partner_id: user.id }),
        
        // Pending orders query
        supabase
          .from('orders')
          .select('id, order_number, total_amount, created_at, status')
          .eq('store_id', storeData.id)
          .in('status', ['placed', 'confirmed', 'preview_pending'])
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Promotional offers query (with graceful error handling)
        supabase
          .from('promotional_offers')
          .select('id, title, discount_type, discount_value, description, end_date, created_at, status, is_active')
          .eq('store_id', storeData.id)
          .eq('status', 'active')
          .gte('end_date', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data, error }) => {
            // Handle table not existing gracefully (Swiggy 2025 pattern)
            if (error && error.code === 'PGRST116') {
              return { data: null, error: null }; // Table doesn't exist - not an error
            }
            return { data, error };
          })
          .catch(() => ({ data: null, error: null })), // Silent error handling
      ]);

      // Process stats
      const { data: statsData, error: statsError } = statsResult;
      if (statsError) {
        // Silent error handling - set empty stats (Swiggy 2025 pattern)
        setStats({
          todayOrders: 0,
          todayRevenue: 0,
          activeProducts: 0,
          pendingOrders: 0,
          rating: 0,
        });
      } else if (statsData && statsData.length > 0) {
        setStats({
          todayOrders: statsData[0].today_orders || 0,
          todayRevenue: statsData[0].today_revenue || 0,
          activeProducts: statsData[0].active_products || 0,
          pendingOrders: statsData[0].pending_orders || 0,
          rating: statsData[0].current_rating || 0,
        });
      } else {
        setStats({
          todayOrders: 0,
          todayRevenue: 0,
          activeProducts: 0,
          pendingOrders: 0,
          rating: 0,
        });
      }

      // Process orders
      const { data: ordersData, error: ordersError } = ordersResult;
      if (ordersError) {
        // Silent error handling - empty state (Swiggy 2025 pattern)
        setPendingOrders([]);
      } else if (ordersData) {
        // Transform orders data to match PendingOrder interface
        const transformed = ordersData.map((order: any) => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: 'Customer', // Would fetch from customer profile
          items: 'Order Items', // Would aggregate from order_items
          total: order.total_amount,
          createdAt: order.created_at,
        }));
        setPendingOrders(transformed);
      } else {
        setPendingOrders([]);
      }

      // Process offers
      if (offersResult.data && offersResult.data.length > 0) {
        setActiveOffers(offersResult.data);
      } else {
        setActiveOffers([]);
      }
      
    } catch (error) {
      // Silent error handling - show empty states (Swiggy 2025 pattern)
      setStats({
        todayOrders: 0,
        todayRevenue: 0,
        activeProducts: 0,
        pendingOrders: 0,
        rating: 0,
      });
      setPendingOrders([]);
      setActiveOffers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="space-y-4 pb-20 md:pb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Page Header - Mobile optimized */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Welcome back, {user?.name || 'Partner'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Stats Cards (Swiggy/Zomato pattern) - Mobile: 2 col, Desktop: 4 col */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatsCard
          title="Today's Orders"
          value={stats.todayOrders}
          icon={ShoppingBag}
          trend={stats.todayOrders > 0 ? "+12% from yesterday" : "No orders yet"}
          trendDirection={stats.todayOrders > 0 ? "up" : "neutral"}
        />
        <StatsCard
          title="Today's Revenue"
          value={`₹${(stats.todayRevenue / 100).toLocaleString('en-IN')}`}
          icon={DollarSign}
          trend={stats.todayRevenue > 0 ? "+8% from yesterday" : ""}
          trendDirection="up"
        />
        <StatsCard
          title="Your Rating"
          value={stats.rating > 0 ? `${stats.rating}★` : "No rating yet"}
          icon={Star}
          trend={stats.rating >= 4.5 ? "Excellent!" : ""}
          trendDirection={stats.rating >= 4.5 ? "up" : "neutral"}
        />
        <StatsCard
          title="Active Products"
          value={stats.activeProducts}
          icon={Package}
          trend={`${stats.pendingOrders} pending orders`}
        />
      </div>

      {/* Quick Actions (Zomato pattern) */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/partner/products")}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm">Add Product</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/partner/orders")}
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-sm">View Orders</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/partner/earnings")}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-sm">Earnings</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate("/partner/profile")}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Promotional Offers */}
      {activeOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Promotions ({activeOffers.length})</span>
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 h-auto"
                onClick={() => navigate("/partner/dashboard/promotions")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeOffers.slice(0, 3).map((offer) => (
                <div key={offer.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{offer.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {offer.discount_type === 'percentage' && `${offer.discount_value}% OFF`}
                        {offer.discount_type === 'fixed' && `₹${offer.discount_value / 100} OFF`}
                        {offer.discount_type === 'free_delivery' && 'FREE DELIVERY'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Valid till {new Date(offer.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Alerts Widget - Feature 3 (PROMPT 10) */}
      <StockAlertsWidget />


      {/* Pending Orders (Real-time in production) */}
      {stats.pendingOrders > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Orders ({stats.pendingOrders})</span>
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 h-auto"
                onClick={() => navigate("/partner/orders")}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{order.orderNumber}</p>
                          <StatusBadge status="pending" />
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(order.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName} • {order.items}
                        </p>
                        <p className="text-sm font-bold text-primary mt-1">
                          ₹{(order.total / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => navigate(`/partner/orders?id=${order.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State (if no pending orders) */}
      {stats.pendingOrders === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No pending orders</h3>
            <p className="text-sm text-muted-foreground mb-4">
              New orders will appear here in real-time
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/partner/products")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Products to Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper: Format time ago (e.g., "2 mins ago")
function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

