/**
 * Partner Platform Data Integration
 * Supabase functions for partner dashboard, onboarding, orders, and earnings
 */

import { supabase } from './supabase-client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PartnerAccount {
  id: string;
  partner_id?: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  onboarding_step: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerKYC {
  id: string;
  partner_account_id: string;
  fssai_license?: string;
  fssai_expiry?: string;
  gst_number?: string;
  pan_number?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_account_name?: string;
  shop_license?: string;
  documents_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

export interface PartnerOrder {
  id: string;
  partner_id: string;
  order_number: string;
  customer_name?: string;
  items: any; // JSONB
  total_amount: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface PartnerEarnings {
  id: string;
  partner_id: string;
  order_id?: string;
  amount: number;
  commission_rate: number;
  commission_amount?: number;
  net_amount?: number;
  payout_status: 'pending' | 'processing' | 'paid';
  payout_date?: string;
  created_at: string;
}

// ============================================
// PARTNER ACCOUNT FUNCTIONS
// ============================================

/**
 * Get partner account for current user
 */
export const getPartnerAccount = async (): Promise<PartnerAccount | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('partner_accounts')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch partner account:', error);
    return null;
  }
};

/**
 * Create partner account
 */
export const createPartnerAccount = async (accountData: Partial<PartnerAccount>): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('partner_accounts')
      .insert({
        id: user.id,
        ...accountData,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Failed to create partner account:', error);
    return null;
  }
};

/**
 * Update onboarding step
 */
export const updateOnboardingStep = async (step: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('partner_accounts')
      .update({ onboarding_step: step })
      .eq('id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update onboarding step:', error);
    return false;
  }
};

/**
 * Submit partner for approval
 */
export const submitPartnerForApproval = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error} = await supabase
      .from('partner_accounts')
      .update({ 
        onboarding_completed: true,
        status: 'pending'
      })
      .eq('id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to submit for approval:', error);
    return false;
  }
};

// ============================================
// PARTNER KYC FUNCTIONS
// ============================================

/**
 * Get partner KYC data
 */
export const getPartnerKYC = async (): Promise<PartnerKYC | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('partner_kyc')
      .select('*')
      .eq('partner_account_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data;
  } catch (error) {
    console.error('Failed to fetch KYC:', error);
    return null;
  }
};

/**
 * Upsert partner KYC data
 */
export const upsertPartnerKYC = async (kycData: Partial<PartnerKYC>): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('partner_kyc')
      .upsert({
        partner_account_id: user.id,
        ...kycData,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to upsert KYC:', error);
    return false;
  }
};

// ============================================
// PARTNER ORDERS FUNCTIONS
// ============================================

/**
 * Fetch partner orders with optional status filter
 */
export const fetchPartnerOrders = async (status?: string): Promise<PartnerOrder[]> => {
  try {
    const account = await getPartnerAccount();
    if (!account?.partner_id) return [];

    let query = supabase
      .from('partner_orders')
      .select('*')
      .eq('partner_id', account.partner_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('partner_orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update order status:', error);
    return false;
  }
};

/**
 * Subscribe to realtime partner orders
 */
export const subscribeToPartnerOrders = (
  partnerId: string,
  callback: (order: PartnerOrder) => void
) => {
  return supabase
    .channel('partner-orders')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'partner_orders',
        filter: `partner_id=eq.${partnerId}`,
      },
      (payload) => {
        callback(payload.new as PartnerOrder);
      }
    )
    .subscribe();
};

// ============================================
// PARTNER EARNINGS FUNCTIONS
// ============================================

/**
 * Fetch partner earnings summary
 */
export const getPartnerEarnings = async (dateRange?: { start: string; end: string }): Promise<PartnerEarnings[]> => {
  try {
    const account = await getPartnerAccount();
    if (!account?.partner_id) return [];

    let query = supabase
      .from('partner_earnings')
      .select('*')
      .eq('partner_id', account.partner_id)
      .order('created_at', { ascending: false });

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch earnings:', error);
    return [];
  }
};

/**
 * Calculate earnings summary
 */
export const calculateEarningsSummary = (earnings: PartnerEarnings[]) => {
  const total = earnings.reduce((sum, e) => sum + e.amount, 0);
  const pending = earnings
    .filter(e => e.payout_status === 'pending')
    .reduce((sum, e) => sum + (e.net_amount || 0), 0);
  const paid = earnings
    .filter(e => e.payout_status === 'paid')
    .reduce((sum, e) => sum + (e.net_amount || 0), 0);

  return { total, pending, paid };
};

// ============================================
// MENU/ITEMS CRUD FUNCTIONS
// ============================================

/**
 * Create item (menu item)
 */
export const createItem = async (itemData: any): Promise<string | null> => {
  try {
    const account = await getPartnerAccount();
    if (!account?.partner_id) return null;

    const { data, error } = await supabase
      .from('items')
      .insert({
        partner_id: account.partner_id,
        ...itemData,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Failed to create item:', error);
    return null;
  }
};

/**
 * Update item
 */
export const updateItem = async (itemId: string, itemData: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('items')
      .update(itemData)
      .eq('id', itemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to update item:', error);
    return false;
  }
};

/**
 * Delete item
 */
export const deleteItem = async (itemId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete item:', error);
    return false;
  }
};

/**
 * Fetch partner items
 */
export const fetchPartnerItems = async (): Promise<any[]> => {
  try {
    const account = await getPartnerAccount();
    if (!account?.partner_id) return [];

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('partner_id', account.partner_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return [];
  }
};

