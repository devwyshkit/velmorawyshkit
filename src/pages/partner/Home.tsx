/**
 * Partner Home / Overview Page
 * Swiggy-style stats with mobile-first cards (reuses customer UI Card component)
 * Same color system and spacing
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, DollarSign, Star, Power } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export const Home = () => {
  // TODO: Fetch real stats from Supabase
  const stats = {
    orders: { count: 156, label: 'This month' },
    earnings: { amount: 45200, label: 'Net payout' },
    rating: { value: 4.6, reviews: 234 },
    acceptance: { rate: 95, label: 'Last 30 days' },
  };

  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="p-4 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back!</p>
        </div>

        {/* Operating Hours Toggle (Swiggy/Zomato pattern) */}
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Power className={`h-5 w-5 ${isOpen ? 'text-green-600' : 'text-muted-foreground'}`} />
          <div className="flex flex-col gap-1">
            <Label htmlFor="store-open" className="text-sm font-medium cursor-pointer">
              Store Status
            </Label>
            <div className="flex items-center gap-2">
              <Switch
                id="store-open"
                checked={isOpen}
                onCheckedChange={setIsOpen}
              />
              <Badge variant={isOpen ? "default" : "secondary"} className="text-xs">
                {isOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid (mobile: 2 cols, desktop: 4 cols) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.count}</div>
            <p className="text-xs text-muted-foreground">{stats.orders.label}</p>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.earnings.amount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.earnings.label}</p>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating.value}</div>
            <p className="text-xs text-muted-foreground">{stats.rating.reviews} reviews</p>
          </CardContent>
        </Card>

        {/* Acceptance Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Acceptance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptance.rate}%</div>
            <p className="text-xs text-muted-foreground">{stats.acceptance.label}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your recent orders will appear here once you start receiving orders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

