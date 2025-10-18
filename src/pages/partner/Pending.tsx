/**
 * Partner Pending Approval Page
 * Shown after onboarding submission, before admin approval
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const Pending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold">Application Under Review</h1>
          <p className="text-sm text-muted-foreground">
            We're reviewing your partner application
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What's next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Application Submitted</p>
                <p className="text-xs text-muted-foreground">
                  Your business details and KYC documents have been received
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Under Review</p>
                <p className="text-xs text-muted-foreground">
                  Our team is verifying your documents (typically 24 hours)
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email Notification</p>
                <p className="text-xs text-muted-foreground">
                  You'll receive an email once your application is approved
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">
            Have questions? Contact us at{' '}
            <a href="mailto:partners@wyshkit.com" className="text-primary hover:underline">
              partners@wyshkit.com
            </a>
          </p>
        </div>

        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          className="w-full"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

