/**
 * Commission Management Types
 * Swiggy/Zomato-style dynamic commission calculation
 */

export interface CommissionRule {
  id: string;
  rule_name: string;
  rule_type: 'default' | 'category' | 'vendor' | 'volume';
  
  // Applicability
  category_id?: string;
  vendor_id?: string;
  
  // Order Criteria
  order_value_min: number; // in paise
  order_value_max?: number | null; // in paise, null for unlimited
  order_quantity_min: number;
  order_quantity_max?: number | null;
  
  // Commission
  commission_percent: number; // 0-100
  
  // Status & Timing
  is_active: boolean;
  effective_from: Date;
  effective_until?: Date | null;
  
  // Priority (lower number = higher priority)
  priority: number;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface VendorCommissionOverride {
  id: string;
  vendor_id: string;
  commission_percent: number;
  reason?: string;
  is_active: boolean;
  effective_from: Date;
  effective_until?: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface CommissionCalculation {
  commission_amount: number; // in paise
  commission_percent: number;
  vendor_payout: number; // order_value - commission_amount, in paise
  applied_rule_id: string;
  rule_name: string;
}

// Admin form data for creating/editing commission rules
export interface CommissionRuleFormData {
  rule_name: string;
  rule_type: 'default' | 'category' | 'vendor' | 'volume';
  category_id?: string;
  vendor_id?: string;
  order_value_min: number;
  order_value_max?: number;
  order_quantity_min: number;
  order_quantity_max?: number;
  commission_percent: number;
  effective_from: Date;
  effective_until?: Date;
  priority: number;
}

// Admin form data for vendor commission override
export interface VendorCommissionOverrideFormData {
  vendor_id: string;
  commission_percent: number;
  reason?: string;
  effective_from: Date;
  effective_until?: Date;
}

