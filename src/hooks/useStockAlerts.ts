/**
 * Stock Alerts Hook
 * Real-time stock monitoring with Supabase subscriptions
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/integrations/supabase-client';
import { useToast } from '@/hooks/use-toast';

interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  stock: number;
  threshold: number;
  status: 'low' | 'out';
}

export const useStockAlerts = (partnerId: string | undefined) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) return;

    // Initial load
    loadStockAlerts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('stock-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partner_products',
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          const product = payload.new as any;
          
          // Check if stock is low or out
          if (product.stock <= 0) {
            handleStockAlert({
              id: product.id,
              product_name: product.name,
              stock: product.stock,
              threshold: 10,
              status: 'out',
            });
          } else if (product.stock < 10) {
            handleStockAlert({
              id: product.id,
              product_name: product.name,
              stock: product.stock,
              threshold: 10,
              status: 'low',
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [partnerId]);

  const loadStockAlerts = async () => {
    if (!partnerId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_products')
        .select('id, name, stock')
        .eq('partner_id', partnerId)
        .lte('stock', 10)
        .order('stock', { ascending: true });

      if (error) throw error;

      const alertsData = (data || []).map(p => ({
        id: p.id,
        product_id: p.id,
        product_name: p.name,
        stock: p.stock,
        threshold: 10,
        status: p.stock === 0 ? 'out' as const : 'low' as const,
      }));

      setAlerts(alertsData);
    } catch (error) {
      console.error('Load stock alerts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAlert = (alert: Omit<StockAlert, 'product_id'>) => {
    // Update alerts state
    setAlerts(prev => {
      const existing = prev.find(a => a.id === alert.id);
      if (existing) {
        return prev.map(a => a.id === alert.id ? { ...a, ...alert, product_id: a.product_id } : a);
      }
      return [...prev, { ...alert, product_id: alert.id }];
    });

    // Show toast notification
    toast({
      title: alert.status === 'out' ? '🔴 Out of Stock!' : '🟡 Low Stock Alert',
      description: `${alert.product_name}: ${alert.stock} units remaining`,
      duration: 5000,
    });

    // Desktop notification (if permitted)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Stock Alert - Wyshkit', {
        body: `${alert.product_name}: ${alert.stock} units remaining`,
        icon: '/wyshkit-logo.png',
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: "You'll receive alerts for low stock items",
        });
      }
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  return {
    alerts,
    loading,
    requestNotificationPermission,
    dismissAlert,
    refresh: loadStockAlerts,
  };
};

