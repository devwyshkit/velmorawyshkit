/**
 * Referral Program Page
 * Feature 8: PROMPT 7
 * Refer other partners and earn rewards
 */

import { useState, useEffect } from "react";
import { Copy, Share2, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/integrations/supabase-client";
import { QRCodeSVG } from 'qrcode.react';
import type { Referral, ReferralStats } from "@/types/referrals";

export const ReferralProgram = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total_referred: 0,
    successful: 0,
    pending: 0,
    total_earned: 0,
    conversion_rate: 0,
  });

  // Generate referral code from partner name
  const referralCode = user?.name 
    ? `GIFT-${user.name.toUpperCase().replace(/\s+/g, '').slice(0, 4)}-2025`
    : 'GIFT-PARTNER-2025';
  
  const referralLink = `https://wyshkit.com/partner/signup?ref=${referralCode}`;

  useEffect(() => {
    if (user) {
      loadReferrals();
    }
  }, [user]);

  const loadReferrals = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Referrals fetch failed:', error);
        setReferrals([]);
      } else {
        setReferrals(data || []);
        calculateStats(data || []);
      }
    } catch (error) {
      console.error('Load referrals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (referralsData: Referral[]) => {
    const successful = referralsData.filter(r => r.status === 'complete').length;
    const pending = referralsData.filter(r => r.status === 'pending').length;
    const total_earned = successful * 500;

    setStats({
      total_referred: referralsData.length,
      successful,
      pending,
      total_earned,
      conversion_rate: referralsData.length > 0 ? (successful / referralsData.length) * 100 : 0,
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Code copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join Wyshkit as a Partner',
      text: `Join Wyshkit as a partner! Use my code ${referralCode} for priority approval. You get ₹500 credit, I get ₹500 bonus after your 5th order.`,
      url: referralLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy link
        navigator.clipboard.writeText(referralLink);
        toast({
          title: "Link copied!",
          description: "Referral link copied to clipboard",
        });
      }
    } catch (error) {
      // User cancelled or error
      console.log('Share cancelled');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Program</h1>
        <p className="text-muted-foreground">
          Refer partners and earn ₹500 per successful referral
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <h3 className="text-lg font-semibold mb-2">Your Referral Code</h3>
              <div className="flex items-center gap-3 mb-4">
                <code className="text-2xl font-mono font-bold">{referralCode}</code>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
              <p className="text-sm opacity-90">
                Share this code with potential partners. You both earn ₹500 after their 5th order!
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={referralLink} size={128} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold">{stats.total_referred}</p>
            <p className="text-sm text-muted-foreground">Total Referred</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.successful}</p>
            <p className="text-sm text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-primary">₹{stats.total_earned}</p>
            <p className="text-sm text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Share your referral code</p>
                <p className="text-sm text-muted-foreground">
                  Send your unique code to potential partners via WhatsApp, email, or social media
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">They sign up using your code</p>
                <p className="text-sm text-muted-foreground">
                  New partners must complete KYC and get approved
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Earn rewards after 5 successful orders</p>
                <p className="text-sm text-muted-foreground">
                  You both get ₹500 credited within 24 hours (no disputes required)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals List */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.map(referral => (
                <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Referee #{referral.referee_id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {referral.orders_completed}/5 orders completed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(referral.orders_completed / 5) * 100} className="w-24 h-2" />
                    {referral.status === 'complete' ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ ₹500
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

