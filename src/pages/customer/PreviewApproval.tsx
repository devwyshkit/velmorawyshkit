import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PreviewApprovalSheet } from '@/components/customer/shared/PreviewApprovalSheet';
import { RouteMap } from '@/routes';
import { supabase } from '@/lib/integrations/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export const PreviewApproval = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [orderItemData, setOrderItemData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      if (!orderId || !user) return;

      try {
        // Fetch order item with preview status 'preview_ready'
        const { data, error } = await supabase
          .from('order_items')
          .select(`
            *,
            orders (
              id,
              order_number,
              status,
              scheduled_date
            )
          `)
          .eq('order_id', orderId)
          .eq('preview_status', 'preview_ready')
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setOrderItemData(data);
        } else {
          // No preview ready, navigate back to track order
          navigate(RouteMap.track(orderId));
        }
      } catch (error) {
        console.error('Failed to load preview:', error);
        navigate(RouteMap.track(orderId));
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [orderId, user, navigate]);

  const handleClose = () => {
    setIsOpen(false);
    navigate(RouteMap.track(orderId!));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!orderItemData) {
    return null; // Will redirect
  }

  return (
    <PreviewApprovalSheet
      isOpen={isOpen}
      onClose={handleClose}
      orderId={orderItemData.orders?.order_number || orderId}
      orderItemId={orderItemData.id}
      deadline={orderItemData.preview_deadline ? new Date(orderItemData.preview_deadline) : undefined}
      deliveryDate={orderItemData.orders?.scheduled_date ? new Date(orderItemData.orders.scheduled_date) : undefined}
      freeRevisionsLeft={Math.max(0, 2 - (orderItemData.revision_count || 0))}
    />
  );
};

