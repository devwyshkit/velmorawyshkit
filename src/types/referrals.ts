/**
 * Referral Program Types
 * Feature 8: PROMPT 7
 */

export type ReferralStatus = 'pending' | 'in_progress' | 'complete' | 'rejected';

export interface Referral {
  id: string;
  referrer_id: string; // Partner who referred
  referee_id: string; // New partner who signed up
  code: string; // Referral code used
  status: ReferralStatus;
  orders_completed: number; // Referee's order count
  reward_amount: number; // 500 for both
  completed_at?: string;
  created_at: string;
}

export interface ReferralCode {
  code: string;
  partner_id: string;
  created_at: string;
  uses_count: number;
  max_uses?: number;
}

export interface ReferralStats {
  total_referred: number;
  successful: number;
  pending: number;
  total_earned: number;
  conversion_rate: number;
}

