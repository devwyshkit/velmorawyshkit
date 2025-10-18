/**
 * Onboarding Step 3: Bank Account Verification
 * Penny drop verification with IDfy
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  verifyBankAccount, 
  updatePartnerVerification,
  validateIFSCFormat 
} from '@/lib/integrations/idfy';
import { upsertPartnerProfile } from '@/lib/integrations/supabase-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step3BankingProps {
  onNext: () => void;
  onBack: () => void;
  partnerId: string;
}

export const Step3Banking = ({ onNext, onBack, partnerId }: Step3BankingProps) => {
  const { toast } = useToast();

  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    // Validate IFSC format
    if (!validateIFSCFormat(ifsc)) {
      setError('Invalid IFSC code format');
      return;
    }

    if (!accountNumber.trim() || !accountHolder.trim()) {
      setError('Please fill all fields');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const result = await verifyBankAccount(accountNumber, ifsc, accountHolder);

      if (result.status === 'completed' && result.result?.valid) {
        setVerified(true);
        await updatePartnerVerification(partnerId, 'bank', true, result.request_id);
        
        // Update partner profile
        await upsertPartnerProfile({
          id: partnerId,
          bank_account_number: accountNumber,
          bank_ifsc: ifsc.toUpperCase(),
          bank_account_holder: accountHolder,
          bank_verified: true,
        });

        toast({
          title: 'Bank account verified!',
          description: result.result.account_name ? `Account name: ${result.result.account_name}` : undefined,
        });
      } else {
        setError(result.error || 'Bank verification failed');
        toast({
          title: 'Verification failed',
          description: result.error || 'Please check your bank details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Verification error');
      toast({
        title: 'Verification error',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleNext = async () => {
    if (!verified) {
      toast({
        title: 'Bank verification required',
        description: 'Please verify your bank account',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await upsertPartnerProfile({
        id: partnerId,
        onboarding_step: 3,
      });

      onNext();
    } catch (error) {
      toast({
        title: 'Error saving banking details',
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
        <h2 className="text-2xl font-bold">Bank Account</h2>
        <p className="text-sm text-muted-foreground mt-1">
          For receiving payouts • Verified via penny drop
        </p>
      </div>

      <div className={cn(
        "space-y-4 p-4 border rounded-lg transition-colors",
        verified && "border-green-600 bg-green-50 dark:bg-green-950"
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            Bank Details *
            {verified && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          </h3>
          {verified && (
            <span className="text-xs text-green-600 font-medium">Verified</span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="account">Account Number</Label>
            <Input
              id="account"
              placeholder="1234567890"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setError('');
              }}
              disabled={verified}
              className={cn(error && "border-destructive")}
            />
          </div>

          <div>
            <Label htmlFor="ifsc">IFSC Code</Label>
            <Input
              id="ifsc"
              placeholder="HDFC0000123"
              value={ifsc}
              onChange={(e) => {
                setIfsc(e.target.value.toUpperCase());
                setError('');
              }}
              maxLength={11}
              disabled={verified}
            />
          </div>

          <div>
            <Label htmlFor="holder">Account Holder Name</Label>
            <Input
              id="holder"
              placeholder="As per bank records"
              value={accountHolder}
              onChange={(e) => {
                setAccountHolder(e.target.value);
                setError('');
              }}
              disabled={verified}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must match the name on your bank account
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleVerify}
            disabled={verifying || verified || !accountNumber || !ifsc || !accountHolder}
            className="w-full"
            variant={verified ? "outline" : "default"}
          >
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {verified ? 'Verified ✓' : 'Verify with Penny Drop'}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!verified || loading}
          className="flex-1"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Catalog
        </Button>
      </div>
    </div>
  );
};

