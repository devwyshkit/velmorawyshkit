import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { CheckCircle, Circle, Package, Truck, Home as HomeIcon, Phone, HelpCircle, RotateCcw, FileText, MessageCircle, Upload, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { FileUploadSheet } from "@/components/customer/shared/FileUploadSheet";
import { PorterDelhiveryTracking } from "@/components/customer/shared/PorterDelhiveryTracking";
import { QuickReorderSheet } from "@/components/customer/shared/QuickReorderSheet";
import { PreviewApprovalSheet } from "@/components/customer/shared/PreviewApprovalSheet";
import { OrderDetailsSheet } from "@/components/customer/shared/OrderDetailsSheet";
import { DeliveryCompletionSheet } from "@/components/customer/shared/DeliveryCompletionSheet";
import { getETAEstimate } from "@/lib/integrations/openai";
// Phase 1 Cleanup: Removed Supabase imports - pure mock mode
import { RatingSheet } from "@/components/customer/RatingSheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { isDevelopment } from "@/lib/mock-mode";
import { getOrderById, getOrdersByCustomer, prePopulateOrders, generatePreview, type Order } from "@/lib/mock-orders";
import { downloadInvoice, downloadEstimate } from "@/lib/mock-invoice";

interface TimelineStep {
  id: string;
  label: string;
  time: string;
  completed: boolean;
  active: boolean;
}

type OrderItem = {
  id: string;
  item_id?: string;
  item_name?: string;
  item_image_url?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  personalizations?: Array<{ id: string; label?: string }>;
  preview_status?: string | null;
  preview_url?: string | string[] | null;
  preview_generated_at?: string | null;
  preview_approved_at?: string | null;
  preview_deadline?: string | null;
  revision_count?: number;
  revision_notes?: string | null;
  revision_requested_at?: string | null;
  customization_files?: string | string[] | null;
  order_id?: {
    id: string;
    order_number?: string;
    status: string;
    created_at: string;
    scheduled_date?: string | null;
  } | null;
  orders?: {
    id: string;
    order_number?: string;
    status: string;
    created_at: string;
    scheduled_date?: string | null;
  } | null;
  store_items?: {
    id: string;
    name?: string;
  } | null;
};

export const Track = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderId = id || 'ORD-' + Date.now();
  const [eta, setEta] = useState<string>('');
  const [isRatingSheetOpen, setIsRatingSheetOpen] = useState(false);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [hasCustomItems, setHasCustomItems] = useState(false);
  const [orderData, setOrderData] = useState<OrderItem[] | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('confirmed');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [selectedOrderItemForUpload, setSelectedOrderItemForUpload] = useState<OrderItem | null>(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  const [previewOrderItem, setPreviewOrderItem] = useState<OrderItem | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isDeliveryCompletionOpen, setIsDeliveryCompletionOpen] = useState(false);
  const [hasShownDeliveryCompletion, setHasShownDeliveryCompletion] = useState(false);
  
  // Helper function to refresh order data (Phase 4 cleanup - simplified)
  // Enhanced lookup to handle multiple ID formats
  const refreshOrderData = useCallback(() => {
    if (!user) return;
    
    try {
      // Try multiple lookup strategies
      let mockOrder = getOrderById(orderId);
      
      if (!mockOrder) {
        // Try by order_number
        const allOrders = getOrdersByCustomer(user.id);
        mockOrder = allOrders.find(o => 
          o.id === orderId || 
          o.order_number === orderId ||
          o.id === `mock_order_${orderId}` ||
          o.order_number === `ORD-${orderId}` ||
          // Handle cases where orderId might be just the numeric part
          (orderId.startsWith('ORD-') && o.order_number === orderId) ||
          (orderId.includes('mock_order_') && o.id === orderId) ||
          // Handle URL format: /order/123/track where 123 is order_number
          (o.order_number && o.order_number.endsWith(orderId.replace(/^ORD-/, '')))
        ) || null;
      }
      
      // Log for debugging
      if (!mockOrder) {
        console.warn('Order not found:', { 
          orderId, 
          userId: user.id,
          availableOrders: getOrdersByCustomer(user.id).map(o => ({ id: o.id, order_number: o.order_number }))
        });
      } else {
        console.log('Order found:', { id: mockOrder.id, order_number: mockOrder.order_number });
      }
      
      if (mockOrder) {
        setOrderStatus(mockOrder.status);
        const mappedItems: OrderItem[] = mockOrder.order_items.map((item: Order['order_items'][0]) => ({
          id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_image_url: item.item_image_url,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          personalizations: item.personalizations || [],
          preview_status: item.preview_status,
          preview_url: item.preview_url,
          preview_generated_at: item.preview_generated_at,
          preview_approved_at: item.preview_approved_at,
          preview_deadline: item.preview_deadline,
          revision_count: item.revision_count,
          revision_notes: item.revision_notes,
          revision_requested_at: item.revision_requested_at,
          customization_files: item.customization_files,
          order_id: {
            id: mockOrder.id,
            order_number: mockOrder.order_number,
            status: mockOrder.status,
            created_at: mockOrder.created_at,
            scheduled_date: null,
          },
        }));
        setOrderItems(mappedItems);
        setOrderData(mockOrder.order_items);
        setHasCustomItems(mockOrder.order_items.some((item: Order['order_items'][0]) => 
          item.personalizations?.length > 0
        ));
      }
    } catch (error) {
      console.error('Failed to refresh order:', error);
    }
  }, [orderId, user]);
  
  // Phase 4: Load order data on mount
  useEffect(() => {
    if (!user) return;
    prePopulateOrders(user.id);
    refreshOrderData();
  }, [orderId, user, refreshOrderData]);

  // Rebuild timeline when order items change
  useEffect(() => {
    if (orderItems.length > 0) {
      setTimeline(buildTimeline());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderItems, orderStatus]);

  // Phase 3: Auto-open delivery completion sheet when order is delivered
  useEffect(() => {
    if (orderStatus === 'delivered' && !hasShownDeliveryCompletion && !isDeliveryCompletionOpen) {
      // Auto-open after 1 second (Swiggy 2025 pattern)
      const timer = setTimeout(() => {
        setIsDeliveryCompletionOpen(true);
        setHasShownDeliveryCompletion(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [orderStatus, hasShownDeliveryCompletion, isDeliveryCompletionOpen]);

  // Phase 3: Auto-trigger rating is now handled in DeliveryCompletionSheet onClose

  // Phase 2: Auto-open preview approval sheet when preview is ready (Swiggy 2025 pattern)
  useEffect(() => {
    if (orderItems.length === 0) return;

    // Swiggy 2025: Auto-open preview sheet only if item has personalizations
    const previewReadyItem = orderItems.find((item: OrderItem) => 
      item.preview_status === 'preview_ready' &&
      item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
    );
    
    if (previewReadyItem && !isPreviewSheetOpen && !previewOrderItem) {
      // Auto-open after 1 second delay (Swiggy pattern - let page load first)
      const timer = setTimeout(() => {
        setPreviewOrderItem(previewReadyItem);
        setIsPreviewSheetOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [orderItems, isPreviewSheetOpen, previewOrderItem]);

  // Phase 4: Handle hash URLs (#preview, #upload) - auto-open sheets
  useEffect(() => {
    if (orderItems.length === 0) return;

    const urlHash = window.location.hash;
    
    // Swiggy 2025: Handle #preview - auto-open preview sheet only if has personalizations
    if (urlHash === '#preview') {
      const previewReadyItem = orderItems.find((item: OrderItem) => 
        item.preview_status === 'preview_ready' &&
        item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
      );
      if (previewReadyItem) {
        setPreviewOrderItem(previewReadyItem);
        setIsPreviewSheetOpen(true);
        // Clear hash after opening
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    
    // Swiggy 2025: Handle #upload - auto-open file upload sheet only if has personalizations
    if (urlHash === '#upload') {
      const pendingItem = orderItems.find((item: OrderItem) => 
        item.preview_status === 'pending' &&
        item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
      );
      if (pendingItem) {
        setSelectedOrderItemForUpload(pendingItem);
        setIsFileUploadOpen(true);
        // Clear hash after opening
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [orderItems]);

  // Build dynamic timeline based on actual order status
  const buildTimeline = useCallback((): TimelineStep[] => {
    const timeline: TimelineStep[] = [];
    const now = new Date();

    // Helper to format time
    const formatTime = (date: Date | string | null) => {
      if (!date) return 'Just now';
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return 'Just now';
      return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    };

    // Always start with confirmed
    const orderCreated = orderItems[0]?.order_id?.created_at || null;
    timeline.push({
      id: 'confirmed',
      label: 'Order Confirmed',
      time: orderCreated ? formatTime(orderCreated) : 'Just now',
      completed: true,
      active: false,
    });

    // Swiggy 2025: Only show preview items if they have personalizations (customizations)
    const hasPreviewItems = orderItems.some((item: OrderItem) => 
      item.preview_status !== null && 
      item.preview_status !== undefined &&
      item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
    );
    
    if (hasPreviewItems) {
      // Swiggy 2025: Preview pending - only if item has personalizations
      const needsFiles = orderItems.some((item: OrderItem) => 
        item.preview_status === 'pending' &&
        item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
      );
      if (needsFiles) {
        timeline.push({
          id: 'preview_pending',
          label: 'Waiting for Files',
          time: 'Upload your design files',
          completed: false,
          active: true,
        });
      }

      // Swiggy 2025: Preview ready - only if item has personalizations
      const previewReady = orderItems.some((item: OrderItem) => 
        item.preview_status === 'preview_ready' &&
        item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
      );
      if (previewReady) {
        // Swiggy 2025: Find preview item that also has personalizations
        const previewItem = orderItems.find((item: OrderItem) => 
          item.preview_status === 'preview_ready' &&
          item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
        );
        timeline.push({
          id: 'preview_ready',
          label: 'Preview Ready for Review',
          time: previewItem?.preview_generated_at ? formatTime(previewItem.preview_generated_at) : 'Ready now',
          completed: true,
          active: true,
        });
      }

      // Swiggy 2025: Revision requested - only if item has personalizations
      const hasRevision = orderItems.some((item: OrderItem) => 
        item.preview_status === 'revision_requested' &&
        item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
      );
      if (hasRevision) {
        // Swiggy 2025: Find revision item that also has personalizations
        const revisionItem = orderItems.find((item: OrderItem) => 
          item.preview_status === 'revision_requested' &&
          item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
        );
        timeline.push({
          id: 'revision_requested',
          label: 'Revision in Progress',
          time: revisionItem?.revision_requested_at ? formatTime(revisionItem.revision_requested_at) : 'In progress',
          completed: false,
          active: true,
        });
      }

      // Swiggy 2025: Preview approved - only if item has personalizations
      const previewApproved = orderItems.some((item: OrderItem) => 
        item.preview_status === 'preview_approved' &&
        item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
      );
      if (previewApproved) {
        // Swiggy 2025: Find approved item that also has personalizations
        const approvedItem = orderItems.find((item: OrderItem) => 
          item.preview_status === 'preview_approved' &&
          item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
        );
        timeline.push({
          id: 'preview_approved',
          label: 'Production Started',
          time: approvedItem?.preview_approved_at ? formatTime(approvedItem.preview_approved_at) : 'Started',
          completed: true,
          active: false,
        });
      }
    }

    // Standard production/delivery steps
    const statusOrder = [
      'confirmed',
      'preview_pending',
      'preview_ready',
      'preview_approved',
      'revision_requested',
      'in_production',
      'production_complete',
      'ready_for_pickup',
      'picked_up',
      'out_for_delivery',
      'delivery_attempted',
      'delivered',
    ];

    const currentStatusIndex = statusOrder.indexOf(orderStatus);
    
    // In production
    if (['in_production', 'production_complete', 'ready_for_pickup', 'picked_up'].includes(orderStatus)) {
      timeline.push({
        id: 'in_production',
        label: 'In Production',
        time: 'Making your order',
        completed: true,
        active: orderStatus === 'in_production',
      });
    }

    // Packed
    if (['production_complete', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered'].includes(orderStatus)) {
      timeline.push({
        id: 'packed',
        label: 'Packed & Ready',
        time: 'Ready for delivery',
        completed: true,
        active: orderStatus === 'production_complete' || orderStatus === 'ready_for_pickup',
      });
    }

    // Out for delivery
    if (['out_for_delivery', 'delivery_attempted', 'delivered'].includes(orderStatus)) {
      timeline.push({
        id: 'out_for_delivery',
        label: 'Out for Delivery',
        time: 'On the way',
        completed: orderStatus === 'delivered',
        active: orderStatus === 'out_for_delivery',
      });
    }

    // Delivered
    if (orderStatus === 'delivered') {
      timeline.push({
        id: 'delivered',
        label: 'Delivered',
        time: 'Completed',
        completed: true,
        active: false,
      });
    }

    return timeline;
  }, [orderStatus, orderItems]);

  // Phase 1 Cleanup: Removed real-time subscriptions - use polling or manual refresh
  // Timeline rebuild on order status or items change
  useEffect(() => {
    if (orderItems.length > 0) {
      setTimeline(buildTimeline());
    }
  }, [orderStatus, orderItems, buildTimeline]);



  const [orderDetails, setOrderDetails] = useState({
    id: orderId,
    items: [] as Array<{ name: string; quantity: number }>,
    deliveryAddress: '123 MG Road, Bangalore, Karnataka - 560001',
    logisticsProvider: null as 'porter' | 'delhivery' | null,
    trackingNumber: null as string | null,
  });

  // Update orderDetails when orderItems changes
  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      setOrderDetails(prev => ({
        ...prev,
        items: orderItems.map((item: OrderItem) => ({
          name: item.item_name || 'Unknown Item',
          quantity: item.quantity || 1,
        })),
      }));
    }
  }, [orderItems]);

  // Phase 1 Cleanup: Order details loaded from mock order data
  // Delivery address and logistics info come from mock order

  useEffect(() => {
    const loadETA = async () => {
      const estimatedTime = await getETAEstimate(orderId);
      setEta(estimatedTime);
    };
    loadETA();
    // Removed auto-toast notification (anti-pattern) - ETA is displayed in the UI
  }, [orderId]);

  const getIcon = (step: TimelineStep) => {
    if (step.completed) {
      return <CheckCircle className="h-6 w-6 text-success" />;
    } else if (step.active) {
      return <Circle className="h-6 w-6 text-primary animate-pulse" />;
    } else {
      return <Circle className="h-6 w-6 text-muted" />;
    }
  };

      return (
        <>
          <Helmet>
            <title>
              {orderItems.length > 0 && orderItems[0]?.orders?.order_number
                ? `Order ${orderItems[0].orders.order_number} - Track Order | Wyshkit`
                : 'Track Order | Wyshkit'}
            </title>
            <meta name="description" content="Track your order status and delivery updates" />
          </Helmet>
          <div className="min-h-screen bg-background pb-[112px]">
            <CustomerMobileHeader showBackButton title="Track Order" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-4">
        {/* ETA Card - Prominent (Swiggy pattern) */}
        <Card className="bg-gradient-primary text-white border-0">
          <CardContent className="p-6 text-center">
            <Truck className="h-12 w-12 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2">On the Way!</h2>
            <p className="text-lg font-semibold mb-1">
              Arriving by {eta || '3:45 PM'}
            </p>
            <p className="text-sm opacity-90">
              Order #{orderId.substring(0, 12)}
            </p>
          </CardContent>
        </Card>

        {/* Contact Support & Track on Logistics Provider (Swiggy 2025 pattern) */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => {
              // Open support contact (email, phone, or chat)
              const supportPhone = import.meta.env.VITE_SUPPORT_PHONE || '+91-1800-XXX-XXXX';
              window.location.href = `tel:${supportPhone}`;
            }}
          >
            <Phone className="h-5 w-5" />
            <span className="hidden sm:inline">Contact Support</span>
            <span className="sm:hidden">Support</span>
          </Button>
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => {
              // Navigate to help center or open support chat
              navigate(RouteMap.help());
            }}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Help Center</span>
            <span className="sm:hidden">Help</span>
          </Button>
        </div>

        {/* Swiggy 2025: Preview Ready Card - Only show if item has personalizations */}
        {orderItems.some((item: OrderItem) => 
          item.preview_status === 'preview_ready' &&
          item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
        ) && (() => {
          // Swiggy 2025: Find preview item that also has personalizations
          const previewItem = orderItems.find((item: OrderItem) => 
            item.preview_status === 'preview_ready' &&
            item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
          );
          const revisionCount = previewItem?.revision_count || 0;
          const freeRevisionsLeft = Math.max(0, 2 - revisionCount);
          const previewDeadline = previewItem?.preview_deadline ? new Date(previewItem.preview_deadline) : null;
          const now = new Date();
          const daysUntilAutoApprove = previewDeadline ? Math.ceil((previewDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
          
          // Calculate hours/minutes for countdown
          const hoursUntilDeadline = previewDeadline ? Math.ceil((previewDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)) : null;
          const minutesUntilDeadline = previewDeadline ? Math.ceil((previewDeadline.getTime() - now.getTime()) / (1000 * 60)) : null;
          
          return (
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 shadow-lg animate-pulse">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Preview Ready for Review</h3>
                    <p className="text-sm text-muted-foreground">
                      Your design preview is ready. Review and approve to start production.
                    </p>
                  </div>
                </div>
                
                {/* Preview Image */}
                {previewItem?.preview_url && (() => {
                  // Handle preview_url as string or string[]
                  const previewUrl = previewItem.preview_url;
                  const previewImageUrl = Array.isArray(previewUrl) ? previewUrl[0] : previewUrl;
                  return previewImageUrl ? (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img 
                        src={previewImageUrl} 
                        alt="Design preview" 
                        className="w-full h-auto"
                      />
                    </div>
                  ) : null;
                })()}
                
                {/* Revision Count & Auto-approval */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Free changes left</span>
                    <span className="text-sm font-semibold text-primary">
                      {freeRevisionsLeft} {freeRevisionsLeft === 1 ? 'change' : 'changes'}
                    </span>
                  </div>
                  
                  {/* Phase 2: Enhanced countdown timer */}
                  {previewDeadline && hoursUntilDeadline !== null && hoursUntilDeadline > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <Clock className="h-5 w-5 text-warning animate-pulse" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-warning-foreground">
                          {hoursUntilDeadline < 24 
                            ? `${hoursUntilDeadline}h ${minutesUntilDeadline ? minutesUntilDeadline % 60 : 0}m left`
                            : `${daysUntilAutoApprove}d ${hoursUntilDeadline % 24}h left`
                          }
                        </p>
                        <p className="text-xs text-warning-foreground/70 mt-0.5">
                          Auto-approving if no response by {previewDeadline.toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {previewDeadline && daysUntilAutoApprove !== null && daysUntilAutoApprove <= 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-700">
                        Auto-approved • Production has started
                      </p>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => {
                    setPreviewOrderItem(previewItem);
                    setIsPreviewSheetOpen(true);
                  }}
                  variant="default"
                  className="w-full h-12 text-base font-semibold shadow-lg"
                  size="lg"
                >
                  Review & Approve Now
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Click to view full preview and approve or request changes
                </p>
              </div>
            </Card>
          );
        })()}

        {/* Swiggy 2025: File Upload Section - Only show if item has personalizations */}
        {orderItems.some((item: OrderItem) => 
          item.preview_status === 'pending' && 
          item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
        ) && (() => {
          // Swiggy 2025: Find pending item that also has personalizations
          const pendingItem = orderItems.find((item: OrderItem) => 
            item.preview_status === 'pending' &&
            item.personalizations?.length > 0  // CRITICAL: Only if has personalizations
          );
          // All personalizations require upload (simplified rule)
          const personalizationsNeedingUpload = pendingItem?.personalizations || [];
          const uploadCount = personalizationsNeedingUpload.length;

          if (uploadCount === 0) return null;

          return (
            <Card className="p-6 bg-blue-50 border-2 border-blue-200 destructive destructive">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Upload className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 destructive">
                      Upload Your Design Files
                    </h3>
                    <p className="text-sm text-blue-700 destructive mt-1">
                      Upload {uploadCount} design file{uploadCount > 1 ? 's' : ''} for {pendingItem?.item_name || pendingItem?.store_items?.name || 'your order'}. Our vendor will create a preview for your approval before production starts.
                    </p>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setSelectedOrderItemForUpload(pendingItem);
                    setIsFileUploadOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {uploadCount} Design File{uploadCount > 1 ? 's' : ''}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  2 free changes included. After submission, vendor will create a preview within 24-48 hours.
                </p>
                
                {/* Dev Helper: Manual Preview Generation (Development Only) */}
                {isDevelopment && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-dashed"
                    onClick={() => {
                      if (pendingItem?.id) {
                        generatePreview(pendingItem.id);
                        // Refresh order data
                        setTimeout(() => {
                          const mockOrder = getOrderById(orderId);
                          if (mockOrder) {
                            setOrderStatus(mockOrder.status);
                            const mappedItems: OrderItem[] = mockOrder.order_items.map((item: Order['order_items'][0]) => ({
                              id: item.id,
                              item_id: item.item_id,
                              item_name: item.item_name,
                              item_image_url: item.item_image_url,
                              quantity: item.quantity,
                              unit_price: item.unit_price,
                              total_price: item.total_price,
                              personalizations: item.personalizations || [],
                              preview_status: item.preview_status,
                              preview_url: item.preview_url,
                              preview_generated_at: item.preview_generated_at,
                              preview_approved_at: item.preview_approved_at,
                              revision_count: item.revision_count,
                              revision_notes: item.revision_notes,
                              revision_requested_at: item.revision_requested_at,
                              customization_files: item.customization_files,
                              order_id: {
                                id: mockOrder.id,
                                order_number: mockOrder.order_number,
                                status: mockOrder.status,
                                created_at: mockOrder.created_at,
                                scheduled_date: null,
                              },
                            }));
                            setOrderItems(mappedItems);
                            setOrderData(mockOrder.order_items);
                            setHasCustomItems(mockOrder.order_items.some((item: Order['order_items'][0]) => 
                              item.personalizations?.length > 0
                            ));
                            setTimeline(buildTimeline());
                          }
                        }, 100);
                      }
                    }}
                  >
                    🧪 Dev: Generate Preview Now (Mock Mode)
                  </Button>
                )}
              </div>
            </Card>
          );
        })()}

        {/* Timeline */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Order Timeline</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isRealtimeConnected ? 'Live Updates' : 'Offline'}</span>
              </div>
            </div>
            <div className="space-y-4 md:space-y-6">
              {timeline.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {getIcon(step)}
                    {index < timeline.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-12 mt-2",
                          step.completed ? "bg-success" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h4
                      className={cn(
                        "font-medium text-sm mb-1",
                        step.active && "text-primary",
                        step.completed && "text-foreground",
                        !step.completed && !step.active && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - For Delivered Orders */}
        {timeline.some(step => step.id === 'delivered' && step.completed) && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-green-800">Order Delivered! 🎉</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-12 gap-2 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => setIsRatingSheetOpen(true)}
                >
                  <Star className="h-4 w-4" />
                  <span className="text-sm">Rate Order</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-12 gap-2 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => setIsReorderOpen(true)}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Reorder</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 gap-2 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    // Phase 7: Invoice download (Zomato 2025 pattern)
                    downloadInvoice(orderId);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Invoice</span>
                </Button>
                
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Proof - For Custom Items */}
        {hasCustomItems && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Design Proof Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Review and approve your custom item design
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const readyItem = orderItems.find((item: OrderItem) => item.preview_status === 'preview_ready');
                    if (readyItem) {
                      setPreviewOrderItem(readyItem);
                      setIsPreviewSheetOpen(true);
                    }
                  }}
                  variant="default"
                  size="sm"
                >
                  Review Proof
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items - Clickable to view full details */}
        <Card className="cursor-pointer" onClick={() => setIsOrderDetailsOpen(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Items in this order</h3>
              </div>
              <span className="text-xs text-muted-foreground">View Details →</span>
            </div>
            <div className="space-y-2">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="text-sm">
                  <span className="text-muted-foreground">
                    {item.name} x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Porter/Delhivery Tracking Card */}
        {orderDetails.logisticsProvider && orderDetails.trackingNumber && (
          <PorterDelhiveryTracking
            orderId={orderId}
            logisticsProvider={orderDetails.logisticsProvider}
            trackingNumber={orderDetails.trackingNumber}
          />
        )}

        {/* Delivery Details */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <HomeIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Delivery Details</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Address</p>
                <p>{orderDetails.deliveryAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions - Continue Shopping (Swiggy pattern) */}
        <Button
          onClick={() => navigate(RouteMap.home())}
          className="w-full h-12"
        >
          Continue Shopping
        </Button>
      </main>

      <CustomerBottomNav />

      {/* Delivery Completion Sheet - Phase 3: Auto-opens when order is delivered */}
      <DeliveryCompletionSheet
        isOpen={isDeliveryCompletionOpen}
        onClose={() => {
          setIsDeliveryCompletionOpen(false);
          // Auto-trigger rating after closing delivery completion (Swiggy 2025 pattern)
          setTimeout(() => {
            if (orderStatus === 'delivered' && !isRatingSheetOpen) {
              setIsRatingSheetOpen(true);
            }
          }, 500);
        }}
        orderId={orderId}
        orderNumber={orderItems[0]?.order_id?.order_number}
        deliveredAt={orderItems[0]?.order_id?.created_at}
        onRateOrder={() => setIsRatingSheetOpen(true)}
        onReorder={() => setIsReorderOpen(true)}
        onViewDetails={() => setIsOrderDetailsOpen(true)}
      />

      {/* Rating Sheet - Phase 3: Auto-opens after delivery completion */}
      <RatingSheet
        isOpen={isRatingSheetOpen}
        onClose={() => setIsRatingSheetOpen(false)}
        orderId={orderId}
        orderItems={orderDetails.items.map(item => ({
          id: `item_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
          name: item.name,
          image: "https://picsum.photos/seed/item/100/100",
          quantity: item.quantity,
        }))}
      />

      {/* Swiggy 2025: File Upload Sheet - Only show if item has personalizations */}
      {selectedOrderItemForUpload && 
       selectedOrderItemForUpload.personalizations?.length > 0 && (
        <FileUploadSheet
          isOpen={isFileUploadOpen}
          onClose={() => {
            setIsFileUploadOpen(false);
            setSelectedOrderItemForUpload(null);
          }}
          orderItemId={selectedOrderItemForUpload.id}
          personalizations={(selectedOrderItemForUpload?.personalizations || []).map(p => ({
            id: p.id,
            label: p.label || 'Customization'
          }))}
          onUploadComplete={async () => {
            // Phase 4: Simplified refresh using helper
            refreshOrderData();
            setTimeline(buildTimeline());
          }}
        />
      )}

      {/* Quick Reorder Sheet */}
      <QuickReorderSheet
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        orderId={orderId}
      />

      {/* Swiggy 2025: Preview Approval Sheet - Only show if item has personalizations */}
      {previewOrderItem && 
       previewOrderItem.personalizations?.length > 0 && (
        <PreviewApprovalSheet
          isOpen={isPreviewSheetOpen}
          onClose={() => {
            setIsPreviewSheetOpen(false);
            setPreviewOrderItem(null);
            // Phase 4: Simplified refresh using helper
            refreshOrderData();
            setTimeline(buildTimeline());
          }}
          orderId={orderId}
          orderItemId={previewOrderItem.id}
          orderItem={previewOrderItem}
          deadline={previewOrderItem.preview_deadline ? new Date(previewOrderItem.preview_deadline) : undefined}
        />
      )}

      {/* Order Details Sheet - Full breakdown */}
      <OrderDetailsSheet
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        orderId={orderId}
      />
      </div>
    </>
  );
};

