/**
 * Referrals Hook
 * Feature 7: PROMPT 7 - Referral Program
 * Supabase queries and real-time subscriptions for referrals
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/integrations/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface Referral {
  id: string;
  referrer_id: string;
  referee_id?: string;
  referee_name?: string;
  referee_email?: string;
  code: string;
  status: 'pending' | 'in_progress' | 'complete' | 'rejected';
  orders_completed: number;
  reward_amount: number;
  completed_at?: string;
  created_at: string;
}

interface ReferralStats {
  total: number;
  successful: number;
  pending: number;
  totalEarned: number;
  conversionRate: number;
}

/**
 * Hook to manage referrals data
 * Fetches referrals and subscribes to real-time updates
 */
export const useReferrals = (partnerId: string) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    successful: 0,
    pending: 0,
    totalEarned: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    if (partnerId) {
      loadReferrals();
      subscribeToReferralUpdates();
    }
  }, [partnerId]);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('partner_referrals')
        .select('*')
        .eq('referrer_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Referrals fetch failed, using mock data:', error);
        // Mock data for development
        setReferrals([
          {
            id: '1',
            referrer_id: partnerId,
            referee_name: 'Sweet Delights',
            referee_email: 'sweet@example.com',
            code: `WYSH-${partnerId.slice(0, 4).toUpperCase()}`,
            status: 'in_progress',
            orders_completed: 3,
            reward_amount: 500,
            created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          },
          {
            id: '2',
            referrer_id: partnerId,
            referee_name: 'Tech Gifts Co',
            referee_email: 'tech@example.com',
            code: `WYSH-${partnerId.slice(0, 4).toUpperCase()}`,
            status: 'complete',
            orders_completed: 5,
            reward_amount: 500,
            completed_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
        ]);
      } else {
        setReferrals(data || []);
      }
    } catch (error) {
      console.error('Load referrals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToReferralUpdates = () => {
    const channel = supabase
      .channel('referrals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_referrals',
          filter: `referrer_id=eq.${partnerId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReferrals(prev => [payload.new as Referral, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setReferrals(prev =>
              prev.map(r => r.id === payload.new.id ? payload.new as Referral : r)
            );
            
            // Show toast if referral completed
            const updated = payload.new as Referral;
            if (updated.status === 'complete') {
              toast({
                title: "Referral completed!",
                description: `${updated.referee_name} completed 5 orders! ₹500 credited.`,
                duration: 5000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Calculate stats whenever referrals change
  useEffect(() => {
    const successful = referrals.filter(r => r.status === 'complete').length;
    const pending = referrals.filter(r => r.status === 'pending' || r.status === 'in_progress').length;
    const totalEarned = referrals
      .filter(r => r.status === 'complete')
      .reduce((sum, r) => sum + r.reward_amount, 0);
    const conversionRate = referrals.length > 0
      ? (successful / referrals.length) * 100
      : 0;

    setStats({
      total: referrals.length,
      successful,
      pending,
      totalEarned,
      conversionRate,
    });
  }, [referrals]);

  return {
    loading,
    referrals,
    stats,
    refresh: loadReferrals,
  };
};

