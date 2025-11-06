import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RouteMap } from "@/routes";
import { Clock, ZoomIn, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderItemById, updateOrderItemPreview, updateOrderStatus } from "@/lib/mock-orders";
import { handlePreviewApproved } from "@/lib/workflows/paymentCaptureWorkflow";
import { cn } from "@/lib/utils";

interface PreviewApprovalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  orderItemId?: string;
  orderItem?: any;
  deadline?: Date;
}

/**
 * PreviewApprovalSheet - Fiverr 2025 UX + Swiggy 2025 Implementation
 * 
 * Swiggy 2025 Team Building Fiverr Preview:
 * - Bottom sheet (Swiggy pattern)
 * - Carousel with zoom (Fiverr UX)
 * - Simple approve/reject (Fiverr simplicity)
 * - Clean deadline display (Swiggy pattern)
 * - No over-engineering
 */
export const PreviewApprovalSheet = ({ 
  isOpen, 
  onClose, 
  orderId,
  orderItemId,
  orderItem,
  deadline,
}: PreviewApprovalSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [orderItemData, setOrderItemData] = useState<any>(null);
  const [showRevisionFeedback, setShowRevisionFeedback] = useState(false);

  // Load order item data
  useEffect(() => {
    if (orderItem) {
      setOrderItemData(orderItem);
    } else if (orderItemId) {
      const mockItem = getOrderItemById(orderItemId);
      if (mockItem) {
        setOrderItemData(mockItem);
      }
    }
  }, [orderItem, orderItemId]);

  const previewUrls = orderItemData?.preview_url
    ? (Array.isArray(orderItemData.preview_url) 
        ? orderItemData.preview_url 
        : [orderItemData.preview_url])
    : [];
  const itemName = orderItemData?.item_name || 'Your Order';
  const displayOrderId = orderId || orderItemData?.order_id?.order_number || 'ORD-123';

  // Calculate deadline (48h from preview generation)
  const approvalDeadline = deadline || (orderItemData?.preview_generated_at 
    ? new Date(new Date(orderItemData.preview_generated_at).getTime() + 48 * 60 * 60 * 1000)
    : new Date(Date.now() + 48 * 60 * 60 * 1000));

  // Calculate time remaining (Swiggy 2025 pattern)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diff = approvalDeadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft("Overdue");
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h left`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [approvalDeadline]);

  // Handle approve (Fiverr UX - one-click approve)
  const handleApprove = async () => {
    if (!orderItemId) return;

    setLoading(true);
    try {
      // Update preview status
      updateOrderItemPreview(orderItemId, {
        preview_status: 'preview_approved',
        preview_approved_at: new Date().toISOString(),
      });

      // Trigger payment capture (Swiggy workflow)
      await handlePreviewApproved(orderItemId);

      // Close and navigate (Swiggy pattern - no toast)
      onClose();
      if (orderId) {
        navigate(`${RouteMap.track(orderId)}`);
      }
    } catch (error) {
      toast({
        title: "Failed to approve",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle request revision (Fiverr UX - simple feedback)
  const handleRequestRevision = async () => {
    if (!orderItemId) return;

    if (!showRevisionFeedback) {
      setShowRevisionFeedback(true);
      return;
    }

    setLoading(true);
    try {
      const mockItem = getOrderItemById(orderItemId);
      if (!mockItem) return;

      const newRevisionCount = (mockItem.revision_count || 0) + 1;

      updateOrderItemPreview(orderItemId, {
        preview_status: 'revision_requested',
        revision_count: newRevisionCount,
        revision_notes: feedback || null,
        revision_requested_at: new Date().toISOString(),
      });

      // Update order status
      const mockOrder = mockItem.order_id;
      if (mockOrder) {
        updateOrderStatus(mockOrder.id, 'revision_requested');
      }

      // Close and navigate (Swiggy pattern)
      onClose();
      if (orderId) {
        navigate(`${RouteMap.track(orderId)}`);
      }
    } catch (error) {
      toast({
        title: "Failed to request revision",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!orderItemData) {
    return null;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose} modal={false}>
        <SheetContent
          side="bottom"
          className="max-h-[75vh] rounded-t-xl p-0 overflow-hidden flex flex-col sm:max-w-[640px] sm:left-1/2 sm:-translate-x-1/2"
        >
          {/* Grabber - Outside scroll container (Swiggy 2025 pattern) */}
          <div className="flex justify-center pt-2 flex-shrink-0">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header - Sticky (Swiggy 2025 pattern) */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Review Your Design</h2>
                <p className="text-sm text-muted-foreground">{itemName}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {timeLeft}
              </Badge>
            </div>
          </div>

          {/* Content - Swiggy 2025 Pattern: Snap scrolling */}
          <div className="flex-1 overflow-y-auto snap-y snap-mandatory p-4 space-y-4">
            {/* Deadline Warning (Swiggy 2025 pattern) */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  Approve by {approvalDeadline.toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {timeLeft} remaining • Auto-approves after deadline
                </p>
              </div>
            </div>

            {/* Preview Carousel (Fiverr 2025 UX) */}
            {previewUrls.length > 0 ? (
              <div>
                <Label className="text-sm font-medium mb-2 block">Design Preview</Label>
                <Carousel className="w-full">
                  <CarouselContent>
                    {previewUrls.map((url: string, index: number) => (
                      <CarouselItem key={index}>
                        <div 
                          className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer group"
                          onClick={() => setFullscreenImage(url)}
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Zoom indicator (Fiverr UX) */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {previewUrls.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Click image to zoom
                </p>
              </div>
            ) : (
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Preview not available</p>
                </div>
              </div>
            )}

            {/* Revision Feedback (Optional - Fiverr UX) */}
            {showRevisionFeedback && (
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                <Label htmlFor="feedback" className="text-sm font-medium">
                  What would you like to change? (Optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Describe the changes you'd like..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Warning (Swiggy 2025 pattern) */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 border border-border rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Once approved, production will start and cannot be cancelled. Request changes if needed.
              </p>
            </div>
          </div>

          {/* Footer Actions (Fiverr UX + Swiggy Implementation) */}
          <div className="sticky bottom-0 bg-background border-t border-border p-4 space-y-2">
            {showRevisionFeedback ? (
              <>
                <Button
                  onClick={handleRequestRevision}
                  variant="outline"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Submit Revision Request"}
                </Button>
                <Button
                  onClick={() => setShowRevisionFeedback(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleApprove}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Approving..." : "Approve & Continue"}
                </Button>
                <Button
                  onClick={() => setShowRevisionFeedback(true)}
                  variant="outline"
                  className="w-full h-11"
                  disabled={loading}
                >
                  Request Changes
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Fullscreen Image Viewer (Fiverr 2025 UX) */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            alt="Fullscreen preview" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </>
  );
};