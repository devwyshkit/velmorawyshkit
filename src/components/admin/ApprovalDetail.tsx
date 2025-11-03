import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ApprovalDetailProps {
  partner: any;
  onApprove: (partnerId: string) => void;
  onReject: (partnerId: string, reason: string) => void;
}

/**
 * Admin Approval Detail Component
 * Shows partner KYC documents for review
 * Manual verification (no IDfy API for MVP)
 */
export const ApprovalDetail = ({ partner, onApprove, onReject }: ApprovalDetailProps) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(partner.id);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    setLoading(true);
    try {
      await onReject(partner.id, rejectionReason);
    } finally {
      setLoading(false);
    }
  };

  const requiresFSSAI = ['food', 'perishables', 'beverages'].includes(partner.category);

  return (
    <div className="space-y-6 py-4">
      {/* Admin Review Checklist */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Admin Review Checklist:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Verify PAN format and name match</li>
            <li>Check GST number validity</li>
            {requiresFSSAI && <li>Verify FSSAI license (if food category)</li>}
            <li>Google search business name (legitimacy check)</li>
            <li>Verify address on Google Maps</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Business Name</span>
            <span className="font-medium">{partner.business_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <Badge variant="secondary" className="capitalize">
              {partner.category.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="capitalize">{partner.business_type?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address</span>
            <span className="text-right text-xs">
              {partner.address?.line1}, {partner.address?.city}, {partner.address?.state}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KYC Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            KYC Documents
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(partner.pan_number)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Verify PAN <ExternalLink className="h-3 w-3" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">PAN Number</span>
            <span className="font-mono font-medium">{partner.pan_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST Number</span>
            <span className="font-mono font-medium text-xs">{partner.gst_number}</span>
          </div>
          {requiresFSSAI && partner.fssai_number && (
            <div className="flex justify-between items-center p-2 bg-primary/5 rounded">
              <span className="text-muted-foreground">FSSAI License</span>
              <span className="font-mono font-medium">{partner.fssai_number}</span>
            </div>
          )}
          {requiresFSSAI && !partner.fssai_number && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">
                ⚠️ FSSAI license missing for food category - REJECT this application
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Holder</span>
            <span className="font-medium">{partner.bank_account_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Number</span>
            <span className="font-mono">xxxx-{partner.bank_account_number?.slice(-4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IFSC Code</span>
            <span className="font-mono font-medium">{partner.bank_ifsc}</span>
          </div>
        </CardContent>
      </Card>

      {/* Approval/Rejection Actions */}
      <div className="space-y-4 pt-4 border-t">
        <Button
          onClick={handleApprove}
          disabled={loading || (requiresFSSAI && !partner.fssai_number)}
          className="w-full gap-2"
        >
          {loading ? (
            "Approving..."
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Approve Partner
            </>
          )}
        </Button>

        <div className="space-y-2">
          <Label>Rejection Reason (if rejecting)</Label>
          <Textarea
            placeholder="e.g., Invalid documents, FSSAI expired, Business address not verifiable..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleReject}
          variant="destructive"
          disabled={loading || !rejectionReason.trim()}
          className="w-full gap-2"
        >
          <XCircle className="h-4 w-4" />
          Reject Application
        </Button>
      </div>
    </div>
  );
};

