/**
 * Dispute Resolution Page
 * Feature 9: PROMPT 2
 * Handle customer complaints and disputes
 */

import { useState, useEffect } from "react";
import { AlertCircle, MessageCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { Dispute, DisputeStats } from "@/types/disputes";

export const DisputeResolution = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats>({
    open_count: 0,
    avg_resolution_time_hours: 0,
    resolution_rate: 0,
    common_issues: [],
  });

  useEffect(() => {
    if (user) {
      loadDisputes();
    }
  }, [user]);

  const loadDisputes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('partner_id', user.id)
        .order('reported_at', { ascending: false });

      if (error) {
        console.warn('Disputes fetch failed:', error);
        setDisputes([]);
      } else {
        setDisputes(data || []);
      }
    } catch (error) {
      console.error('Load disputes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Dispute['status']) => {
    const variants = {
      open: { variant: 'default' as const, label: '🟡 Open' },
      resolved: { variant: 'secondary' as const, label: '🟢 Resolved' },
      escalated: { variant: 'destructive' as const, label: '🔴 Escalated' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispute Resolution</h1>
        <p className="text-muted-foreground">
          Handle customer complaints and resolve issues within 48 hours
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{stats.open_count}</p>
            <p className="text-sm text-muted-foreground">Open Disputes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.resolution_rate}%</p>
            <p className="text-sm text-muted-foreground">Resolution Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.avg_resolution_time_hours}h</p>
            <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State or Disputes List */}
      {disputes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No active disputes</h3>
            <p className="text-sm text-muted-foreground">
              Great job! You have no pending customer complaints.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {disputes.map(dispute => (
            <Card key={dispute.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">Order #{dispute.order_number}</p>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{dispute.customer_name}</p>
                    <p className="text-sm line-clamp-2">{dispute.issue}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

