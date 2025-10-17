import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationBannerProps {
  email: string;
}

export const EmailVerificationBanner = ({ email }: EmailVerificationBannerProps) => {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
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

