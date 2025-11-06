/**
 * Partner Card (Mobile View)
 * Card view for partner approvals on mobile instead of DataTable
 */

import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Partner {
  id: string;
  name: string;
  email: string;
  category: string;
  submitted_at: string;
  kyc_pan_verified: boolean;
  kyc_gst_verified: boolean;
  kyc_bank_verified: boolean;
  kyc_fssai_verified?: boolean;
}

interface PartnerCardProps {
  partner: Partner;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
}

export const PartnerCard = ({ partner, onApprove, onReject, onView }: PartnerCardProps) => {
  const kycComplete = partner.kyc_pan_verified && partner.kyc_gst_verified && partner.kyc_bank_verified;
  const categoryLabel = partner.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base leading-tight">{partner.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{partner.email}</p>
          </div>
          <Badge variant="secondary" className="flex-shrink-0">
            {categoryLabel}
          </Badge>
        </div>

        {/* KYC Status */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant={partner.kyc_pan_verified ? "default" : "outline"} className="text-xs">
            {partner.kyc_pan_verified ? '✓' : '○'} PAN
          </Badge>
          <Badge variant={partner.kyc_gst_verified ? "default" : "outline"} className="text-xs">
            {partner.kyc_gst_verified ? '✓' : '○'} GST
          </Badge>
          <Badge variant={partner.kyc_bank_verified ? "default" : "outline"} className="text-xs">
            {partner.kyc_bank_verified ? '✓' : '○'} Bank
          </Badge>
          {partner.kyc_fssai_verified !== undefined && (
            <Badge variant={partner.kyc_fssai_verified ? "default" : "outline"} className="text-xs">
              {partner.kyc_fssai_verified ? '✓' : '○'} FSSAI
            </Badge>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Submitted {formatDistanceToNow(new Date(partner.submitted_at), { addSuffix: true })}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(partner.id)}
              className="flex-1 min-w-[100px]"
            >
              View Details
            </Button>
          )}
          {onApprove && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onApprove(partner.id)}
              className="flex-1 min-w-[100px] bg-green-600 hover:bg-green-700"
              disabled={!kycComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          {onReject && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject(partner.id)}
              className="flex-1 min-w-[100px]"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          )}
        </div>

        {!kycComplete && (
          <p className="text-xs text-amber-600 mt-2">
            ⚠️ KYC verification incomplete
          </p>
        )}
      </CardContent>
    </Card>
  );
};

