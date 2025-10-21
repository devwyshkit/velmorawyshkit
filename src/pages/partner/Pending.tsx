/**
 * Partner Pending Approval Page
 * Shown to partners waiting for admin approval after onboarding
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Store } from 'lucide-react';
import { supabase } from '@/lib/integrations/supabase-client';
import { getPartnerAccount } from '@/lib/integrations/partner-data';
import { useNavigate } from 'react-router-dom';

export const Pending = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkApprovalStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(checkApprovalStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    const account = await getPartnerAccount();
    
    if (account?.status === 'approved') {
      navigate('/partner/dashboard');
    } else if (account?.status === 'rejected') {
      // Handle rejection
    }
    
    setChecking(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/partner/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Clock className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Application Under Review</CardTitle>
          <CardDescription>
            We're reviewing your application. This typically takes 24-48 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 pb-20 md:pb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Application Submitted</p>
                <p className="text-sm text-muted-foreground">Your documents are being verified</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 opacity-50">
              <Clock className="h-5 w-5" />
              <div>
                <p className="font-medium">Verification in Progress</p>
                <p className="text-sm text-muted-foreground">Usually takes 24-48 hours</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 opacity-50">
              <Store className="h-5 w-5" />
              <div>
                <p className="font-medium">Ready to Launch</p>
                <p className="text-sm text-muted-foreground">You'll receive an email when approved</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Need help? Contact us at <a href="mailto:partners@wyshkit.com" className="text-primary hover:underline">partners@wyshkit.com</a>
            </p>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pending;

