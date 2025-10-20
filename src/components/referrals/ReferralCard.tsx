/**
 * Referral Card Component
 * Feature 7: PROMPT 7 - Referral Program
 * Displays partner's referral code with copy/share actions
 * Mobile-first design (320px base)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, QrCode as QrCodeIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeGenerator } from "./QRCodeGenerator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface ReferralCardProps {
  code: string;
  partnerId: string;
  partnerName: string;
}

/**
 * Main Referral Code Display Card
 * Prominent card with code, copy, share, and QR code actions
 * Follows Swiggy's referral card pattern
 */
export const ReferralCard = ({ code, partnerId, partnerName }: ReferralCardProps) => {
  const { toast } = useToast();
  const [showQR, setShowQR] = useState(false);

  const referralUrl = `https://wyshkit.com/partner/signup?ref=${code}`;

  const shareMessage = `Join Wyshkit as a partner! Use my code ${code} for priority approval. You get ₹500 credit, I get ₹500 bonus after your 5th order. Sign up: ${referralUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied!",
        description: "Referral code copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Code copied!",
        description: "Referral code copied to clipboard",
        duration: 2000,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Wyshkit as a Partner',
          text: shareMessage,
          url: referralUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== 'AbortError') {
          // Fallback to copy
          handleCopy();
        }
      }
    } else {
      // No native share - copy link instead
      try {
        await navigator.clipboard.writeText(referralUrl);
        toast({
          title: "Link copied!",
          description: "Share this link with potential partners",
          duration: 2000,
        });
      } catch (error) {
        toast({
          title: "Share not supported",
          description: "Please copy the code manually",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Your Referral Code</CardTitle>
        <p className="text-sm text-muted-foreground">
          Share with other businesses to earn ₹500 per successful referral
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Code - Large Display */}
        <div className="p-4 bg-background rounded-lg border-2 border-dashed border-primary/30">
          <p className="text-center text-3xl font-bold font-mono tracking-wider text-primary">
            {code}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3 gap-1"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            <span className="text-xs">Copy</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-3 gap-1"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            <span className="text-xs">Share</span>
          </Button>

          <Sheet open={showQR} onOpenChange={setShowQR}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-col h-auto py-3 gap-1"
              >
                <QrCodeIcon className="h-4 w-4" />
                <span className="text-xs">QR Code</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[400px]">
              <SheetHeader>
                <SheetTitle>Referral QR Code</SheetTitle>
              </SheetHeader>
              <div className="py-6 flex flex-col items-center gap-4">
                <QRCodeGenerator value={referralUrl} size={200} />
                <div className="text-center space-y-1">
                  <p className="font-medium">{code}</p>
                  <p className="text-sm text-muted-foreground">
                    Scan to signup with your referral code
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* How It Works */}
        <div className="pt-3 border-t space-y-2">
          <p className="text-sm font-medium">How it works:</p>
          <ol className="text-xs text-muted-foreground space-y-1 pl-4">
            <li>1. Share your code with potential partners</li>
            <li>2. They sign up using your code</li>
            <li>3. After their 5th order, you both get ₹500</li>
          </ol>
        </div>

        {/* Conditions */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>• Referee must complete KYC verification</p>
          <p>• Reward credited within 24 hours after 5th order</p>
          <p>• Self-referrals not allowed</p>
        </div>
      </CardContent>
    </Card>
  );
};

