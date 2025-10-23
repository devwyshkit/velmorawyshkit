// Tiered Pricing Types for Wyshkit Platform
// Supporting Swiggy/Zomato-like dynamic pricing with MOQ-based add-ons

export type ListingType = 'individual' | 'hamper' | 'service';

export interface PricingTier {
  minQty: number;
  maxQty: number | null;
  pricePerItem: number; // in paise
  discountPercent: number;
}

export interface DeliveryTimeTier {
  minQty: number;
  maxQty: number | null;
  deliveryDays: string;
}

export interface ProductAddOn {
  id: string;
  productId: string;
  name: string;
  description?: string;
  pricePaise: number; // in paise
  minimumOrderQuantity: number;
  requiresProof: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TieredProduct {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  shortDesc?: string;
  listingType: ListingType;
  category: string;
  images: string[];
  whatsIncluded: string[];
  tieredPricing: PricingTier[];
  isMadeToOrder: boolean;
  stockAvailable: number;
  deliveryTimeTiers: DeliveryTimeTier[];
  isCustomizable: boolean;
  previewRequired: boolean;
  isActive: boolean;
  approvalStatus: 'pending_review' | 'approved' | 'rejected' | 'changes_requested';
  rejectionReason?: string;
  addOns: ProductAddOn[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryFeeConfig {
  id: string;
  name: string;
  isActive: boolean;
  freeDeliveryThresholdPaise: number;
  orderValueTiers: Array<{
    minValuePaise: number;
    maxValuePaise: number | null;
    feePaise: number;
  }>;
  distanceMultiplier: Array<{
    minDistance: number;
    maxDistance: number | null;
    multiplier: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRule {
  id: string;
  ruleType: 'default' | 'vendor' | 'category' | 'volume';
  marketplaceType: 'b2c' | 'b2b';
  vendorId?: string;
  category?: string;
  orderValueMinPaise: number;
  orderValueMaxPaise: number | null;
  commissionPercent: number;
  platformFeePercent?: number; // For B2B only (2%)
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformFeeConfig {
  id: string;
  name: string;
  isActive: boolean;
  fixedFeePaise: number;
  percentageFee: number;
  categoryVariations: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
  selectedAddOns: Array<{
    addOnId: string;
    quantity: number;
    totalPricePaise: number;
  }>;
  customizationData: Record<string, any>;
  createdAt: string;
}

export interface EnhancedOrder {
  id: string;
  userId: string;
  partnerId: string;
  status: string;
  deliveryFeePaise: number;
  platformFeePaise: number;
  commissionPaise: number;
  appliedCommissionRuleId?: string;
  items: OrderItem[];
  totalAmountPaise: number;
  createdAt: string;
  updatedAt: string;
}

// Customer-facing interfaces (B2C friendly)
export interface CustomerProductDisplay {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  listingType: ListingType;
  whatsIncluded: string[];
  currentPrice: number; // Live updating price based on selected quantity
  originalPrice?: number;
  discount?: number;
  pricingTiers: Array<{
    quantity: string; // "1-9", "10-49", "50+"
    price: number;
    discountPercent: number;
  }>;
  deliveryTime: string;
  isInStock: boolean;
  stockCount?: number;
  isCustomizable: boolean;
  addOns: Array<{
    id: string;
    name: string;
    price: number;
    minimumOrderQuantity: number;
    requiresProof: boolean;
    description?: string;
  }>;
  vendor: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
  };
  rating: number;
  reviewCount: number;
  isWishlisted?: boolean;
}

// B2B Procurement interfaces
export interface SupplyProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  wholesalePricePaise: number;
  mrpPaise: number;
  minimumOrder: number;
  maximumOrder: number;
  stockAvailable: number;
  leadTimeDays: number;
  marginOpportunityPaise: number;
  images: string[];
  description: string;
  specifications: string[];
  warranty: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyCartItem {
  product: SupplyProduct;
  quantity: number;
  totalPricePaise: number;
}

export interface SupplyOrder {
  id: string;
  partnerId: string;
  items: SupplyCartItem[];
  totalAmountPaise: number;
  platformFeePaise: number;
  gstPaise: number;
  finalAmountPaise: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  expectedDelivery: string;
  createdAt: string;
  updatedAt: string;
}

// Utility types for calculations
export interface PriceCalculation {
  basePrice: number;
  addOnsPrice: number;
  deliveryFee: number;
  platformFee: number;
  gst: number;
  total: number;
  breakdown: Array<{
    item: string;
    amount: number;
    description?: string;
  }>;
}

export interface CommissionCalculation {
  orderValue: number;
  appliedRule: CommissionRule;
  commissionAmount: number;
  vendorReceives: number;
  platformEarns: number;
  platformFeeAmount?: number; // For B2B only
  buyerPays?: number; // For B2B only
}

export interface DeliveryFeeCalculation {
  orderValue: number;
  distance: number;
  appliedConfig: DeliveryFeeConfig;
  baseFee: number;
  distanceFee: number;
  totalFee: number;
  isFreeDelivery: boolean;
}
