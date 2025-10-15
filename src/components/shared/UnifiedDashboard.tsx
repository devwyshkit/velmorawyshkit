import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { 
  Package, 
  DollarSign, 
  Star, 
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Settings
} from "lucide-react";

// Unified dashboard component for all user roles
const UnifiedDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const role = user?.role || 'customer';

  // Generate role-specific stats
  const stats = useMemo(() => {
    const baseStats = {
      customer: [
        { id: 'orders', title: "Orders Placed", value: "12", change: "+3 this month", icon: ShoppingCart, color: "text-blue-600" },
        { id: 'saved', title: "Saved Items", value: "8", change: "+2 this week", icon: Star, color: "text-yellow-600" },
        { id: 'wishlist', title: "Wishlist Items", value: "24", change: "+5 this month", icon: Eye, color: "text-green-600" },
        { id: 'reviews', title: "Reviews Written", value: "7", change: "+1 this week", icon: Star, color: "text-purple-600" }
      ],
      seller: [
        { id: 'products', title: "Active Products", value: "42", change: "+5 this week", icon: Package, color: "text-blue-600" },
        { id: 'revenue', title: "Monthly Revenue", value: "₹1,24,567", change: "+12% this month", icon: DollarSign, color: "text-green-600" },
        { id: 'rating', title: "Average Rating", value: "4.6", change: "+0.2 this month", icon: Star, color: "text-yellow-600" },
        { id: 'orders', title: "Orders This Week", value: "89", change: "+23 from last week", icon: TrendingUp, color: "text-purple-600" }
      ],
      admin: [
        { id: 'users', title: "Total Users", value: "1,245", change: "+45 this week", icon: Users, color: "text-blue-600" },
        { id: 'vendors', title: "Active Vendors", value: "89", change: "+3 this week", icon: Package, color: "text-green-600" },
        { id: 'revenue', title: "Platform Revenue", value: "₹24,56,780", change: "+18% this month", icon: DollarSign, color: "text-yellow-600" },
        { id: 'orders', title: "Total Orders", value: "2,567", change: "+156 today", icon: ShoppingCart, color: "text-purple-600" }
      ],
      kam: [
        { id: 'accounts', title: "Managed Accounts", value: "12", change: "All active", icon: Users, color: "text-blue-600" },
        { id: 'revenue', title: "Portfolio Value", value: "₹45,67,890", change: "+23% this quarter", icon: DollarSign, color: "text-green-600" },
        { id: 'performance', title: "Avg Performance", value: "94%", change: "+2% this month", icon: TrendingUp, color: "text-yellow-600" },
        { id: 'growth', title: "Growth Rate", value: "15%", change: "Above target", icon: Star, color: "text-purple-600" }
      ]
    };
    return baseStats[role] || baseStats.customer;
  }, [role]);

  // Generate role-specific activities
  const activities = useMemo(() => {
    const baseActivities = {
      customer: [
        { id: '1', type: 'order', description: 'Order #WY001234 delivered', time: '2 hours ago', status: 'success' },
        { id: '2', type: 'review', description: 'Review posted for Bluetooth Speaker', time: '1 day ago', status: 'info' },
        { id: '3', type: 'saved', description: 'Added 3 items to wishlist', time: '2 days ago', status: 'info' }
      ],
      seller: [
        { id: '1', type: 'order', description: 'New order: Corporate T-Shirts (50 pcs)', time: '1 hour ago', status: 'pending' },
        { id: '2', type: 'product', description: 'Product approved: Coffee Mugs', time: '3 hours ago', status: 'success' },
        { id: '3', type: 'review', description: 'New 5-star review received', time: '5 hours ago', status: 'success' }
      ],
      admin: [
        { id: '1', type: 'vendor', description: 'New vendor registration: CraftStudio', time: '30 minutes ago', status: 'pending' },
        { id: '2', type: 'dispute', description: 'Order dispute resolved', time: '2 hours ago', status: 'success' },
        { id: '3', type: 'system', description: 'System backup completed', time: '4 hours ago', status: 'success' }
      ],
      kam: [
        { id: '1', type: 'meeting', description: 'Quarterly review with QuickGifts', time: '1 hour ago', status: 'success' },
        { id: '2', type: 'target', description: 'Monthly target achieved', time: '1 day ago', status: 'success' },
        { id: '3', type: 'account', description: 'New account onboarded', time: '2 days ago', status: 'info' }
      ]
    };
    return baseActivities[role] || baseActivities.customer;
  }, [role]);

  // Generate role-specific alerts
  const alerts = useMemo(() => {
    const baseAlerts = {
      customer: [
        { type: 'info', message: 'Your order #WY001234 is ready for pickup', action: 'View Order' },
        { type: 'warning', message: '2 items in your cart expire soon', action: 'Checkout Now' }
      ],
      seller: [
        { type: 'warning', message: 'Low stock: Corporate T-shirts (5 remaining)', action: 'Restock' },
        { type: 'info', message: 'New customer review pending response', action: 'Respond' }
      ],
      admin: [
        { type: 'warning', message: '3 vendors pending KYC verification', action: 'Review' },
        { type: 'error', message: 'System load at 85%', action: 'Monitor' }
      ],
      kam: [
        { type: 'info', message: 'Quarterly review due for QuickGifts', action: 'Schedule' },
        { type: 'warning', message: 'CraftStudio performance below target', action: 'Contact' }
      ]
    };
    return baseAlerts[role] || baseAlerts.customer;
  }, [role]);

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default' as const,
      pending: 'secondary' as const, 
      info: 'outline' as const,
      error: 'destructive' as const
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-screen-2xl mx-auto px-4 py-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            {role === 'customer' && "Discover amazing gifts for every occasion"}
            {role === 'seller' && "Manage your store and grow your business"}
            {role === 'admin' && "Monitor platform performance and user activity"}
            {role === 'kam' && "Track your portfolio and account performance"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.id} className="h-32 cursor-pointer hover:shadow-lg transition-shadow border border-border">
                <CardContent className="p-4 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                    <Badge variant="outline">
                      {stat.change.includes('+') ? '↗' : stat.change.includes('-') ? '↘' : '→'}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{stat.title}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <Card className="min-h-[400px] border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {role === 'customer' ? 'Recent Activity' : 
                   role === 'seller' ? 'Recent Orders' : 
                   role === 'admin' ? 'Platform Activity' : 'Account Activity'}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/${role === 'seller' ? 'seller/' : ''}orders`)}
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {activities.map((activity) => (
                  <Card 
                    key={activity.id} 
                    className="p-4 cursor-pointer hover:shadow-sm transition-shadow border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alerts */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle>
                  {role === 'customer' ? 'Notifications' :
                   role === 'seller' ? 'Inventory Alerts' :
                   role === 'admin' ? 'System Alerts' : 'Account Updates'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert, index) => (
                  <Card 
                    key={index}
                    className="p-3 cursor-pointer bg-orange-50 border-orange-200"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {alert.message}
                        </p>
                        <Button variant="ghost" size="sm" className="h-auto p-0 mt-2 text-primary">
                          {alert.action}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {role === 'customer' && (
                  <>
                    <Button className="w-full justify-start" onClick={() => navigate('/search')}>
                      <Package className="h-4 w-4 mr-2" />
                      Browse Gifts
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/orders')}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      My Orders
                    </Button>
                  </>
                )}
                {role === 'seller' && (
                  <>
                    <Button className="w-full justify-start" onClick={() => navigate('/seller/products')}>
                      <Package className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/seller/orders')}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Manage Orders
                    </Button>
                  </>
                )}
                {role === 'admin' && (
                  <>
                    <Button className="w-full justify-start" onClick={() => navigate('/admin/vendor-management')}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Vendors
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/analytics')}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                  </>
                )}
                {role === 'kam' && (
                  <>
                    <Button className="w-full justify-start" onClick={() => navigate('/kam/vendors')}>
                      <Users className="h-4 w-4 mr-2" />
                      Account Portfolio
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/kam/analytics')}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Performance Reports
                    </Button>
                  </>
                )}
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/role-switcher')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Switch Role
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnifiedDashboard;