/**
 * Stock Alerts Dashboard Widget
 * Feature 3: PROMPT 10
 * Shows products with low stock (<50 units by default)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PackageX, AlertTriangle, Bell, BellOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { useStockAlerts } from "@/hooks/useStockAlerts";
import type { StockAlert } from "@/types/stockAlerts";

export const StockAlertsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    alerts: realtimeAlerts, 
    loading, 
    requestNotificationPermission,
    refresh 
  } = useStockAlerts(user?.id);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    // Check notification permission on mount
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
    setNotificationsEnabled(Notification.permission === 'granted');
  };

  // Convert real-time alerts to widget format
  const widgetAlerts = realtimeAlerts.map(alert => ({
    product_id: alert.id,
    product_name: alert.product_name,
    current_stock: alert.stock,
    threshold: alert.threshold,
    location: undefined,
    severity: alert.status === 'out' ? 'out_of_stock' as const : 
              alert.stock < 5 ? 'critical' as const : 
              'low' as const
  }));

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PackageX className="h-5 w-5" />
            Stock Alerts
            {widgetAlerts.length > 0 && (
              <Badge variant="destructive">
                {widgetAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnableNotifications}
            className="h-8 w-8 p-0"
            title={notificationsEnabled ? "Notifications enabled" : "Enable notifications"}
          >
            {notificationsEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {widgetAlerts.length === 0 ? (
          <div className="text-center py-6">
            <PackageX className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              All products are well-stocked
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {widgetAlerts.map(alert => (
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

        {widgetAlerts.length > 0 && (
          <div className="space-y-2 mt-4">
            <Button
              variant="link"
              className="w-full"
              onClick={() => navigate('/partner/products?filter=low-stock')}
            >
              View All Low Stock Products →
            </Button>
            {!notificationsEnabled && 'Notification' in window && (
              <p className="text-xs text-center text-muted-foreground">
                Click the bell icon to enable desktop notifications
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

