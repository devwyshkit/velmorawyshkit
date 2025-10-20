/**
 * Dispute Resolution Types
 * Feature 9: PROMPT 2
 */

export type DisputeStatus = 'open' | 'resolved' | 'escalated';

export type ResolutionType = 'full_refund' | 'partial_refund' | 'replacement' | 'rejected';

export type DisputeSenderType = 'customer' | 'partner' | 'admin';

export interface Dispute {
  id: string;
  order_id: string;
  customer_id: string;
  partner_id: string;
  issue: string;
  status: DisputeStatus;
  reported_at: string;
  resolved_at?: string;
  evidence_urls: string[]; // Cloudinary URLs
  response?: string;
  resolution_type?: ResolutionType;
  refund_amount?: number;
  customer_name?: string;
  order_number?: string;
}

export interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_type: DisputeSenderType;
  message: string;
  created_at: string;
  attachments?: string[];
}

export interface DisputeStats {
  open_count: number;
  avg_resolution_time_hours: number;
  resolution_rate: number;
  common_issues: Array<{
    issue: string;
    count: number;
  }>;
}

