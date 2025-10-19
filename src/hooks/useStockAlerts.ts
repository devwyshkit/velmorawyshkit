/**
 * Stock Alerts Hook
 * Supabase real-time subscription for stock changes
 * Triggers toast notifications on low stock
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/integrations/supabase-client';
import { StockAlert } from '@/types/stockAlerts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const useStockAlerts = (partnerId?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const currentPartnerId = partnerId || user?.id;

  // Fetch initial low stock products
  useEffect(() => {
    const fetchLowStock = async () => {
      if (!currentPartnerId) return;

      setLoading(true);
      try {
        // Note: This query will work once stock_alert_threshold column is added
        const { data, error } = await supabase
          .from('partner_products')
          .select('id, name, stock')
          .eq('partner_id', currentPartnerId)
          .lt('stock', 50) // Using hardcoded threshold for now
          .order('stock', { ascending: true })
          .limit(5);

        if (error) {
          console.warn('Stock alerts fetch failed:', error);
          setAlerts([]);
        } else {
          const stockAlerts: StockAlert[] = (data || []).map(p => ({
            product_id: p.id,
            product_name: p.name,
            current_stock: p.stock,
            threshold: 50, // Default threshold
            severity: p.stock === 0 ? 'out_of_stock' : p.stock < 20 ? 'critical' : 'low'
          }));
          setAlerts(stockAlerts);
        }
      } catch (error) {
        console.error('Stock alerts error:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStock();
  }, [currentPartnerId]);

  // Real-time subscription for stock changes
  useEffect(() => {
    if (!currentPartnerId) return;

    const channel = supabase
      .channel('stock-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partner_products',
          filter: `partner_id=eq.${currentPartnerId}`
        },
        (payload) => {
          const product = payload.new as { id: string; name: string; stock: number; };
          const threshold = 50; // Default threshold

          // Show toast notification based on severity
          if (product.stock < threshold && product.stock > 0) {
            const severity = product.stock < 20 ? 'critical' : 'low';
            const variant = severity === 'critical' ? 'destructive' : 'default';

            toast({
              title: severity === 'critical' ? "Critical Stock Alert" : "Low Stock Alert",
              description: `${product.name}: Only ${product.stock} units left`,
              variant,
              duration: 10000,
            });
          } else if (product.stock === 0) {
            toast({
              title: "Out of Stock!",
              description: `${product.name} is now unavailable`,
              variant: "destructive",
              duration: 15000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPartnerId, toast]);

  return { alerts, loading };
};

