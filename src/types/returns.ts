/**
 * Returns & Refunds Types
 * Feature 10: PROMPT 3
 */

export type ReturnReason = 'wrong_item' | 'damaged' | 'not_as_described' | 'changed_mind' | 'other';

export type ReturnStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'pickup_scheduled' 
  | 'item_received' 
  | 'qc_done' 
  | 'refunded';

export type QCStatus = 'good' | 'damaged' | 'mismatch';

export type RefundStatus = 'pending' | 'processing' | 'completed';

export interface Return {
  id: string;
  order_id: string;
  customer_id: string;
  partner_id: string;
  reason: ReturnReason;
  status: ReturnStatus;
  requested_at: string;
  approved_at?: string;
  pickup_scheduled_at?: string;
  qc_status?: QCStatus;
  refund_amount?: number;
  refund_status?: RefundStatus;
  photos: string[]; // Customer evidence
  qc_photos?: string[]; // Partner QC photos
  rejection_reason?: string;
  customer_name?: string;
  product_name?: string;
}

export interface ReturnEvent {
  id: string;
  return_id: string;
  event_type: string;
  notes?: string;
  created_at: string;
}

