import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CustomerMobileHeader } from "@/components/customer/shared/CustomerMobileHeader";
import { RouteMap } from "@/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User } from "lucide-react";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type SignupStep = 'phone' | 'otp' | 'profile' | 'email';

export const CustomerMobileSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<SignupStep>('phone');
  const [loading, setLoading] = useState(false);
  
  // Mobile OTP states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Profile states (optional after OTP)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // Email/password states (secondary option)
  const [password, setPassword] = useState("");
  
  // Resend OTP timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);
  
  // Auto-focus OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        const firstInput = document.querySelector('[data-otp-input]') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [step]);

  // Send OTP - Backend only (Supabase)
  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: {
          channel: 'sms',
          data: {
            // Mark as new signup
            is_signup: true,
          },
        },
      });
      
      if (error) throw error;

      setOtpSent(true);
      setStep('otp');
      setResendTimer(60); // 60 second countdown
      // Swiggy 2025: Silent operation - step change indicates OTP sent
    } catch (error: unknown) {
      toast({
        title: "Failed to send OTP",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP - Backend only (Supabase)
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      });
      
      if (error) throw error;
      
      // Check if user is new (no email or name in metadata)
      const isNew = !data.user?.user_metadata?.full_name && !data.user?.email;
      setIsNewUser(isNew);
      
      if (isNew) {
        // New user - show profile step (optional)
        setStep('profile');
      } else {
        // Existing user - redirect to home
        // Swiggy 2025: Silent operation - navigation confirms success
        navigate(RouteMap.home());
      }
    } catch (error: unknown) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    await handleSendOTP();
  };

  // Complete profile (optional - Swiggy pattern: can skip) - Backend only
  const handleCompleteProfile = async () => {
    setLoading(true);
    try {
      // Update user metadata with name and email (if provided)
      const updates: Record<string, string> = {};
      if (name) updates.full_name = name;
      if (email) updates.email = email;
      
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser({
          data: updates,
        });
        if (error) throw error;
      }
      
      // Swiggy 2025: Silent operation - navigation confirms success
      navigate(RouteMap.home());
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Skip profile (Swiggy pattern - allows skipping) - Backend only
  const handleSkipProfile = async () => {
    // User already authenticated via OTP, just navigate
    navigate(RouteMap.home());
  };

  // Email/password signup (secondary option) - Backend only
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: window.location.origin + RouteMap.home(),
        },
      });
      
      if (error) throw error;

      if (data.session) {
        // Swiggy 2025: Silent operation - navigation confirms success
        navigate(RouteMap.home());
      } else {
        // Swiggy 2025: Silent operation - navigate to login (email verification UI will show message)
        navigate(RouteMap.login());
      }
    } catch (error: unknown) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth signup - Backend only
  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + RouteMap.home(),
        },
      });
      
      if (error) throw error;
    } catch (error: unknown) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mask phone for display (Swiggy pattern: +91 XXXX XX XXXX)
  const maskPhone = (num: string) => {
    if (num.length !== 10) return num;
    return `+91 ${num.slice(0, 4)} XX ${num.slice(6)}`;
  };

  // Smart back button handler (Swiggy 2025 pattern)
  const handleBackClick = () => {
    const redirect = searchParams.get('redirect');
    // If we have a valid redirect and it's not a login/signup page, go there
    if (redirect && redirect !== '/login' && redirect !== '/signup') {
      navigate(redirect);
    } else {
      // Otherwise, go home
      navigate(RouteMap.home());
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomerMobileHeader 
        showBackButton 
        title={
          step === 'otp' ? 'Verify OTP' : 
          step === 'profile' ? 'Complete Profile' : 
          step === 'email' ? 'Create account' : 
          'Create account'
        }
        onBackClick={handleBackClick}
      />
      <div className="flex-1 flex items-center justify-center p-4 pb-[112px]">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {step === 'otp' ? 'Enter OTP' : 
               step === 'profile' ? 'Complete your profile' : 
               step === 'email' ? 'Create account' : 
               'Create account'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 'otp' 
                ? `Verification code sent to ${maskPhone(phone)}`
                : step === 'profile'
                ? 'Add your details (optional)'
                : step === 'email'
                ? 'Start your gifting journey'
                : 'Start your gifting journey'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mobile OTP Flow (PRIMARY - Swiggy 2025 Pattern) */}
            {step === 'phone' && (
              <>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium">
                      Enter your mobile number
                    </Label>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      disabled={loading}
                      error={false}
                      required
                    />
                  </div>
                  <Button
                    onClick={handleSendOTP}
                    className="w-full h-12 text-base font-semibold"
                    disabled={loading || phone.length !== 10}
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Continue
                  </Button>
                </div>

                {/* Secondary Options (Small links below - Swiggy pattern) */}
                <div className="pt-4 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setStep('email')}
                    >
                      Sign up with Email →
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                      onClick={handleGoogleSignup}
                      disabled={loading}
                    >
                      Sign up with Google →
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* OTP Verification Step */}
            {step === 'otp' && (
              <>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      disabled={loading}
                      onComplete={handleVerifyOTP}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    
                    <div className="text-center space-y-2">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                      >
                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                      </Button>
                      <div>
                        <Button
                          type="button"
                          variant="link"
                          className="text-sm text-muted-foreground"
                          onClick={() => {
                            setStep('phone');
                            setOtp('');
                            setOtpSent(false);
                          }}
                        >
                          Change Number
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleVerifyOTP}
                    className="w-full h-12 text-base font-semibold"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Verify & Continue
                  </Button>
                </div>
              </>
            )}

            {/* Profile Setup Step (Optional - Swiggy pattern) */}
            {step === 'profile' && (
              <>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name (Optional)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          className="pl-9"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add email to receive order updates and offers
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleCompleteProfile}
                      className="w-full h-12 text-base font-semibold"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Continue
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                      onClick={handleSkipProfile}
                      disabled={loading}
                    >
                      Skip for now
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Email/Password Flow (SECONDARY) */}
            {step === 'email' && (
              <>
                <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-label="Google">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
                  Continue with Google
            </Button>

            <div className="text-center text-sm">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-normal text-sm"
                    onClick={() => setStep('phone')}
                  >
                    ← Sign up with Mobile
                  </Button>
                </div>
              </>
            )}

            {/* Sign in link */}
            <div className="text-center text-sm pt-4">
              <span className="text-muted-foreground">Already have an account? </span>
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => navigate(RouteMap.login())}
              >
                Sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

