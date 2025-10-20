/**
 * Stock Alerts Dashboard Widget
 * Feature 3: PROMPT 10
 * Shows products with low stock (<50 units by default)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PackageX, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import type { StockAlert } from "@/types/stockAlerts";

export const StockAlertsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLowStockProducts();
    }
  }, [user]);

  const fetchLowStockProducts = async () => {
    if (!user) return;

    try {
      // Fetch products where stock < threshold
      const { data, error } = await supabase
        .from('partner_products')
        .select('id, name, stock, stock_alert_threshold, location')
        .eq('partner_id', user.id)
        .order('stock', { ascending: true })
        .limit(5);

      if (error) throw error;

      if (data) {
        const lowStockProducts = data
          .filter(p => p.stock < (p.stock_alert_threshold || 50))
          .map(p => ({
            product_id: p.id,
            product_name: p.name,
            current_stock: p.stock,
            threshold: p.stock_alert_threshold || 50,
            location: p.location,
            severity: (
              p.stock === 0 ? 'out_of_stock' :
              p.stock < 20 ? 'critical' :
              'low'
            ) as 'low' | 'critical' | 'out_of_stock'
          }));

        setAlerts(lowStockProducts);
      }
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: 'low' | 'critical' | 'out_of_stock') => {
    switch (severity) {
      case 'out_of_stock':
        return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Low</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PackageX className="h-5 w-5" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PackageX className="h-5 w-5" />
          Stock Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <PackageX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              All products are well-stocked
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div 
                key={alert.product_id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{alert.product_name}</p>
                    {alert.severity === 'critical' && (
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.current_stock} unit{alert.current_stock !== 1 ? 's' : ''} left
                    {alert.location && ` • ${alert.location}`}
                  </p>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {getSeverityBadge(alert.severity)}
                </div>
              </div>
            ))}
          </div>
        )}

        {alerts.length > 0 && (
          <Button
            variant="link"
            className="w-full mt-4"
            onClick={() => navigate('/partner/products?filter=low-stock')}
          >
            View All Low Stock Products →
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

