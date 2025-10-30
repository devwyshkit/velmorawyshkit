import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Edit2, Loader2, FileText, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/integrations/supabase-client";
// Zoho Sign removed; define a minimal local shape for UI state only
type SigningRequest = {
  status: 'sent' | 'signed' | 'draft';
  signing_url?: string;
  document_url?: string;
  signed_at?: string;
  request_id?: string;
};
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Step4ReviewProps {
  data: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

/**
 * Onboarding Step 4: Review & Submit
 * Shows summary of all information
 * Submits for admin approval (Zomato pattern)
 */
export const Step4Review = ({ data, onSubmit, onBack }: Step4ReviewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingRequest, setSigningRequest] = useState<SigningRequest | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractSigned, setContractSigned] = useState(false);

  // Check if partner already has a contract from previous submission
  useEffect(() => {
    checkContractStatus();
  }, [user]);

  const checkContractStatus = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('partner_profiles')
        .select('contract_signed, zoho_request_id')
        .eq('id', user.id)
        .single();

      if (profile?.contract_signed) {
        setContractSigned(true);
      }
    } catch (error) {
      console.error('Contract status check failed:', error);
    }
  };

  const handleSendContract = async () => {
    if (!user) return;

    setContractLoading(true);
    try {
      // Contract e-sign is disabled. Mark as signed after confirmation for MVP.
      setSigningRequest({ status: 'signed', signed_at: new Date().toISOString() });
      setContractSigned(true);
      await supabase
        .from('partner_profiles')
        .update({ contract_signed: true, contract_signed_at: new Date().toISOString() })
        .eq('id', user.id);
      toast({ title: 'Contract acknowledged', description: 'You can proceed with submission.' });
    } catch (error: any) {
      console.error('Error sending contract:', error);
      toast({ title: 'Action failed', description: 'Please try again', variant: 'destructive' });
    } finally {
      setContractLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!agreed) {
      toast({
        title: "Terms required",
        description: "Please agree to the Partner Terms & Conditions",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      // Update partner profile with all onboarding data
      const { error } = await supabase
        .from('partner_profiles')
        .upsert({
          id: user.id,
          business_name: data.business_name,
          category: data.category,
          business_type: data.business_type,
          address: data.address,
          phone: data.phone,
          website: data.website,
          pan_number: data.pan_number,
          gst_number: data.gst_number,
          fssai_number: data.fssai_number,
          bank_account_number: data.bank_account_number,
          bank_ifsc: data.bank_ifsc,
          bank_account_name: data.bank_account_name,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: "Application submitted! 🎉",
        description: "You'll be notified within 24-48 hours",
      });
      
      onSubmit(data);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requiresFSSAI = ['food', 'perishables', 'beverages'].includes(data.category || '');

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">
          Review your information before submitting for approval
        </p>
      </div>

      {/* Business Details Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Business Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Business Name</span>
            <span className="font-medium">{data.business_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <span className="font-medium capitalize">{data.category?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium capitalize">{data.business_type?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address</span>
            <span className="font-medium text-right">
              {data.address?.line1}, {data.address?.city}, {data.address?.state} {data.address?.pincode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">+91 {data.phone}</span>
          </div>
        </CardContent>
      </Card>

      {/* KYC Documents Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">KYC Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">PAN Number</span>
            <span className="font-medium font-mono">{data.pan_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST Number</span>
            <span className="font-medium font-mono">{data.gst_number}</span>
          </div>
          {requiresFSSAI && data.fssai_number && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">FSSAI License</span>
              <span className="font-medium font-mono">{data.fssai_number}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banking Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Holder</span>
            <span className="font-medium">{data.bank_account_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Number</span>
            <span className="font-medium font-mono">
              xxxx-xxxx-{data.bank_account_number?.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IFSC Code</span>
            <span className="font-medium font-mono">{data.bank_ifsc}</span>
          </div>
        </CardContent>
      </Card>

      {/* Partnership Agreement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Partnership Agreement
            </span>
            
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contractSigned ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Contract Signed ✓</span>
              </div>
              {signingRequest?.document_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(signingRequest.document_url, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Signed Document
                </Button>
              )}
              <Alert>
                <AlertDescription className="text-xs">
                  Your partnership agreement has been signed and verified. You can proceed with submission.
                </AlertDescription>
              </Alert>
            </div>
          ) : signingRequest ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signing Status</span>
                  <Badge variant={signingRequest.status === 'sent' ? 'default' : 'secondary'}>
                    {signingRequest.status === 'sent' ? 'Awaiting Signature' : signingRequest.status}
                  </Badge>
                </div>
                <Progress value={signingRequest.status === 'signed' ? 100 : 50} className="h-2" />
              </div>
              {signingRequest.signing_url && (
                <Button
                  variant="default"
                  onClick={() => window.open(signingRequest.signing_url, '_blank')}
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Sign Contract Now
                </Button>
              )}
              <Alert>
                <AlertDescription className="text-xs">
                  A signing link has been sent to your email. The contract must be signed before submission.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign the partnership agreement to finalize your onboarding. This covers commission terms, quality standards, and platform policies.
              </p>
              <Button
                variant="default"
                onClick={handleSendContract}
                disabled={contractLoading}
                className="w-full gap-2"
              >
                {contractLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Contract...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Send Partnership Agreement
                  </>
                )}
              </Button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📄 <strong>Contract includes:</strong></p>
                <ul className="list-disc list-inside ml-3 space-y-0.5">
                  <li>Commission structure (15-20%)</li>
                  <li>Payment terms (NET 15 days)</li>
                  <li>Quality and compliance standards</li>
                  <li>Termination clauses (30 days notice)</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <div className="flex items-start gap-2 p-4 border rounded-lg">
        <Checkbox
          id="terms"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked as boolean)}
        />
        <Label htmlFor="terms" className="text-sm cursor-pointer">
          I agree to Wyshkit's{" "}
          <a href="/partner-terms" target="_blank" className="text-primary hover:underline">
            Partner Terms & Conditions
          </a>
          {" "}and confirm that all information provided is accurate.
        </Label>
      </div>

      {/* What's Next */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>What happens next?</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Our team will review your application</li>
            <li>You'll receive approval within 24-48 hours</li>
            <li>Once approved, you can start adding products</li>
            <li>Begin receiving orders from customers!</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!agreed || loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit for Approval
              <CheckCircle2 className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

