/**
 * Sourcing Limits Types
 * Feature 11: PROMPT 11
 */

export interface SourcingUsage {
  id: string;
  product_id: string;
  partner_id: string; // Reseller who sourced
  month: string; // YYYY-MM format
  units_sourced: number;
  last_updated: string;
}

export interface SourcingStatus {
  product_id: string;
  product_name: string;
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical' | 'reached';
}

