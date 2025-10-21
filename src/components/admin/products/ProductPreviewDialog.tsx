/**
 * Product Preview Dialog
 * Full product preview with all images and details for admin review
 */

import { CheckCircle2, XCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  partner_name: string;
  requires_fssai: boolean;
  fssai_verified?: boolean;
}

interface ProductPreviewDialogProps {
  product: Product;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const ProductPreviewDialog = ({
  product,
  onClose,
  onApprove,
  onReject,
}: ProductPreviewDialogProps) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    onApprove(product.id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    onReject(product.id, rejectionReason);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Product</DialogTitle>
          <DialogDescription>
            Review this product before making it live for customers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Gallery */}
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((image, idx) => (
                  <CarouselItem key={idx}>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={image}
                        alt={`${product.name} - Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {product.images.length > 1 && (
                <>
                  <CarouselPrevious />
                  <CarouselNext />
                </>
              )}
            </Carousel>
            <Badge className="absolute top-2 left-2 bg-background/90 backdrop-blur">
              {product.images.length} image{product.images.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Product Name</Label>
              <p className="font-semibold text-lg">{product.name}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Price</Label>
                <p className="text-xl font-bold text-primary">
                  ₹{(product.price / 100).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <Badge variant="outline" className="mt-1">{product.category}</Badge>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Partner</Label>
              <p className="font-medium">{product.partner_name}</p>
            </div>

            {/* Compliance Check */}
            {product.requires_fssai && (
              <div className={`p-3 rounded-lg border ${
                product.fssai_verified 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <p className="text-sm font-medium mb-1">
                  {product.fssai_verified ? '✅ FSSAI Compliance' : '⚠️ FSSAI Verification Required'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.fssai_verified 
                    ? 'FSSAI license verified and valid'
                    : 'Food items require valid FSSAI license. Cannot approve without verification.'}
                </p>
              </div>
            )}
          </div>

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this product cannot be approved..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  className="flex-1"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="default"
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
                disabled={product.requires_fssai && !product.fssai_verified}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

