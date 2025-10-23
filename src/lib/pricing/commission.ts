/**
 * Commission Calculator
 * Swiggy/Zomato pattern: Dynamic commission based on vendor, category, volume
 * Admin can override rates in real-time
 */

import { CommissionRule, VendorCommissionOverride, CommissionCalculation } from '@/types/commission';

/**
 * Calculate platform commission based on order details and rules
 * Priority order: Vendor Override > Volume > Vendor-specific > Category > Default
 */
export function calculateCommission(
  orderValue: number, // in paise
  orderQuantity: number,
  vendorId: string,
  categoryId?: string,
  commissionRules: CommissionRule[] = [],
  vendorOverrides: VendorCommissionOverride[] = []
): CommissionCalculation {
  // Check for vendor-specific override first (highest priority)
  const override = findActiveVendorOverride(vendorId, vendorOverrides);
  if (override) {
    const commissionAmount = Math.round((orderValue * override.commission_percent) / 100);
    const vendorPayout = orderValue - commissionAmount;
    
    return {
      commission_amount: commissionAmount,
      commission_percent: override.commission_percent,
      vendor_payout: vendorPayout,
      applied_rule_id: override.id,
      rule_name: `Vendor Override: ${override.reason || 'Custom rate'}`,
    };
  }
  
  // Find applicable commission rule
  const applicableRule = findApplicableCommissionRule(
    orderValue,
    orderQuantity,
    vendorId,
    categoryId,
    commissionRules
  );
  
  if (!applicableRule) {
    // Fallback to default 18% if no rule found
    const defaultPercent = 18;
    const commissionAmount = Math.round((orderValue * defaultPercent) / 100);
    const vendorPayout = orderValue - commissionAmount;
    
    return {
      commission_amount: commissionAmount,
      commission_percent: defaultPercent,
      vendor_payout: vendorPayout,
      applied_rule_id: 'default-fallback',
      rule_name: 'Default Commission (18%)',
    };
  }
  
  const commissionAmount = Math.round((orderValue * applicableRule.commission_percent) / 100);
  const vendorPayout = orderValue - commissionAmount;
  
  return {
    commission_amount: commissionAmount,
    commission_percent: applicableRule.commission_percent,
    vendor_payout: vendorPayout,
    applied_rule_id: applicableRule.id,
    rule_name: applicableRule.rule_name,
  };
}

/**
 * Find active vendor commission override
 */
