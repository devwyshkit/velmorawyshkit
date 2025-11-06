import { useState } from "react";
import { CheckCircle2, X, FileImage, AlertTriangle, Phone, MapPin, Package, Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/lib/integrations/supabase-client";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface OrderDetailProps {
  order: any;
  onUpdate: () => void;
  onUploadPreview?: (orderItemId: string) => void;
}

/**
 * Order Detail Sheet Component
 * Shows order info + PREVIEW UPLOAD for Fiverr 2025 pattern
 * Partner uploads preview after customer has paid and uploaded requirements
 */
export const OrderDetail = ({ order, onUpdate, onUploadPreview }: OrderDetailProps) => {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Check for items requiring preview
  const itemsNeedingPreview = (order.items || []).filter((item: any) => 
    item.preview_status === 'pending' || item.preview_status === 'revision_requested'
  );
  const itemsWithPreviewReady = (order.items || []).filter((item: any) => 
    item.preview_status === 'preview_ready'
  );
  const itemsWithApprovedPreview = (order.items || []).filter((item: any) => 
    item.preview_status === 'preview_approved'
  );

  // Legacy support for old proof_approved field
  const hasCustomization = order.proof_urls && order.proof_urls.length > 0;
  const needsProofApproval = hasCustomization && !order.proof_approved;

  // Accept order
  const handleAcceptOrder = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ partner_status: 'accepted' })
        .eq('id', order.id);
      
      if (error) throw error;
      
      onUpdate();
      setError(null);
    } catch (error: any) {
      setError(error.message || "Failed to accept order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reject order
  const handleRejectOrder = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          partner_status: 'cancelled',
          rejection_reason: rejectionReason
        })
        .eq('id', order.id);
      
      if (error) throw error;
      
      onUpdate();
      setError(null);
    } catch (error: any) {
      setError(error.message || "Failed to reject order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Approve proof (Legacy - Zomato Gold pattern)
  const handleApproveProof = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          proof_approved: true,
          proof_approved_at: new Date().toISOString()
        })
        .eq('id', order.id);
      
      if (error) throw error;
      
      onUpdate();
      setError(null);
    } catch (error: any) {
      setError(error.message || "Failed to approve proof. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update order status (Preparing → Ready → Shipped)
  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ partner_status: newStatus })
        .eq('id', order.id);
      
      if (error) throw error;
      
      onUpdate();
      setError(null);
    } catch (error: any) {
      setError(error.message || "Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Order Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">{order.order_number}</h2>
          <StatusBadge status={order.partner_status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Ordered {formatTimeAgo(order.created_at)}
        </p>
        {order.logistics_provider && order.tracking_number && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Badge variant="outline">
              {order.logistics_provider === 'porter' ? '🚚 Porter' : '📦 Delhivery'}
            </Badge>
            <span className="text-muted-foreground">Tracking: {order.tracking_number}</span>
          </div>
        )}
      </div>

      {/* PREVIEW UPLOAD SECTION (Fiverr 2025 Pattern) */}
      {itemsNeedingPreview.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Preview Upload Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Customer Has Paid & Uploaded Requirements</AlertTitle>
              <AlertDescription className="text-xs">
                Upload preview/proof images for customer review. Customer will approve or request revision.
              </AlertDescription>
            </Alert>

            {itemsNeedingPreview.map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                    {item.preview_status === 'revision_requested' && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-xs font-medium text-amber-900">Revision Requested</p>
                        {item.revision_notes && (
                          <p className="text-xs text-amber-700 mt-1">{item.revision_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {onUploadPreview && (
                    <Button
                      size="sm"
                      onClick={() => onUploadPreview(item.id)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Preview
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PREVIEW UNDER REVIEW */}
      {itemsWithPreviewReady.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Preview Under Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {itemsWithPreviewReady.map((item: any) => (
              <div key={item.id} className="space-y-2">
                <p className="text-sm font-medium">{item.name}</p>
                {item.preview_url && (
                  <img
                    src={item.preview_url}
                    alt="Preview"
                    className="w-full rounded-lg border"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Waiting for customer approval...
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PREVIEW APPROVED - PRODUCTION READY */}
      {itemsWithApprovedPreview.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Preview Approved - Production Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700">
              ✅ Customer approved preview. You can proceed with production.
            </p>
            {itemsWithApprovedPreview.map((item: any) => (
              <div key={item.id} className="mt-3 space-y-2">
                <p className="text-sm font-medium">{item.name}</p>
                {item.preview_url && (
                  <img
                    src={item.preview_url}
                    alt="Approved Preview"
                    className="w-full rounded-lg border"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* LEGACY: PROOF APPROVAL SECTION (for backward compatibility) */}
      {hasCustomization && needsProofApproval && !itemsNeedingPreview.length && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              🎨 Proof Approval Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Customer Uploaded Design Files</AlertTitle>
              <AlertDescription className="text-xs">
                Review the uploaded logo/design before starting production.
                Click images to view full size.
              </AlertDescription>
            </Alert>

            {/* Customer Uploaded Files (Carousel) */}
            <div className="space-y-2">
              <Label>Customer Uploads</Label>
              <Carousel className="w-full">
                <CarouselContent>
                  {order.proof_urls.map((url: string, index: number) => (
                    <CarouselItem key={index} className="basis-full">
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={url}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-auto max-h-96 object-contain bg-muted"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {order.proof_urls.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
              <p className="text-xs text-muted-foreground">
                {order.proof_urls.length} file(s) uploaded
              </p>
            </div>

            {/* Approval Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleApproveProof}
                disabled={loading}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <span>Approving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Approve & Start Production
                  </>
                )}
              </Button>
              <Button
                onClick={() => setError("Request changes functionality coming soon")}
                variant="outline"
                disabled={loading}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Request Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{order.customer_phone}</span>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{order.delivery_address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(order.items || []).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                {item.preview_status && (
                  <Badge 
                    variant={
                      item.preview_status === 'preview_approved' ? 'default' :
                      item.preview_status === 'preview_ready' ? 'secondary' :
                      item.preview_status === 'revision_requested' ? 'destructive' :
                      'outline'
                    }
                    className="mt-1 text-xs"
                  >
                    {item.preview_status === 'pending' && 'Preview Pending'}
                    {item.preview_status === 'preview_ready' && 'Under Review'}
                    {item.preview_status === 'preview_approved' && 'Approved'}
                    {item.preview_status === 'revision_requested' && 'Revision'}
                  </Badge>
                )}
                {item.add_ons && item.add_ons.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.add_ons.map((addon: any, idx: number) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        + {addon.name} (+₹{addon.price / 100})
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-medium">
                ₹{(item.price * item.quantity / 100).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
          <div className="pt-3 border-t flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary">₹{(order.total / 100).toLocaleString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Actions */}
      {order.partner_status === 'pending' && (
        <div className="space-y-3 pt-4 border-t">
          <Button
            onClick={handleAcceptOrder}
            disabled={loading || (itemsNeedingPreview.length > 0 && !itemsWithApprovedPreview.length)}
            className="w-full gap-2"
          >
            {loading ? (
              "Accepting..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Accept Order
              </>
            )}
          </Button>

          {itemsNeedingPreview.length > 0 && !itemsWithApprovedPreview.length && (
            <p className="text-xs text-amber-600 text-center">
              ⚠️ Upload and get preview approved before accepting order
            </p>
          )}

          <div className="space-y-2">
            <Label>Rejection Reason (if rejecting)</Label>
            <Textarea
              placeholder="Reason for rejection (e.g., out of stock, address issue)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            onClick={handleRejectOrder}
            variant="destructive"
            disabled={loading}
            className="w-full gap-2"
          >
            <X className="h-4 w-4" />
            Reject Order
          </Button>
        </div>
      )}

      {/* Status Update Actions */}
      {order.partner_status === 'accepted' && (
        <Button
          onClick={() => handleUpdateStatus('preparing')}
          disabled={loading}
          className="w-full"
        >
          Mark as Preparing
        </Button>
      )}

      {order.partner_status === 'preparing' && (
        <Button
          onClick={() => handleUpdateStatus('ready')}
          disabled={loading}
          className="w-full"
        >
          Mark as Ready for Pickup
        </Button>
      )}

      {order.partner_status === 'ready' && (
        <Button
          onClick={() => handleUpdateStatus('shipped')}
          disabled={loading}
          className="w-full"
        >
          Mark as Shipped
        </Button>
      )}
    </div>
  );
};

// Helper: Format time ago
function formatTimeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

