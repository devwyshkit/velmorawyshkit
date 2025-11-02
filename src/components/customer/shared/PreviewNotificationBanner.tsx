import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/integrations/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export const PreviewNotificationBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [previewReadyOrders, setPreviewReadyOrders] = useState<Array<{
    orderId: string;
    orderNumber?: string;
    itemName?: string;
  }>>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user && !localStorage.getItem('mock_session')) return;

    const checkPreviewStatus = async () => {
      try {
        // Fetch all orders with preview_ready items
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(`
            id,
            preview_status,
            order_id,
            orders!inner (
              id,
              order_number,
              customer_id
            ),
            store_items!inner (
              name
            )
          `)
          .eq('preview_status', 'preview_ready');

        if (error) {
          console.error('Error fetching preview ready items:', error);
          return;
        }

        if (orderItems && orderItems.length > 0) {
          // Filter by current user's orders
          const userOrders = orderItems.filter((item: any) => 
            item.orders?.customer_id === user?.id || 
            localStorage.getItem('mock_session') // Include mock users
          );

          const uniqueOrders = Array.from(
            new Map(
              userOrders.map((item: any) => [
                item.order_id,
                {
                  orderId: item.order_id,
                  orderNumber: item.orders?.order_number,
                  itemName: item.store_items?.name,
                }
              ])
            ).values()
          );

          setPreviewReadyOrders(uniqueOrders as any[]);
          setIsVisible(uniqueOrders.length > 0);
        } else {
          setPreviewReadyOrders([]);
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking preview status:', error);
      }
    };

    checkPreviewStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('preview-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_items',
          filter: 'preview_status=eq.preview_ready',
        },
        (payload) => {
          checkPreviewStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!isVisible || previewReadyOrders.length === 0) return null;

  const handleReviewClick = () => {
    if (previewReadyOrders.length > 0) {
      navigate(RouteMap.preview(previewReadyOrders[0].orderId));
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg",
      "animate-in slide-in-from-top duration-300"
    )}>
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <ImageIcon className="h-5 w-5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                Preview Ready {previewReadyOrders.length > 1 && `(${previewReadyOrders.length})`}
              </p>
              <p className="text-xs opacity-90">
                {previewReadyOrders.length === 1 
                  ? `Your design preview for ${previewReadyOrders[0].itemName || 'your order'} is ready`
                  : `${previewReadyOrders.length} design previews are ready for review`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReviewClick}
              className="h-8"
            >
              Review Now
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

