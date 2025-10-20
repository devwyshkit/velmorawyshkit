import { useState } from "react";
import { CheckCircle, XCircle, Clock, Mail, Phone, MapPin, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/integrations/supabase-client";

interface PartnerDetailPanelProps {
  partner: any;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * Partner Detail Panel
 * Admin reviews KYC documents and approves/rejects partners
 * Displays IDfy verification results
 * Sets commission tier
 */
export const PartnerDetailPanel = ({
  partner,
  onApprove,
  onReject,
}: PartnerDetailPanelProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [commissionTier, setCommissionTier] = useState<string>("20");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const allKYCVerified = partner.kyc_pan_verified && 
                         partner.kyc_gst_verified && 
                         partner.kyc_bank_verified &&
                         (partner.category?.toLowerCase().includes('food') ? partner.kyc_fssai_verified : true);

  const handleApprove = async () => {
    if (!allKYCVerified) {
      toast({
        title: "Cannot approve",
        description: "All KYC documents must be verified first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAction('approve');

    try {
      // Update partner approval status
      const { error: approvalError } = await supabase
        .from('partner_approvals')
        .update({
          status: 'approved',
          commission_tier: parseFloat(commissionTier),
          notes: adminNotes,
          approved_at: new Date().toISOString(),
        })
        .eq('partner_id', partner.id);

      if (approvalError) throw approvalError;

      // Update partner profile
      const { error: partnerError } = await supabase
        .from('partners')
        .update({
          status: 'approved',
          is_active: true,
          commission_percent: parseFloat(commissionTier) / 100,
        })
        .eq('id', partner.id);

      if (partnerError) throw partnerError;

      // Log admin action
      await supabase.from('admin_audit_logs').insert({
        action: 'approved_partner',
        target_type: 'partner',
        target_id: partner.id,
        details: {
          partner_name: partner.name,
          commission_tier: commissionTier,
          notes: adminNotes,
        },
      });

      toast({
        title: "Partner approved!",
        description: `${partner.name} has been approved and activated`,
      });

      onApprove();
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.length < 20) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a detailed reason (min 20 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setAction('reject');

    try {
      // Update approval status
      const { error: approvalError } = await supabase
        .from('partner_approvals')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          notes: adminNotes,
          rejected_at: new Date().toISOString(),
        })
        .eq('partner_id', partner.id);

      if (approvalError) throw approvalError;

      // Update partner profile
      const { error: partnerError } = await supabase
        .from('partners')
        .update({
          status: 'rejected',
          is_active: false,
        })
        .eq('id', partner.id);

      if (partnerError) throw partnerError;

      // Log admin action
      await supabase.from('admin_audit_logs').insert({
        action: 'rejected_partner',
        target_type: 'partner',
        target_id: partner.id,
        details: {
          partner_name: partner.name,
          rejection_reason: rejectionReason,
        },
      });

      toast({
        title: "Partner rejected",
        description: "Rejection notification sent to partner",
      });

      onReject();
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Business Details */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{partner.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{partner.category}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* KYC Verification */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* PAN */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {partner.kyc_pan_verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-sm">PAN Card</p>
                <p className="text-xs text-muted-foreground">Verified via IDfy</p>
              </div>
            </div>
            <Button variant="outline" size="sm">View Doc</Button>
          </div>

          {/* GST */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {partner.kyc_gst_verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-sm">GST Certificate</p>
                <p className="text-xs text-muted-foreground">Verified via IDfy</p>
              </div>
            </div>
            <Button variant="outline" size="sm">View Doc</Button>
          </div>

          {/* Bank Account */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {partner.kyc_bank_verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-sm">Bank Account</p>
                <p className="text-xs text-muted-foreground">
                  {partner.kyc_bank_verified ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">View Details</Button>
          </div>

          {/* FSSAI (if Food category) */}
          {partner.category?.toLowerCase().includes('food') && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {partner.kyc_fssai_verified ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <div>
                  <p className="font-medium text-sm">FSSAI License</p>
                  <p className="text-xs text-muted-foreground">
                    Required for food products
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">View Doc</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Commission Tier</Label>
            <Select value={commissionTier} onValueChange={setCommissionTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15% - Premium Partner</SelectItem>
                <SelectItem value="17">17% - Negotiated Rate</SelectItem>
                <SelectItem value="20">20% - Standard Rate</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Platform commission on each completed order
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notes (Internal)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any notes about this partner review..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Rejection Reason (if rejecting) */}
      {action === 'reject' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Provide detailed reason for rejection (min 20 characters)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="border-destructive"
            />
            <p className="text-xs text-muted-foreground mt-2">
              This will be sent to the partner via email
            </p>
          </CardContent>
        </Card>
      )}

      {/* Warning for incomplete KYC */}
      {!allKYCVerified && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Incomplete KYC</AlertTitle>
          <AlertDescription className="text-xs">
            All KYC documents must be verified before approval. 
            Pending verifications will prevent approval.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background pb-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setAction(action === 'reject' ? null : 'reject')}
          disabled={loading}
        >
          {action === 'reject' ? 'Cancel' : 'Reject with Reason'}
        </Button>
        
        {action === 'reject' ? (
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleReject}
            disabled={loading || rejectionReason.length < 20}
          >
            {loading ? "Rejecting..." : "Confirm Rejection"}
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={handleApprove}
            disabled={loading || !allKYCVerified}
          >
            {loading ? "Approving..." : "✓ Approve Partner"}
          </Button>
        )}
      </div>
    </div>
  );
};

