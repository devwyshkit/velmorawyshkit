/**
 * Product Approval Card (Mobile View)
 * Displays product awaiting approval with quick actions
 */

import { CheckCircle2, XCircle, Eye, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  partner_name: string;
  created_at: string;
  requires_fssai: boolean;
  fssai_verified?: boolean;
}

interface ProductApprovalCardProps {
  product: Product;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onPreview: (product: Product) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export const ProductApprovalCard = ({
  product,
  onApprove,
  onReject,
  onPreview,
  selected,
  onSelect,
}: ProductApprovalCardProps) => {
  const hasComplianceIssue = product.requires_fssai && !product.fssai_verified;

  return (
    <Card className="relative">
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="absolute top-3 right-3">
            <input
          title="Select Product"
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(product.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 cursor-pointer"
            />
          </div>
        )}

        {/* Product Image & Info */}
        <div className="flex gap-3 mb-3">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">{product.partner_name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{product.category}</Badge>
              <span className="text-sm font-semibold">
                ₹{(product.price / 100).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Compliance Warning */}
        {hasComplianceIssue && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              FSSAI verification required for food items
            </p>
          </div>
        )}

        {/* Meta Info */}
        <div className="text-xs text-muted-foreground mb-3">
          Submitted {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(product)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onApprove(product.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={hasComplianceIssue}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              const reason = prompt('Rejection reason:');
              if (reason) onReject(product.id, reason);
            }}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

