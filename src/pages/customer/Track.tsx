import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { CheckCircle, Circle, Package, Truck, Home as HomeIcon, Phone, HelpCircle, RotateCcw, FileText, MessageCircle, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { CustomerBottomNav } from "@/components/customer/shared/CustomerBottomNav";
import { FileUploadSheet } from "@/components/customer/shared/FileUploadSheet";
import { useToast } from "@/hooks/use-toast";
import { getETAEstimate } from "@/lib/integrations/openai";
import { supabase } from "@/lib/integrations/supabase-client";
import { notificationService } from "@/services/notificationService";
import { RatingSheet } from "@/components/customer/RatingSheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface TimelineStep {
  id: string;
  label: string;
  time: string;
  completed: boolean;
  active: boolean;
}

export const Track = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const orderId = id || 'ORD-' + Date.now();
  const [eta, setEta] = useState<string>('');
  const [isRatingSheetOpen, setIsRatingSheetOpen] = useState(false);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [hasCustomItems, setHasCustomItems] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<string>('confirmed');
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [selectedOrderItemForUpload, setSelectedOrderItemForUpload] = useState<any>(null);
  
  // Fetch order data on mount
  useEffect(() => {
    const loadOrderData = async () => {
      if (!user && !localStorage.getItem('mock_session')) return;
      
      try {
        // Fetch order first to get status
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, status, created_at, order_number')
          .eq('id', orderId)
          .single();

        if (orderError && !order) {
          console.error('Error loading order:', orderError);
          return;
        }

        if (order) {
          setOrderStatus(order.status || 'confirmed');
        }

        // Fetch order items with preview status
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            order_id (
              id,
              order_number,
              status,
              created_at
            )
          `)
          .eq('order_id', orderId);
        
        if (items && !itemsError) {
          setOrderItems(items);
          setOrderData(items);
          
          // Check if any item needs preview (preview_status exists)
          const hasPreview = items.some((item: any) => 
            item.preview_status !== null && item.preview_status !== undefined
          );
          setHasCustomItems(hasPreview);
        }
      } catch (error) {
        console.error('Error loading order data:', error);
      }
    };
    
    loadOrderData();
  }, [orderId, user]);

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

    // Check if order has preview items
    const hasPreviewItems = orderItems.some((item: any) => item.preview_status !== null && item.preview_status !== undefined);
    
    if (hasPreviewItems) {
      // Preview pending - waiting for files
      const needsFiles = orderItems.some((item: any) => item.preview_status === 'pending');
      if (needsFiles) {
        timeline.push({
          id: 'preview_pending',
          label: 'Waiting for Files',
          time: 'Upload your design files',
          completed: false,
          active: true,
        });
      }

      // Preview ready - waiting for approval
      const previewReady = orderItems.some((item: any) => item.preview_status === 'preview_ready');
      if (previewReady) {
        const previewItem = orderItems.find((item: any) => item.preview_status === 'preview_ready');
        timeline.push({
          id: 'preview_ready',
          label: 'Preview Ready for Review',
          time: previewItem?.preview_generated_at ? formatTime(previewItem.preview_generated_at) : 'Ready now',
          completed: true,
          active: true,
        });
      }

      // Revision requested
      const hasRevision = orderItems.some((item: any) => item.preview_status === 'revision_requested');
      if (hasRevision) {
        const revisionItem = orderItems.find((item: any) => item.preview_status === 'revision_requested');
        timeline.push({
          id: 'revision_requested',
          label: 'Revision in Progress',
          time: revisionItem?.revision_requested_at ? formatTime(revisionItem.revision_requested_at) : 'In progress',
          completed: false,
          active: true,
        });
      }

      // Preview approved - production starts
      const previewApproved = orderItems.some((item: any) => item.preview_status === 'preview_approved');
      if (previewApproved) {
        const approvedItem = orderItems.find((item: any) => item.preview_status === 'preview_approved');
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

  // Real-time order tracking with Supabase subscriptions
  useEffect(() => {
    if (!orderId || orderItems.length === 0) return;

    setTimeline(buildTimeline());

    // Subscribe to real-time order updates
    const orderSubscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        async (payload) => {
          const newStatus = payload.new.status;
          setOrderStatus(newStatus);
          
          // Reload order items to get latest preview_status
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);
          
          if (items) {
            setOrderItems(items);
            setOrderData(items);
          }
          
          // Rebuild timeline with new data
          setTimeline(buildTimeline());

          // Send push notification for specific status updates
          if (['preview_ready', 'out_for_delivery', 'delivered'].includes(newStatus)) {
            notificationService.sendOrderNotification(newStatus, orderId);
          }

          // Auto-open rating sheet when order is delivered
          if (newStatus === 'delivered') {
            setTimeout(() => {
              setIsRatingSheetOpen(true);
            }, 2000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`,
        },
        async (payload) => {
          // Reload order items when preview_status changes
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);
          
          if (items) {
            setOrderItems(items);
            setOrderData(items);
            
            // Check if preview became ready
            const previewReady = items.some((item: any) => item.preview_status === 'preview_ready');
            if (previewReady) {
              toast({
                title: "Preview Ready! 🎨",
                description: "Your design preview is ready for review",
              });
            }
            
            // Rebuild timeline
            setTimeline(buildTimeline());
          }
        }
      )
      .subscribe((status) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      orderSubscription.unsubscribe();
    };
  }, [orderId, buildTimeline]);



  const orderDetails = {
    id: orderId,
    items: [
      { name: 'Premium Gift Hamper', quantity: 2 },
      { name: 'Artisan Chocolate Box', quantity: 1 },
    ],
    deliveryAddress: '123 MG Road, Bangalore, Karnataka - 560001',
    deliveryPartner: 'Rahul Kumar',
    deliveryPhone: '+91 98765 43210',
  };

  useEffect(() => {
    const loadETA = async () => {
      const estimatedTime = await getETAEstimate(orderId);
      setEta(estimatedTime);
    };
    loadETA();

    // Show tracking update notification
    toast({
      title: "Order is on the way! 🚚",
      description: `Estimated arrival: ${eta || '30-45 mins'}`,
    });
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
    <div className="min-h-screen bg-background pb-20">
      <CustomerMobileHeader showBackButton title="Track Order" />

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
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

        {/* Contact & Help Buttons (Swiggy/Zomato pattern) */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => {
              window.location.href = `tel:${orderDetails.deliveryPhone}`;
            }}
          >
            <Phone className="h-5 w-5" />
            <span className="hidden sm:inline">Contact Partner</span>
            <span className="sm:hidden">Call</span>
          </Button>
          <Button
            variant="outline"
            className="h-12 gap-2"
            onClick={() => {
              toast({
                title: "Need Help?",
                description: "Our support team will contact you shortly",
              });
            }}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Need Help?</span>
            <span className="sm:hidden">Help</span>
          </Button>
        </div>

        {/* Preview Ready Card - Show when preview is ready for review */}
        {orderItems.some((item: any) => item.preview_status === 'preview_ready') && (() => {
          const previewItem = orderItems.find((item: any) => item.preview_status === 'preview_ready');
          const revisionCount = previewItem?.revision_count || 0;
          const freeRevisionsLeft = Math.max(0, 2 - revisionCount);
          const previewDeadline = previewItem?.preview_deadline ? new Date(previewItem.preview_deadline) : null;
          const now = new Date();
          const daysUntilAutoApprove = previewDeadline ? Math.ceil((previewDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
          
          return (
            <Card className="p-6 bg-primary/5 border-2 border-primary/20">
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
                {previewItem?.preview_url && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img 
                      src={previewItem.preview_url} 
                      alt="Design preview" 
                      className="w-full h-auto"
                    />
                  </div>
                )}
                
                {/* Revision Count & Auto-approval */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Free changes left</span>
                    <span className="text-sm font-semibold text-primary">
                      {freeRevisionsLeft} {freeRevisionsLeft === 1 ? 'change' : 'changes'}
                    </span>
                  </div>
                  
                  {previewDeadline && daysUntilAutoApprove !== null && daysUntilAutoApprove > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <Clock className="h-4 w-4 text-warning" />
                      <p className="text-sm text-warning-foreground">
                        Auto-approving in {daysUntilAutoApprove} {daysUntilAutoApprove === 1 ? 'day' : 'days'} if no response
                      </p>
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
                  onClick={() => navigate(RouteMap.preview(orderId))}
                  variant="default"
                  className="w-full"
                  size="lg"
                >
                  Review & Approve
                </Button>
              </div>
            </Card>
          );
        })()}

        {/* File Upload Section - Vendor-defined uploads (Swiggy Model) */}
        {orderItems.some((item: any) => item.preview_status === 'pending') && (() => {
          const pendingItem = orderItems.find((item: any) => item.preview_status === 'pending');
          const personalizationsNeedingUpload = pendingItem?.personalizations?.filter((p: any) => p.requiresPreview) || [];
          const uploadCount = personalizationsNeedingUpload.length;

          if (uploadCount === 0) return null;

          return (
            <Card className="p-6 bg-blue-50 border-2 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Upload className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Upload Your Design Files
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Upload {uploadCount} design file{uploadCount > 1 ? 's' : ''} for {pendingItem?.store_items?.name || 'your order'}. Our vendor will create a preview for your approval before production starts.
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
                  onClick={() => {
                    toast({
                      title: "Reorder Started",
                      description: "Adding items to cart for reorder",
                    });
                    // TODO: Implement reorder logic
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm">Reorder</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 gap-2 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    toast({
                      title: "Invoice Downloaded",
                      description: "Your invoice has been saved to downloads",
                    });
                    // TODO: Implement invoice download
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Invoice</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 gap-2 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    toast({
                      title: "Chat Opened",
                      description: "Connecting you with support",
                    });
                    // TODO: Implement chat functionality
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Chat</span>
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
                  onClick={() => navigate(RouteMap.preview(orderId))}
                  variant="default"
                  size="sm"
                >
                  Review Proof
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Items in this order</h3>
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
              <div>
                <p className="text-muted-foreground text-xs mb-1">Delivery Partner</p>
                <p>{orderDetails.deliveryPartner}</p>
                <p className="text-xs text-muted-foreground">{orderDetails.deliveryPhone}</p>
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

      {/* Rating Sheet - Auto-opens after delivery */}
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

      {/* File Upload Sheet - Vendor-defined uploads (Swiggy Model) */}
      {selectedOrderItemForUpload && (
        <FileUploadSheet
          isOpen={isFileUploadOpen}
          onClose={() => {
            setIsFileUploadOpen(false);
            setSelectedOrderItemForUpload(null);
          }}
          orderItemId={selectedOrderItemForUpload.id}
          personalizations={selectedOrderItemForUpload?.personalizations || []}
          onUploadComplete={async () => {
            // Refresh order data after upload
            const { data: items } = await supabase
              .from('order_items')
              .select('*')
              .eq('order_id', orderId);
            
            if (items) {
              setOrderItems(items);
              setTimeline(buildTimeline());
            }
            // Silent success - FileUploadSheet shows success state
          }}
        />
      )}
    </div>
  );
};

