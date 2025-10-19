/**
 * Stock Alerts Dashboard Widget
 * Shows low stock products with quick actions
 * Swiggy/Zomato pattern: Kitchen inventory alerts (15% loss prevention)
 */

import { useNavigate } from "react-router-dom";
import { PackageX, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockAlerts } from "@/hooks/useStockAlerts";

export const StockAlertsWidget = () => {
  const navigate = useNavigate();
  const { alerts, loading } = useStockAlerts();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageX className="h-5 w-5" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageX className="h-5 w-5" />
          Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              All products are well-stocked
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.product_id} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{alert.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.current_stock} units
                    {alert.location && ` • ${alert.location}`}
                  </p>
                </div>
                <Badge 
                  variant={alert.severity === 'out_of_stock' || alert.severity === 'critical' ? 'destructive' : 'default'}
                  className="shrink-0"
                >
                  {alert.severity === 'out_of_stock' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Out of Stock
                    </>
                  ) : alert.severity === 'critical' ? (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Critical
                    </>
                  ) : (
                    'Low'
                  )}
                </Badge>
              </div>
            ))}

            <Button 
              variant="link" 
              className="w-full mt-2 p-0 h-auto text-primary"
              onClick={() => navigate('/partner/products?filter=low-stock')}
            >
              View All Low Stock →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

