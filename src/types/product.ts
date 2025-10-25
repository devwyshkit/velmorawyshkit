/**
 * Product Types for Swiggy/Zomato-style Platform
 * Battle-tested patterns from modern e-commerce and food delivery platforms
 */

// ============================================================================
// CORE PRODUCT TYPES
// ============================================================================

export type ListingType = 'individual' | 'hamper' | 'service';

export interface PricingTier {
  minQty: number;
  maxQty: number | null; // null means unlimited
  pricePerItem: number; // in paise
  discountPercent: number;
}

export interface AddOn {
  id: string;
  name: string;
  description?: string;
  price: number; // in paise, per item
  type: 'standard' | 'bulk';
  minimumOrder?: number; // for bulk add-ons (MOQ)
  requiresPreview?: boolean; // vendor must show preview before production
  requiresProof?: boolean; // customer must upload file (logo, design)
}

export interface DeliveryTimeTier {
  minQty: number;
  maxQty: number | null;
  deliveryDays: string; // e.g., "Same day", "2-3 days", "5-7 days"
}

export interface Product {
  id: string;
  partner_id: string;
  
  // Basic Information
  name: string;
  description: string;
  short_desc?: string;
  
  // Listing Configuration
  listingType: ListingType;
  whatsIncluded: string[]; // Itemized list of what's in the package
  
  // Visual Assets
  images: string[];
  
  // Pricing (Swiggy/Zomato pattern - auto-updates based on quantity)
  tieredPricing: PricingTier[];
  
  // Add-ons (Standard always visible, Bulk unlocks at MOQ)
  addOns: AddOn[];
  
  // Delivery
  deliveryTimeTiers: DeliveryTimeTier[];
  
  // Customization
  is_customizable: boolean;
  previewRequired: boolean; // For bulk customization orders
  
  // Inventory
  stock: number;
  is_made_to_order: boolean; // If true, no stock tracking
  
  // Categorization
  category?: string;
  tags: string[];
  
  // Status
  is_active: boolean;
  approval_status?: 'pending_review' | 'approved' | 'rejected' | 'changes_requested';
  rejection_reason?: string;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// CALCULATED PRICING (Runtime)
// ============================================================================

export interface CalculatedPrice {
  quantity: number;
  pricePerItem: number; // in paise
  subtotal: number; // pricePerItem * quantity, in paise
  discountPercent: number;
  appliedTier: PricingTier;
  savings: number; // compared to highest tier, in paise
}

export interface CalculatedAddOns {
  selectedAddOns: AddOn[];
  totalAddOnCost: number; // in paise
  perItemAddOnCost: number; // in paise
  unlockedBulkAddOns: AddOn[]; // Based on current quantity
}

export interface DeliveryFeeCalculation {
  fee: number; // in paise
  isFree: boolean;
  amountNeededForFree: number; // in paise
  message: string; // "Add ₹200 more for FREE delivery!"
}

export interface OrderSummary {
  // Items
  quantity: number;
  pricePerItem: number; // in paise
  itemsSubtotal: number; // in paise
  
  // Add-ons
  addOnsTotal: number; // in paise
  
  // Delivery
  deliveryFee: number; // in paise
  deliveryMessage: string;
  
  // Customization
  hasCustomization: boolean;
  customizationWarning?: string;
  
  // Total
  total: number; // in paise
  
  // Savings
  totalSavings: number; // in paise
  savingsMessage?: string;
}


// ============================================================================
// COMMISSION & FEES
// ============================================================================

export interface CommissionRule {
  id: string;
  rule_name: string;
  rule_type: 'default' | 'category' | 'vendor' | 'volume';
  category_id?: string;
  vendor_id?: string;
  order_value_min: number; // in paise
  order_value_max?: number; // in paise
  order_quantity_min: number;
  order_quantity_max?: number;
  commission_percent: number;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  priority: number;
}

export interface VendorCommissionOverride {
  id: string;
  vendor_id: string;
  commission_percent: number;
  reason?: string;
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
}

export interface CommissionCalculation {
  commission_amount: number; // in paise
  commission_percent: number;
  vendor_payout: number; // in paise
  applied_rule_id: string;
  rule_name: string;
}

export interface DeliveryFeeConfig {
  id: string;
  rule_name: string;
  order_value_min: number; // in paise
  order_value_max?: number; // in paise
  fee_amount: number; // in paise
  distance_min_km: number;
  distance_max_km?: number;
  distance_surcharge: number; // in paise
  is_active: boolean;
  priority: number;
}

// ============================================================================
// PREVIEW WORKFLOW (For Customized Orders)
// ============================================================================

export interface OrderPreview {
  id: string;
  order_id: string;
  preview_url: string;
  preview_type: 'image' | 'pdf' | 'video';
  uploaded_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  customer_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithPreview {
  id: string;
  has_customization: boolean;
  preview_status?: 'not_required' | 'pending' | 'uploaded' | 'approved' | 'rejected';
  preview_url?: string;
  preview_uploaded_at?: string;
  preview_approved_at?: string;
  can_be_refunded: boolean;
}

// ============================================================================
// FORM DATA (For Product Creation/Editing)
// ============================================================================

export interface ProductFormData {
  // Step 1: Listing Type
  listingType: ListingType;
  
  // Step 2: Basic Details
  name: string;
  description: string;
  short_desc?: string;
  category: string;
  whatsIncluded: string[];
  images: string[];
  
  // Step 3: Tiered Pricing
  tieredPricing: PricingTier[];
  
  // Step 4: Add-ons
  addOns: AddOn[];
  
  // Step 5: Inventory & Fulfillment
  stock: number;
  is_made_to_order: boolean;
  deliveryTimeTiers: DeliveryTimeTier[];
  
  // Step 6: Customization
  is_customizable: boolean;
  previewRequired: boolean;
  
  tags: string[];
}

// ============================================================================
// CART & CHECKOUT
// ============================================================================

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedAddOns: AddOn[];
  
  // Calculated values
  calculatedPrice: CalculatedPrice;
  calculatedAddOns: CalculatedAddOns;
  
  // Customization
  customizationDetails?: {
    requestPreview: boolean;
    logoFile?: File;
    instructions?: string;
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number; // in paise
  deliveryFee: DeliveryFeeCalculation;
  total: number; // in paise
  hasCustomizedItems: boolean;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type PriceDisplay = {
  amount: number; // in paise
  formatted: string; // "₹5,000"
};

export type RefundPolicy = {
  isEligible: boolean;
  reason: string;
  deductionAmount?: number; // delivery charges deducted, in paise
  refundAmount?: number; // in paise
};

