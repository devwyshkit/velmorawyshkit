/**
 * Returns & Refunds Page
 * Feature 10: PROMPT 3
 * Handle customer return requests
 */

import { useState, useEffect } from "react";
import { PackageX, Truck, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReturnDetail } from "@/components/returns/ReturnDetail";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { Return } from "@/types/returns";

export const Returns = () => {
  const { user } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  useEffect(() => {
    if (user) loadReturns();
  }, [user]);

  const loadReturns = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('partner_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error) {
      console.error('Load returns error:', error);
    }
  };

  const getStatusBadge = (status: Return['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: '🟡 Pending' },
      approved: { variant: 'default' as const, label: '🟢 Approved' },
      rejected: { variant: 'destructive' as const, label: '🔴 Rejected' },
      pickup_scheduled: { variant: 'default' as const, label: 'Pickup Scheduled' },
      refunded: { variant: 'default' as const, label: '✅ Refunded' },
    };
    return <Badge variant={variants[status]?.variant || 'secondary'}>{variants[status]?.label || status}</Badge>;
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Returns & Refunds</h1>
        <p className="text-muted-foreground">Manage customer return requests</p>
      </div>

      {returns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <PackageX className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No return requests</h3>
            <p className="text-sm text-muted-foreground">Customer return requests will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {returns.map(ret => (
            <Card key={ret.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{ret.customer_name}</p>
                      {getStatusBadge(ret.status)}
                    </div>
                  <p className="text-sm text-muted-foreground">{ret.product_name}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedReturn(ret)}
                >
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}

    {/* Return Detail Sheet */}
    {selectedReturn && (
      <ReturnDetail
        returnRequest={selectedReturn}
        onClose={() => setSelectedReturn(null)}
        onSuccess={() => {
          setSelectedReturn(null);
          loadReturns();
        }}
      />
    )}
  </div>
);
};

