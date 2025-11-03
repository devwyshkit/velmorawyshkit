import { useState } from "react";
import { Mail, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/integrations/supabase-client";

interface EmailVerificationBannerProps {
  email: string;
}

export const EmailVerificationBanner = ({ email }: EmailVerificationBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setResending(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      // Swiggy 2025: Silent operation - inline message already shown in banner
      // Success is implied by "Sending..." state changing back
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again later");
    } finally {
      setResending(false);
    }
  };

  if (dismissed) return null;

  return (
    <div className="relative bg-warning/10 border-b border-warning/20">
      <div className="flex items-center justify-between gap-3 px-4 py-3 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Mail className="h-4 w-4 text-warning flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-warning-foreground">
              Please verify your email to unlock all features.{" "}
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-primary underline hover:no-underline font-medium"
              >
                {resending ? "Sending..." : "Resend email"}
              </button>
            </p>
            {/* Inline error message */}
            {error && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

