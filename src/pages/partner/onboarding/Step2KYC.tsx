/**
 * Onboarding Step 2: KYC Documents with IDfy Verification
 * Real-time PAN/GST verification with instant feedback (IDFC-style)
 * Mobile-first design (reuses customer UI patterns)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  verifyPAN, 
  verifyGST, 
  updatePartnerVerification,
  validatePANFormat,
  validateGSTFormat 
} from '@/lib/integrations/idfy';
import { upsertPartnerProfile } from '@/lib/integrations/supabase-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step2KYCProps {
  onNext: () => void;
  onBack: () => void;
  partnerId: string;
}

export const Step2KYC = ({ onNext, onBack, partnerId }: Step2KYCProps) => {
  const { toast } = useToast();

  // PAN State
  const [panNumber, setPanNumber] = useState('');
  const [panName, setPanName] = useState('');
  const [panVerifying, setPanVerifying] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [panError, setPanError] = useState('');

  // GST State (optional)
  const [gstNumber, setGstNumber] = useState('');
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstError, setGstError] = useState('');
  const [gstSkipped, setGstSkipped] = useState(false);

  // TAN State (optional, no verification)
  const [tanNumber, setTanNumber] = useState('');

  const [loading, setLoading] = useState(false);

  // Verify PAN with IDfy
  const handlePANVerify = async () => {
    // Client-side validation first
    if (!validatePANFormat(panNumber)) {
      setPanError('Invalid PAN format (should be AAAAA9999A)');
      return;
    }

    if (!panName.trim()) {
      setPanError('Please enter name as per PAN');
      return;
    }

    setPanVerifying(true);
    setPanError('');

    try {
      const result = await verifyPAN(panNumber, panName);

      if (result.status === 'completed' && result.result?.valid) {
        setPanVerified(true);
        await updatePartnerVerification(partnerId, 'pan', true, result.request_id);
        
        // Update partner profile with PAN details
        await upsertPartnerProfile({
          id: partnerId,
          pan_number: panNumber.toUpperCase(),
          pan_verified: true,
        });

        toast({
          title: 'PAN verified successfully!',
          description: `Name: ${result.result.name || panName}`,
        });
      } else {
        setPanError(result.error || 'PAN verification failed. Please check the details.');
        toast({
          title: 'PAN verification failed',
          description: result.error || 'Please verify your PAN details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setPanError(error instanceof Error ? error.message : 'Verification error');
      toast({
        title: 'Verification error',
        description: 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setPanVerifying(false);
    }
  };

  // Verify GST with IDfy
  const handleGSTVerify = async () => {
    // Client-side validation first
    if (!validateGSTFormat(gstNumber)) {
      setGstError('Invalid GST format (should be 22AAAAA0000A1Z5)');
      return;
    }

    setGstVerifying(true);
    setGstError('');

    try {
      const result = await verifyGST(gstNumber);

      if (result.status === 'completed' && result.result?.valid) {
        setGstVerified(true);
        await updatePartnerVerification(partnerId, 'gst', true, result.request_id);
        
        // Update partner profile with GST details
        await upsertPartnerProfile({
          id: partnerId,
          gst_number: gstNumber.toUpperCase(),
          gst_verified: true,
        });

        toast({
          title: 'GST verified successfully!',
          description: result.result.business_name ? `Business: ${result.result.business_name}` : undefined,
        });
      } else {
        setGstError(result.error || 'GST verification failed. Please check the number.');
        toast({
          title: 'GST verification failed',
          description: result.error || 'Please verify your GST number',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setGstError(error instanceof Error ? error.message : 'Verification error');
      toast({
        title: 'Verification error',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setGstVerifying(false);
    }
  };

  // Skip GST verification
  const handleSkipGST = () => {
    setGstSkipped(true);
    toast({
      title: 'GST verification skipped',
      description: 'You can add it later in your profile',
    });
  };

  // Proceed to next step
  const handleNext = async () => {
    if (!panVerified) {
      toast({
        title: 'PAN verification required',
        description: 'Please verify your PAN to continue',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Update onboarding step and save TAN if provided
      await upsertPartnerProfile({
        id: partnerId,
        tan_number: tanNumber.toUpperCase() || undefined,
        onboarding_step: 2,
      });

      onNext();
    } catch (error) {
      toast({
        title: 'Error saving KYC details',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-bold">KYC Verification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Instant verification via IDfy • Takes 30 seconds
        </p>
      </div>

      {/* PAN Card - REQUIRED */}
      <div className={cn(
        "space-y-4 p-4 border rounded-lg transition-colors",
        panVerified && "border-green-600 bg-green-50 dark:bg-green-950"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            PAN Card *
            {panVerified && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </h3>
          {panVerified && (
            <span className="text-xs text-green-600 font-medium">Verified</span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="pan">PAN Number</Label>
            <Input
              id="pan"
              placeholder="AAAAA9999A"
              value={panNumber}
              onChange={(e) => {
                setPanNumber(e.target.value.toUpperCase());
                setPanError('');
              }}
              maxLength={10}
              disabled={panVerified}
              className={cn(panError && "border-destructive")}
            />
          </div>

          <div>
            <Label htmlFor="pan-name">Name as per PAN</Label>
            <Input
              id="pan-name"
              placeholder="John Doe"
              value={panName}
              onChange={(e) => {
                setPanName(e.target.value);
                setPanError('');
              }}
              disabled={panVerified}
            />
          </div>

          {panError && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{panError}</span>
            </div>
          )}

          <Button
            onClick={handlePANVerify}
            disabled={panVerifying || panVerified || panNumber.length !== 10 || !panName.trim()}
            className="w-full"
            variant={panVerified ? "outline" : "default"}
          >
            {panVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {panVerified ? 'Verified ✓' : 'Verify PAN with IDfy'}
          </Button>
        </div>
      </div>

      {/* GST Number - OPTIONAL */}
      {!gstSkipped && (
        <div className={cn(
          "space-y-4 p-4 border rounded-lg transition-colors",
          gstVerified && "border-green-600 bg-green-50 dark:bg-green-950"
        )}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              GST Number 
              <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              {gstVerified && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </h3>
            {gstVerified && (
              <span className="text-xs text-green-600 font-medium">Verified</span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                placeholder="22AAAAA0000A1Z5"
                value={gstNumber}
                onChange={(e) => {
                  setGstNumber(e.target.value.toUpperCase());
                  setGstError('');
                }}
                maxLength={15}
                disabled={gstVerified}
                className={cn(gstError && "border-destructive")}
              />
            </div>

            {gstError && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{gstError}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGSTVerify}
                disabled={gstVerifying || gstVerified || gstNumber.length !== 15}
                variant={gstVerified ? "outline" : "default"}
                className="flex-1"
              >
                {gstVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {gstVerified ? 'Verified ✓' : 'Verify GST'}
              </Button>

              {!gstVerified && (
                <Button
                  onClick={handleSkipGST}
                  variant="ghost"
                  className="flex-1"
                >
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAN - OPTIONAL, no verification */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            TAN 
            <span className="text-xs font-normal text-muted-foreground ml-2">(Optional)</span>
          </h3>
        </div>

        <div>
          <Label htmlFor="tan">TAN Number</Label>
          <Input
            id="tan"
            placeholder="AAAA99999A"
            value={tanNumber}
            onChange={(e) => setTanNumber(e.target.value.toUpperCase())}
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tax Deduction Account Number (if applicable)
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!panVerified || loading}
          className="flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Banking
        </Button>
      </div>
    </div>
  );
};

