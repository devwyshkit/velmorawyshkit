/**
 * Zoho Books Mock API Client
 * For development - avoids real API costs
 * Replace with real Zoho Books API in production
 */

export interface CommissionInvoice {
  invoice_id: string;
  partner_id: string;
  month: string;
  total_revenue: number; // in paise
  commission_percent: number;
  commission_amount: number; // in paise
  status: 'draft' | 'sent' | 'paid';
  invoice_url: string;
  created_at: string;
}

export interface Payout {
  payment_id: string;
  partner_id: string;
  amount: number; // in paise
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_date: string;
  invoice_id?: string;
}

export interface FinancialReport {
  total_revenue: number;
  total_commission: number;
  total_payouts: number;
  pending_payouts: number;
  partner_count: number;
  period: { start: string; end: string };
}

/**
 * Mock Zoho Books API Client
 */
export const zohoBooksMock = {
  /**
   * Create monthly commission invoice for a partner
   */
  createCommissionInvoice: async (
    partnerId: string,
    month: string,
    revenueData: { totalRevenue: number; commissionPercent: number }
  ): Promise<CommissionInvoice> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const commissionAmount = Math.round(
      (revenueData.totalRevenue * revenueData.commissionPercent) / 100
    );

    return {
      invoice_id: `INV-${Date.now()}-${partnerId.slice(0, 8)}`,
      partner_id: partnerId,
      month: month,
      total_revenue: revenueData.totalRevenue,
      commission_percent: revenueData.commissionPercent,
      commission_amount: commissionAmount,
      status: 'sent',
      invoice_url: `https://mock-zoho-books.com/invoice/${partnerId}/${month}`,
      created_at: new Date().toISOString(),
    };
  },

  /**
   * Record a payout to partner
   */
  recordPayout: async (partnerId: string, amount: number, invoiceId?: string): Promise<Payout> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      payment_id: `PAY-${Date.now()}-${partnerId.slice(0, 8)}`,
      partner_id: partnerId,
      amount: amount,
      status: 'completed',
      transaction_date: new Date().toISOString(),
      invoice_id: invoiceId,
    };
  },

  /**
   * Get financial report for date range
   */
  getFinancialReport: async (startDate: string, endDate: string): Promise<FinancialReport> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Mock data - would be calculated from actual orders in production
    return {
      total_revenue: 5000000, // ₹50,000
      total_commission: 1000000, // ₹10,000 (20% avg)
      total_payouts: 900000, // ₹9,000 (paid out)
      pending_payouts: 100000, // ₹1,000 (pending)
      partner_count: 25,
      period: { start: startDate, end: endDate },
    };
  },

  /**
   * Get partner's invoices
   */
  getPartnerInvoices: async (partnerId: string): Promise<CommissionInvoice[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock: Return last 3 months of invoices
    const months = ['2024-01', '2024-02', '2024-03'];
    return months.map((month, idx) => ({
      invoice_id: `INV-${Date.now() - idx * 1000}-${partnerId.slice(0, 8)}`,
      partner_id: partnerId,
      month: month,
      total_revenue: 250000 + idx * 50000, // Increasing revenue
      commission_percent: 20,
      commission_amount: 50000 + idx * 10000,
      status: idx === 0 ? 'sent' : 'paid',
      invoice_url: `https://mock-zoho-books.com/invoice/${partnerId}/${month}`,
      created_at: new Date(2024, idx, 1).toISOString(),
    }));
  },

  /**
   * Download invoice PDF (mock)
   */
  downloadInvoice: async (invoiceId: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return `https://mock-zoho-books.com/download/${invoiceId}.pdf`;
  },
};

/**
 * Calculate monthly commission from orders
 * This would query actual orders in production
 */
export async function calculateMonthlyCommission(partnerId: string, month: string) {
  // Mock calculation - in production, query orders from Supabase
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    totalRevenue: 250000, // ₹2,500
    totalOrders: 15,
    commissionPercent: 20,
    commissionAmount: 50000, // ₹500
  };
}

