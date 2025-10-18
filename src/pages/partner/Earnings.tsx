/**
 * Partner Earnings Page
 * Swiggy-style payout tracking with mobile-first cards
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  fetchPartnerEarnings,
  type PartnerEarnings,
} from '@/lib/integrations/supabase-data';
import { supabase } from '@/lib/integrations/supabase-client';

export const Earnings = () => {
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<PartnerEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
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
        const fetchedEarnings = await fetchPartnerEarnings(profile.id);
        setEarnings(fetchedEarnings);
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
      toast({ title: 'Error loading earnings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalEarnings = earnings.reduce((sum, e) => sum + e.net_earnings, 0);
  const pendingPayouts = earnings.filter((e) => e.payout_status === 'pending').reduce((sum, e) => sum + e.net_earnings, 0);
  const paidOut = earnings.filter((e) => e.payout_status === 'paid').reduce((sum, e) => sum + e.net_earnings, 0);

  const getPayoutStatusBadge = (status: string) => {
    const badges = {
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      processing: { variant: 'default' as const, label: 'Processing', icon: TrendingUp },
      paid: { variant: 'outline' as const, label: 'Paid', icon: CheckCircle },
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

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-sm text-muted-foreground">Track your payouts</p>
      </div>

      {/* Summary Cards (mobile: 1 col, tablet: 3 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalEarnings / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pending Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{(pendingPayouts / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">To be paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{(paidOut / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Tabs (Zomato pattern: Today/Week/Month) */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="space-y-4 mt-4">
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">₹0</p>
                <p className="text-sm text-muted-foreground">No orders today yet</p>
              </div>
            </TabsContent>

            <TabsContent value="week" className="space-y-4 mt-4">
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">₹0</p>
                <p className="text-sm text-muted-foreground">No orders this week yet</p>
              </div>
            </TabsContent>

            <TabsContent value="month" className="space-y-4 mt-4">
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">₹0</p>
                <p className="text-sm text-muted-foreground">No orders this month yet</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No earnings yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start receiving orders to see your earnings here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {new Date(earning.year, earning.month - 1).toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Sales: ₹{(earning.total_sales / 100).toLocaleString()}</span>
                      <span>•</span>
                      <span>Fee: ₹{(earning.commission_amount / 100).toLocaleString()}</span>
                    </div>
                    {earning.payout_date && (
                      <p className="text-xs text-muted-foreground">
                        Paid on: {new Date(earning.payout_date).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-2">
                    <p className="text-lg font-bold">₹{(earning.net_earnings / 100).toLocaleString()}</p>
                    {getPayoutStatusBadge(earning.payout_status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm">
            <span className="font-semibold">Platform Fee:</span> 15% commission on all orders
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Payouts are processed monthly via Razorpay to your registered bank account
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

