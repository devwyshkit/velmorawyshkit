/**
 * Admin Partner Approvals Page
 * Review and approve/reject partner onboarding applications
 * Mobile-first with Sheet for review (reuses customer UI patterns)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, Eye, Loader2, Building, FileText, CreditCard, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchAllPartnerProfiles,
  approvePartner,
  rejectPartner,
  type PartnerProfile,
} from '@/lib/integrations/supabase-data';
import { supabase } from '@/lib/integrations/supabase-client';
import { cn } from '@/lib/utils';

export const PartnerApprovals = () => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PartnerProfile | null>(null);
  const [activeTab, setActiveTab] = useState('pending_review');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const allPartners = await fetchAllPartnerProfiles();
      setPartners(allPartners);
    } catch (error) {
      console.error('Failed to load partners:', error);
      toast({ title: 'Error loading partners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (partnerId: string) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const success = await approvePartner(partnerId, user.id);
      
      if (success) {
        toast({ title: 'Partner approved successfully!' });
        loadPartners();
        setSelectedPartner(null);
      } else {
        throw new Error('Failed to approve partner');
      }
    } catch (error) {
      console.error('Error approving partner:', error);
      toast({ title: 'Error approving partner', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (partnerId: string) => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Please provide a rejection reason', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const success = await rejectPartner(partnerId, user.id, rejectionReason);
      
      if (success) {
        toast({ title: 'Partner rejected', variant: 'destructive' });
        loadPartners();
        setSelectedPartner(null);
        setRejectionReason('');
      } else {
        throw new Error('Failed to reject partner');
      }
    } catch (error) {
      console.error('Error rejecting partner:', error);
      toast({ title: 'Error rejecting partner', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const filterPartnersByStatus = (status: string) => {
    return partners.filter((p) => p.onboarding_status === status);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      incomplete: { variant: 'secondary' as const, label: 'Incomplete' },
      pending_review: { variant: 'default' as const, label: 'Pending Review' },
      approved: { variant: 'outline' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending_review;

    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const PartnerCard = ({ partner }: { partner: PartnerProfile }) => (
    <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedPartner(partner)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{partner.business_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{partner.display_name}</p>
          </div>
          {getStatusBadge(partner.onboarding_status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{partner.category}</span>
          <span>•</span>
          <span>{partner.city}, {partner.state}</span>
        </div>

        <div className="flex gap-2">
          {partner.pan_verified && <Badge variant="outline" className="text-xs">PAN ✓</Badge>}
          {partner.gst_verified && <Badge variant="outline" className="text-xs">GST ✓</Badge>}
          {partner.bank_verified && <Badge variant="outline" className="text-xs">Bank ✓</Badge>}
        </div>

        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>Submitted: {new Date(partner.created_at).toLocaleDateString('en-IN')}</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Partner Approvals</h1>
        <p className="text-sm text-muted-foreground">{filterPartnersByStatus('pending_review').length} pending review</p>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="pending_review">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
        </TabsList>

        {['pending_review', 'approved', 'rejected', 'incomplete'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filterPartnersByStatus(status).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No {status.replace('_', ' ')} partners</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterPartnersByStatus(status).map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Partner Review Sheet */}
      <Sheet open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedPartner && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedPartner.business_name}</SheetTitle>
                <SheetDescription>
                  Review partner application
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Business Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Business Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Display Name:</span>
                      <span className="font-medium">{selectedPartner.display_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{selectedPartner.category}</span>
                    </div>
                    {selectedPartner.tagline && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tagline:</span>
                        <span className="font-medium">{selectedPartner.tagline}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedPartner.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium">{selectedPartner.phone}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground mb-1">Address:</p>
                      <p className="font-medium">
                        {selectedPartner.address_line1}
                        {selectedPartner.address_line2 && `, ${selectedPartner.address_line2}`}
                        <br />
                        {selectedPartner.city}, {selectedPartner.state} - {selectedPartner.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* KYC Verification */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">KYC Verification</h3>
                  </div>
                  <div className="space-y-2">
                    {/* PAN */}
                    <div className={cn(
                      "flex items-center justify-between p-3 border rounded-lg",
                      selectedPartner.pan_verified && "border-green-600 bg-green-50 dark:bg-green-950"
                    )}>
                      <div>
                        <p className="text-sm font-medium">PAN: {selectedPartner.pan_number}</p>
                        {selectedPartner.idfy_pan_request_id && (
                          <p className="text-xs text-muted-foreground">IDfy: {selectedPartner.idfy_pan_request_id}</p>
                        )}
                      </div>
                      {selectedPartner.pan_verified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>

                    {/* GST */}
                    {selectedPartner.gst_number && (
                      <div className={cn(
                        "flex items-center justify-between p-3 border rounded-lg",
                        selectedPartner.gst_verified && "border-green-600 bg-green-50 dark:bg-green-950"
                      )}>
                        <div>
                          <p className="text-sm font-medium">GST: {selectedPartner.gst_number}</p>
                          {selectedPartner.idfy_gst_request_id && (
                            <p className="text-xs text-muted-foreground">IDfy: {selectedPartner.idfy_gst_request_id}</p>
                          )}
                        </div>
                        {selectedPartner.gst_verified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    )}

                    {/* TAN */}
                    {selectedPartner.tan_number && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">TAN: {selectedPartner.tan_number}</p>
                          <p className="text-xs text-muted-foreground">No verification required</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Bank Account</h3>
                  </div>
                  <div className={cn(
                    "flex items-center justify-between p-3 border rounded-lg",
                    selectedPartner.bank_verified && "border-green-600 bg-green-50 dark:bg-green-950"
                  )}>
                    <div>
                      <p className="text-sm font-medium">Account: {selectedPartner.bank_account_number}</p>
                      <p className="text-xs text-muted-foreground">IFSC: {selectedPartner.bank_ifsc}</p>
                      <p className="text-xs text-muted-foreground">Name: {selectedPartner.bank_account_holder}</p>
                      {selectedPartner.idfy_bank_request_id && (
                        <p className="text-xs text-muted-foreground">IDfy: {selectedPartner.idfy_bank_request_id}</p>
                      )}
                    </div>
                    {selectedPartner.bank_verified ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>

                {/* Approval Actions (only for pending partners) */}
                {selectedPartner.onboarding_status === 'pending_review' && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold">Approval Actions</h3>

                    {/* Approve Button */}
                    <Button
                      onClick={() => handleApprove(selectedPartner.id)}
                      disabled={processing || !selectedPartner.pan_verified || !selectedPartner.bank_verified}
                      className="w-full"
                      size="lg"
                    >
                      {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Approve Partner
                    </Button>

                    {(!selectedPartner.pan_verified || !selectedPartner.bank_verified) && (
                      <p className="text-xs text-destructive">
                        * PAN and Bank verification required to approve
                      </p>
                    )}

                    {/* Reject Section */}
                    <div className="space-y-2">
                      <Label htmlFor="rejection">Rejection Reason</Label>
                      <Textarea
                        id="rejection"
                        placeholder="Provide reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                      <Button
                        onClick={() => handleReject(selectedPartner.id)}
                        disabled={processing || !rejectionReason.trim()}
                        variant="destructive"
                        className="w-full"
                      >
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Partner
                      </Button>
                    </div>
                  </div>
                )}

                {/* Rejection Reason (if rejected) */}
                {selectedPartner.onboarding_status === 'rejected' && selectedPartner.rejection_reason && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-1">Rejection Reason:</p>
                    <p className="text-sm text-muted-foreground">{selectedPartner.rejection_reason}</p>
                  </div>
                )}

                {/* Approval Info (if approved) */}
                {selectedPartner.onboarding_status === 'approved' && selectedPartner.approved_at && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-600 rounded-lg">
                    <p className="text-sm font-semibold text-green-600 mb-1">Approved</p>
                    <p className="text-xs text-muted-foreground">
                      On: {new Date(selectedPartner.approved_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

