import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Package, Upload, Clock, CheckCircle, Circle } from "lucide-react";

interface ConfirmationStepProps {
  orderId: string;
  estimatedDelivery: string;
  needsFileUpload?: boolean;
  onViewOrder: () => void;
  onContinueShopping: () => void;
}

export const ConfirmationStep = ({ 
  orderId, 
  estimatedDelivery,
  needsFileUpload = false,
  onViewOrder,
  onContinueShopping,
}: ConfirmationStepProps) => {
  return (
    <div className="p-4 space-y-6 pb-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="relative">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="absolute inset-0 bg-green-500/20 rounded-full" />
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
        <p className="text-muted-foreground">
          Order #{orderId}
        </p>
      </div>

      {/* Delivery Info */}
      <Card className="p-4 bg-muted/50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-medium">Estimated Delivery</span>
          </div>
          <p className="text-lg font-semibold text-primary">
            {estimatedDelivery}
          </p>
        </div>
      </Card>

      {/* What Happens Next Timeline (Swiggy Style) */}
      <Card className="p-4 bg-muted/30">
        <h3 className="font-semibold text-sm mb-4">What happens next</h3>
        <div className="space-y-4">
          {/* Step 1: Order Placed - Always shown */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="w-0.5 h-8 mt-2 bg-green-500" />
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium text-sm">Order Placed</p>
              <p className="text-xs text-muted-foreground mt-0.5">Payment authorized</p>
            </div>
          </div>

          {/* Step 2: Upload Files - Only if needsFileUpload */}
          {needsFileUpload && (
            <>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Circle className="h-5 w-5 text-primary" />
                  <div className="w-0.5 h-8 mt-2 bg-muted" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">Upload Your Files</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload your design files on the tracking page</p>
                </div>
              </div>

              {/* Step 3: Preview Creation */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <div className="w-0.5 h-8 mt-2 bg-muted" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm text-muted-foreground">We'll Create Preview</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Usually takes 24-48 hours</p>
                </div>
              </div>

              {/* Step 4: Review & Approve */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <div className="w-0.5 h-8 mt-2 bg-muted" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm text-muted-foreground">Review & Approve</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">2 free changes included • Auto-approves after 3 days</p>
                </div>
              </div>

              {/* Step 5: Production Starts */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <div className="w-0.5 h-8 mt-2 bg-muted" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm text-muted-foreground">We Start Making It</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Production begins after approval</p>
                </div>
              </div>

              {/* Step 6: Packed & On Way */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm text-muted-foreground">Packed & On the Way</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Delivered by {estimatedDelivery}</p>
                </div>
              </div>
            </>
          )}

          {/* Standard flow without preview - Simple Swiggy style */}
          {!needsFileUpload && (
            <>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Circle className="h-5 w-5 text-primary" />
                  <div className="w-0.5 h-8 mt-2 bg-muted" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">Preparing Your Order</p>
                  <p className="text-xs text-muted-foreground mt-0.5">We're getting it ready</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-muted-foreground">Out for Delivery</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Delivered by {estimatedDelivery}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* File Upload CTA (Only if needsFileUpload) */}
      {needsFileUpload && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Upload className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="font-medium text-blue-900">
                  Upload Your Design Files
                </p>
                <p className="text-sm text-blue-700">
                  Your order needs design files for customization. Upload them on the tracking page to start the preview process.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 2 free changes included
                </p>
              </div>
            </div>
            <Button 
              onClick={onViewOrder} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Tracking & Upload Files
            </Button>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={onViewOrder} variant="default" className="w-full" size="lg">
          View Order Details
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Track your order, upload files, and approve preview
        </p>
        <Button onClick={onContinueShopping} variant="outline" className="w-full" size="lg">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};


