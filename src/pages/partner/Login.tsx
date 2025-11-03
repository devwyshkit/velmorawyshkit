import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/integrations/supabase-client";
import { Smartphone, AlertCircle, Store } from "lucide-react";

/**
 * Partner Login Page - Swiggy 2025 Mobile-First Pattern
 * Phone OTP primary login (no email/password)
 * No dark mode, no animations
 * Full-page design (no Card wrapper on mobile)
 */
export const PartnerLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedStore, setValidatedStore] = useState<{ id: string; name: string } | null>(null);

  const handleGoogleLogin = async () => {
    // Note: Google OAuth for partners will need store validation after callback
    // For MVP, this follows standard OAuth flow - store validation can be added post-OAuth
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/partner/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      // OAuth redirect handles success - store validation should happen in PartnerLayout/ProtectedRoute
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };


  const handleSendOTP = async () => {
    // Validate Store ID first
    if (!storeId || storeId.trim().length === 0) {
      setError("Please enter your Store ID");
      return;
    }

    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Validate store exists and get owner_id
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, owner_id, slug')
        .eq('slug', storeId.trim().toLowerCase())
        .single();

      if (storeError || !storeData) {
        throw new Error('Store not found. Please check your Store ID.');
      }

      // Step 2: Check if phone number belongs to the store owner
      // First, try to find user by phone
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('id, phone')
        .eq('phone', `+91${phone}`)
        .single();

      // Also check auth.users if user_profiles doesn't have it
      if ((userError || !userData) && storeData.owner_id) {
        // Check if owner_id matches any user (we'll verify after OTP)
        // For now, allow OTP to be sent and verify ownership in handleVerifyOTP
      }

      // Store validated store info for later verification
      setValidatedStore({ id: storeData.id, name: storeData.name });

      // Step 3: Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: {
          channel: 'sms',
        },
      });

      if (otpError) throw otpError;

      // Silent success - UI state change (otpSent = true) indicates success
      setOtpSent(true);
    } catch (error: any) {
      setError(error.message || "Failed to send OTP. Please try again.");
      setValidatedStore(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    if (!validatedStore) {
      setError("Store validation failed. Please start over.");
      setOtpSent(false);
      setOtp("");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('Authentication failed. Please try again.');
      }

      // Verify user has 'partner' or 'seller' role (normalized to 'seller' in AuthContext)
      const role = data.user?.user_metadata?.role || data.user?.app_metadata?.role;
      
      if (role !== 'partner' && role !== 'seller') {
        await supabase.auth.signOut();
        throw new Error('This account is not registered as a partner. Please use customer login.');
      }

      // Verify store ownership: Check if authenticated user owns the validated store
      const { data: storeOwnerData, error: ownerError } = await supabase
        .from('stores')
        .select('owner_id')
        .eq('id', validatedStore.id)
        .eq('owner_id', data.user.id)
        .single();

      if (ownerError || !storeOwnerData) {
        await supabase.auth.signOut();
        throw new Error('This mobile number is not registered with this store. Please contact support if you believe this is an error.');
      }

      // Role will be normalized to 'seller' in AuthContext for consistency
      // Store ownership verified - proceed to dashboard

      // Silent success - navigation implies success
      navigate("/partner/dashboard");
    } catch (error: any) {
      setError(error.message || "Invalid OTP. Please try again.");
      // Reset states on error
      setOtpSent(false);
      setOtp("");
      setValidatedStore(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile-first: Full-page layout, no Card wrapper */}
      <div className="flex-1 flex flex-col p-4 md:p-8 md:items-center md:justify-center">
        <div className="w-full max-w-md mx-auto space-y-6 md:space-y-8">
          {/* Logo */}
          <div className="flex justify-center pt-8 md:pt-0">
            <Link to="/">
              <img
                src="/wyshkit-business-logo.png"
                alt="Wyshkit Partner Portal"
                className="h-12 cursor-pointer"
                width="200"
                height="48"
              />
            </Link>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">Partner Login</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your gift business
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Google OAuth - Swiggy standard */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12"
              type="button"
              disabled={loading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Connecting..." : "Continue with Google"}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Phone OTP - Primary Login Method (Swiggy Pattern: Store ID + Mobile) */}
            {!otpSent ? (
              <div className="space-y-4">
                {/* Store ID Input (Swiggy: Restaurant ID equivalent) */}
                <div className="space-y-2">
                  <Label htmlFor="storeId">Store ID</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="storeId"
                      type="text"
                      placeholder="gift-masters"
                      className="pl-10 lowercase"
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your store ID (e.g., gift-masters)
                  </p>
                </div>

                {/* Mobile Number Input */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9740803490"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send a 6-digit OTP to verify your number
                  </p>
                </div>
                <Button
                  onClick={handleSendOTP}
                  className="w-full h-12"
                  disabled={loading || phone.length !== 10 || !storeId.trim()}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    OTP sent to +91{phone}
                  </p>
                </div>
                <Button
                  onClick={handleVerifyOTP}
                  className="w-full h-12"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setValidatedStore(null);
                  }}
                  className="w-full"
                >
                  Change Number
                </Button>
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  New to Wyshkit?
                </span>
              </div>
            </div>

            {/* Signup Link */}
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => navigate("/partner/signup")}
              type="button"
            >
              Create Partner Account
            </Button>

            {/* Help Text */}
            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link to="/partner-terms" className="underline hover:text-primary">
                Partner Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
