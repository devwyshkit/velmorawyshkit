import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface LoginPromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginPromptSheet = ({ isOpen, onClose }: LoginPromptSheetProps) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate("/customer/login");
  };

  const handleSignup = () => {
    onClose();
    navigate("/customer/signup");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-auto rounded-t-xl sm:max-w-[480px] sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Grabber */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-4">
          <h2 className="text-xl font-semibold">Sign in to continue</h2>
        </div>

        {/* Content */}
        <div className="px-4 pb-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign in to add items to your cart and complete your purchase
          </p>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full h-12 text-base"
              size="lg"
            >
              Sign In with Email
            </Button>

            <Button
              onClick={handleSignup}
              variant="outline"
              className="w-full h-12 text-base"
              size="lg"
            >
              Create New Account
            </Button>
          </div>

          {/* Continue as Guest */}
          <div className="text-center pt-2">
            <button
              onClick={onClose}
              className="text-sm text-primary hover:underline"
            >
              Continue browsing as guest
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

