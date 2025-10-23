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
// WYSHKIT SUPPLY (B2B PROCUREMENT)
// ============================================================================

export interface Brand {
  id: string;
  brand_name: string;
  brand_logo?: string;
  description?: string;
  is_verified: boolean;
  warehouse_location?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface SupplyProduct {
  id: string;
  brand_id: string;
  brand?: Brand; // Joined data
  
  product_name: string;
  product_description?: string;
  product_images: string[];
  
  // Pricing
  wholesale_price: number; // in paise
  retail_price?: number; // MRP, in paise
  margin_opportunity?: number; // retail_price - wholesale_price
  
  // Ordering
  minimum_order_qty: number;
  maximum_order_qty?: number;
  
  // Stock & Delivery
  stock_available: number;
  lead_time_days: number;
  
  // Additional Info
  warranty_info?: string;
  technical_specs?: Record<string, any>;
  category?: string;
  
  is_active: boolean;
  created_at: string;
}

export interface SupplyOrderItem {
  supply_product_id: string;
  product_name: string;
  quantity: number;
  price_per_unit: number; // in paise
  subtotal: number; // in paise
}

export interface SupplyOrder {
  id: string;
  order_number: string;
  partner_id: string;
  
  items: SupplyOrderItem[];
  
  // Pricing
  subtotal: number; // in paise
  platform_fee: number; // 7% of subtotal, in paise
  gst_amount: number; // 18%, in paise
  delivery_fee: number; // in paise
  total_amount: number; // in paise
  
  // Delivery
  delivery_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    contact_name: string;
    contact_phone: string;
  };
  
  // Status
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Tracking
  tracking_info?: Record<string, any>;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  invoice_url?: string;
  
  notes?: string;
  created_at: string;
  updated_at: string;
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