function findActiveVendorOverride(
  vendorId: string,
  overrides: VendorCommissionOverride[]
): VendorCommissionOverride | null {
  const now = new Date();
  
  const activeOverrides = overrides.filter(
    (override) =>
      override.vendor_id === vendorId &&
      override.is_active &&
      new Date(override.effective_from) <= now &&
      (!override.effective_until || new Date(override.effective_until) > now)
  );
  
  // Return most recent override
  if (activeOverrides.length > 0) {
    return activeOverrides.sort(
      (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
    )[0];
  }
  
  return null;
}

/**
 * Find applicable commission rule based on priority
 * Priority: Vendor-specific > Volume > Category > Default
 */
function findApplicableCommissionRule(
  orderValue: number,
  orderQuantity: number,
  vendorId: string,
  categoryId: string | undefined,
  rules: CommissionRule[]
): CommissionRule | null {
  const now = new Date();
  
  // Filter active rules within effective date range
  const activeRules = rules.filter(
    (rule) =>
      rule.is_active &&
      new Date(rule.effective_from) <= now &&
      (!rule.effective_until || new Date(rule.effective_until) > now)
  );
  
  // Filter rules that match criteria
  const matchingRules = activeRules.filter((rule) => {
    // Check vendor match
    if (rule.rule_type === 'vendor' && rule.vendor_id !== vendorId) {
      return false;
    }
    
    // Check category match
    if (rule.rule_type === 'category' && rule.category_id !== categoryId) {
      return false;
    }
    
    // Check order value range
    if (rule.order_value_min > 0 && orderValue < rule.order_value_min) {
      return false;
    }
    if (rule.order_value_max && orderValue > rule.order_value_max) {
      return false;
    }
    
    // Check order quantity range (for volume-based rules)
    if (rule.rule_type === 'volume') {
      if (orderQuantity < rule.order_quantity_min) {
        return false;
      }
      if (rule.order_quantity_max && orderQuantity > rule.order_quantity_max) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort by priority (lower number = higher priority)
  const sortedRules = matchingRules.sort((a, b) => a.priority - b.priority);
  
  // Return highest priority rule
  return sortedRules.length > 0 ? sortedRules[0] : null;
}

/**
 * Get commission breakdown for display (admin view)
 */
export function getCommissionBreakdown(
  orderValue: number,
  calculation: CommissionCalculation
): {
  orderValue: string;
  commissionPercent: string;
  commissionAmount: string;
  vendorPayout: string;
  ruleName: string;
} {
  return {
    orderValue: formatCurrency(orderValue),
    commissionPercent: `${calculation.commission_percent}%`,
    commissionAmount: formatCurrency(calculation.commission_amount),
    vendorPayout: formatCurrency(calculation.vendor_payout),
    ruleName: calculation.rule_name,
  };
}

/**
 * Calculate effective commission rate for a vendor
 * Useful for showing vendors their commission rate
 */
export function getEffectiveCommissionRate(
  vendorId: string,
  categoryId?: string,
  rules: CommissionRule[] = [],
  overrides: VendorCommissionOverride[] = []
): {
  baseRate: number;
  volumeRates: Array<{
    minQuantity: number;
    maxQuantity?: number;
    rate: number;
  }>;
  hasOverride: boolean;
  overrideRate?: number;
  overrideReason?: string;
} {
  // Check for override
  const override = findActiveVendorOverride(vendorId, overrides);
  
  if (override) {
    return {
      baseRate: override.commission_percent,
      volumeRates: [],
      hasOverride: true,
      overrideRate: override.commission_percent,
      overrideReason: override.reason,
    };
  }
  
  const now = new Date();
  const activeRules = rules.filter(
    (rule) =>
      rule.is_active &&
      new Date(rule.effective_from) <= now &&
      (!rule.effective_until || new Date(rule.effective_until) > now)
  );
  
  // Find base rate (vendor-specific or category or default)
  const baseRule = activeRules
    .filter((r) => 
      (r.rule_type === 'vendor' && r.vendor_id === vendorId) ||
      (r.rule_type === 'category' && r.category_id === categoryId) ||
      r.rule_type === 'default'
    )
    .sort((a, b) => a.priority - b.priority)[0];
  
  const baseRate = baseRule ? baseRule.commission_percent : 18; // Default 18%
  
  // Find volume-based rates
  const volumeRules = activeRules
    .filter((r) => r.rule_type === 'volume')
    .sort((a, b) => a.order_quantity_min - b.order_quantity_min);
  
  const volumeRates = volumeRules.map((rule) => ({
    minQuantity: rule.order_quantity_min,
    maxQuantity: rule.order_quantity_max || undefined,
    rate: rule.commission_percent,
  }));
  
  return {
    baseRate,
    volumeRates,
    hasOverride: false,
  };
}

/**
 * Validate commission rules
 */
export function validateCommissionRules(rules: CommissionRule[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!rules || rules.length === 0) {
    errors.push('At least one commission rule is required');
    return { isValid: false, errors };
  }
  
  // Check for default rule
  const hasDefaultRule = rules.some((r) => r.rule_type === 'default' && r.is_active);
  if (!hasDefaultRule) {
    errors.push('At least one active default commission rule is required');
  }
  
  // Validate each rule
  rules.forEach((rule, index) => {
    if (rule.commission_percent < 0 || rule.commission_percent > 100) {
      errors.push(`Rule ${index + 1}: Commission percent must be between 0 and 100`);
    }
    
    if (rule.order_value_min < 0) {
      errors.push(`Rule ${index + 1}: Order value min cannot be negative`);
    }
    
    if (rule.order_value_max && rule.order_value_max < rule.order_value_min) {
      errors.push(`Rule ${index + 1}: Order value max must be greater than min`);
    }
    
    if (rule.order_quantity_min < 0) {
      errors.push(`Rule ${index + 1}: Order quantity min cannot be negative`);
    }
    
    if (rule.order_quantity_max && rule.order_quantity_max < rule.order_quantity_min) {
      errors.push(`Rule ${index + 1}: Order quantity max must be greater than min`);
    }
    
    // Type-specific validation
    if (rule.rule_type === 'vendor' && !rule.vendor_id) {
      errors.push(`Rule ${index + 1}: Vendor-specific rule must have vendor_id`);
    }
    
    if (rule.rule_type === 'category' && !rule.category_id) {
      errors.push(`Rule ${index + 1}: Category-specific rule must have category_id`);
    }
    
    if (rule.rule_type === 'volume' && rule.order_quantity_min === 0) {
      errors.push(`Rule ${index + 1}: Volume-based rule must have minimum quantity > 0`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper: Format currency in Indian rupees
 */
function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Simulate commission for testing (admin tool)
 */
export function simulateCommission(
  orderValue: number,
  orderQuantity: number,
  vendorId: string,
  categoryId: string | undefined,
  rules: CommissionRule[],
  overrides: VendorCommissionOverride[]
): {
  calculation: CommissionCalculation;
  breakdown: ReturnType<typeof getCommissionBreakdown>;
  effectiveRate: ReturnType<typeof getEffectiveCommissionRate>;
} {
  const calculation = calculateCommission(
    orderValue,
    orderQuantity,
    vendorId,
    categoryId,
    rules,
    overrides
  );
  
  const breakdown = getCommissionBreakdown(orderValue, calculation);
  const effectiveRate = getEffectiveCommissionRate(vendorId, categoryId, rules, overrides);
  
  return {
    calculation,
    breakdown,
    effectiveRate,
  };
}

