import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

/**
 * Email Verification Page (Partner)
 * Shown after signup, prompts user to check email
 * Follows Swiggy/Zomato email verification pattern
 */
export const PartnerVerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const email = location.state?.email || "your email";
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <Link to="/">
                <img
                  src={isDark ? "/horizontal-no-tagline-fff-transparent-3000x750.png" : "/wyshkit-business-logo.png"}
                  alt="Wyshkit Partner Portal"
                  className="h-12"
                />
              </Link>
            </div>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Mail className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="font-medium text-lg">{email}</p>
            </div>

            <Alert>
              <AlertDescription className="text-sm space-y-2">
                <p><strong>Next steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Check your inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>You'll be redirected to complete onboarding</li>
                  <li>Submit KYC documents for admin approval</li>
                  <li>Start managing your business!</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Button
              className="w-full h-12"
              onClick={() => navigate("/partner/login")}
            >
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email?{" "}
                <button className="text-primary underline hover:no-underline">
                  Resend verification email
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

