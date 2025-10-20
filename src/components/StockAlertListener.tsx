/**
 * Stock Alert Listener
 * Feature 3: PROMPT 10
 * Real-time Supabase subscriptions for stock changes
 * Triggers toast notifications when stock drops below threshold
 */

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const StockAlertListener = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Subscribe to product stock changes
    const channel = supabase
      .channel('stock-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partner_products',
          filter: `partner_id=eq.${user.id}`
        },
        (payload: any) => {
          const product = payload.new;
          const oldProduct = payload.old;

          // Only alert if stock decreased
          if (product.stock >= oldProduct?.stock) return;

          const threshold = product.stock_alert_threshold || 50;
          
          // Check if stock crossed threshold
          if (product.stock < threshold && product.stock > 0) {
            const severity = product.stock < 20 ? 'critical' : 'low';
            
            toast({
              title: severity === 'critical' ? "⚠️ Critical Stock Alert" : "⚡ Low Stock Alert",
              description: `${product.name}: Only ${product.stock} units left${product.location ? ` in ${product.location}` : ''}`,
              variant: severity === 'critical' ? 'destructive' : 'default',
              action: (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/partner/products')}
                >
                  Update Stock
                </Button>
              ),
              duration: 10000,
            });
          } 
          // Out of stock alert
          else if (product.stock === 0 && oldProduct?.stock > 0) {
            toast({
              title: "🚨 Out of Stock!",
              description: `${product.name} is now unavailable. Disable sourcing to prevent orders?`,
              variant: "destructive",
              action: (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleDisableSourcing(product.id, product.name)}
                  >
                    Yes, Disable
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/partner/products')}
                  >
                    Restock Now
                  </Button>
                </div>
              ),
              duration: 20000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDisableSourcing = async (productId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('partner_products')
        .update({ sourcing_available: false })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Sourcing Disabled",
        description: `${productName} removed from Component Marketplace`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to disable sourcing",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return null; // No UI, just listens
};

