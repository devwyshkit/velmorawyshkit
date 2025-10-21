/**
 * KAM Dashboard Widget
 * Shows KAM user's assigned partners and targets
 * Only visible for users with is_kam = true
 */

import { useState, useEffect } from "react";
import { Users, TrendingUp, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/integrations/supabase-client";

interface KAMStats {
  assigned_partners: number;
  target_partners: number;
  monthly_revenue: number;
  target_revenue: number;
  upcoming_followups: number;
  calls_this_week: number;
}

interface KAMWidgetProps {
  kamId: string;
  kamName: string;
}

export const KAMWidget = ({ kamId, kamName }: KAMWidgetProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<KAMStats>({
    assigned_partners: 0,
    target_partners: 10,
    monthly_revenue: 0,
    target_revenue: 5000000,
    upcoming_followups: 0,
    calls_this_week: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKAMStats();
  }, [kamId]);

  const loadKAMStats = async () => {
    setLoading(true);
    try {
      // Fetch KAM assignments count
      const { data: assignments, error: assignError } = await supabase
        .from('kam_partner_assignments')
        .select('partner_id, partner_profiles(total_revenue)')
        .eq('kam_id', kamId)
        .eq('is_active', true);

      if (!assignError && assignments) {
        const monthlyRevenue = assignments.reduce((sum, a: any) => 
          sum + (a.partner_profiles?.total_revenue || 0), 0);

        // Fetch upcoming followups
        const { data: followups } = await supabase
          .from('kam_activities')
          .select('id')
          .eq('kam_id', kamId)
          .gte('next_followup', new Date().toISOString().split('T')[0])
          .not('next_followup', 'is', null);

        // Fetch calls this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
        const { data: calls } = await supabase
          .from('kam_activities')
          .select('id')
          .eq('kam_id', kamId)
          .eq('activity_type', 'call')
          .gte('created_at', weekStart.toISOString());

        // Fetch KAM targets
        const { data: kamUser } = await supabase
          .from('admin_users')
          .select('kam_monthly_target')
          .eq('id', kamId)
          .single();

        const targets = kamUser?.kam_monthly_target || { partners: 10, revenue: 5000000 };

        setStats({
          assigned_partners: assignments.length,
          target_partners: targets.partners,
          monthly_revenue: monthlyRevenue,
          target_revenue: targets.revenue,
          upcoming_followups: followups?.length || 0,
          calls_this_week: calls?.length || 0,
        });
      }
    } catch (error) {
      console.error('Load KAM stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const partnerProgress = (stats.assigned_partners / stats.target_partners) * 100;
  const revenueProgress = (stats.monthly_revenue / stats.target_revenue) * 100;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Loading KAM dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          👤 My KAM Dashboard
          <Badge variant="secondary" className="text-xs">{kamName}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Partner Target */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Partner Target</span>
            </div>
            <span className="text-sm font-semibold">
              {stats.assigned_partners} / {stats.target_partners}
            </span>
          </div>
          <Progress value={partnerProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {partnerProgress.toFixed(0)}% of monthly target
          </p>
        </div>

        {/* Revenue Target */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Revenue Target</span>
            </div>
            <span className="text-sm font-semibold">
              ₹{(stats.monthly_revenue / 100).toLocaleString('en-IN')} / ₹{(stats.target_revenue / 100).toLocaleString('en-IN')}
            </span>
          </div>
          <Progress value={revenueProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {revenueProgress.toFixed(0)}% of monthly target
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-2xl font-bold">{stats.calls_this_week}</p>
            <p className="text-xs text-muted-foreground">Calls this week</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="text-2xl font-bold">{stats.upcoming_followups}</p>
            <p className="text-xs text-muted-foreground">Upcoming followups</p>
          </div>
        </div>

        {/* View All Button */}
        <Button
          variant="link"
          className="w-full"
          onClick={() => navigate('/admin/partners?filter=my-assigned')}
        >
          View My Assigned Partners →
        </Button>
      </CardContent>
    </Card>
  );
};

