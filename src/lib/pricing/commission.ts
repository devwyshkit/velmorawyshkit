/**
 * Commission Calculator - Dynamic Platform Commission
 * Admin-configurable commission rules with real-time calculation
 */

import { CommissionRule } from '@/types/commission';

export interface CommissionResult {
  commissionAmount: number;
  commissionPercent: number;
  vendorPayout: number;
  appliedRule: CommissionRule;
  breakdown: {
    orderValue: number;
    baseCommission: number;
    adjustments: number;
    finalCommission: number;
  };
}

/**
 * Calculate platform commission based on rules
 * Supports category, vendor, volume, and default rules
 */
export function calculateCommission(
  orderValue: number,
  vendorId: string,
  category: string,
  rules: CommissionRule[]
): CommissionResult {
  if (!rules || rules.length === 0) {
    throw new Error('Commission rules are required');
  }

  // Filter active rules
  const activeRules = rules.filter(rule => 
    rule.isActive && new Date(rule.effectiveFrom) <= new Date()
  );

  // Find the most specific applicable rule
  const applicableRule = findApplicableRule(orderValue, vendorId, category, activeRules);

  if (!applicableRule) {
    throw new Error(`No commission rule found for order value ${orderValue}, vendor ${vendorId}, category ${category}`);
  }

  // Calculate commission
  const commissionPercent = applicableRule.commissionPercent;
  const commissionAmount = Math.round((orderValue * commissionPercent) / 100);
  const vendorPayout = orderValue - commissionAmount;

  return {
    commissionAmount,
    commissionPercent,
    vendorPayout,
    appliedRule: applicableRule,
    breakdown: {
      orderValue,
      baseCommission: commissionAmount,
      adjustments: 0, // For future use (bonuses, penalties, etc.)
      finalCommission: commissionAmount
    }
  };
}

/**
 * Find the most specific applicable commission rule
 * Priority: vendor-specific > category-specific > volume-based > default
 */
function findApplicableRule(
  orderValue: number,
  vendorId: string,
  category: string,
  rules: CommissionRule[]
): CommissionRule | null {
  // Sort by specificity (most specific first)
  const sortedRules = rules.sort((a, b) => {
    const aSpecificity = getRuleSpecificity(a);
    const bSpecificity = getRuleSpecificity(b);
    return bSpecificity - aSpecificity;
  });

  for (const rule of sortedRules) {
    if (isRuleApplicable(rule, orderValue, vendorId, category)) {
      return rule;
    }
  }

  return null;
}

/**
 * Get rule specificity score (higher = more specific)
 */
function getRuleSpecificity(rule: CommissionRule): number {
  let score = 0;
  
  if (rule.ruleType === 'vendor' && rule.vendorId) score += 100;
  if (rule.ruleType === 'category' && rule.categoryId) score += 50;
  if (rule.ruleType === 'volume') score += 25;
  if (rule.ruleType === 'default') score += 0;
  
  return score;
}

/**
 * Check if a rule is applicable to the given parameters
 */
function isRuleApplicable(
  rule: CommissionRule,
  orderValue: number,
  vendorId: string,
  category: string
): boolean {
  // Check order value range
  const meetsMinValue = orderValue >= rule.orderValueMin;
  const meetsMaxValue = rule.orderValueMax === null || orderValue <= rule.orderValueMax;
  
  if (!meetsMinValue || !meetsMaxValue) {
    return false;
  }

  // Check rule type specific conditions
  switch (rule.ruleType) {
    case 'vendor':
      return rule.vendorId === vendorId;
    
    case 'category':
      return rule.categoryId === category;
    
    case 'volume':
      return true; // Volume rules apply to all vendors/categories
    
    case 'default':
      return true; // Default rules apply to all
    
    default:
      return false;
  }
}

/**
 * Create default commission rules
 * Based on industry standards and platform requirements
 */
export function createDefaultCommissionRules(): CommissionRule[] {
  const now = new Date();
  
  return [
    // Default commission rule
    {
      id: 'default-18',
      ruleType: 'default',
      orderValueMin: 0,
      orderValueMax: null,
      commissionPercent: 18,
      isActive: true,
      effectiveFrom: now
    },
    
    // Volume-based rules
    {
      id: 'bulk-15',
      ruleType: 'volume',
      orderValueMin: 50000,
      orderValueMax: 200000,
      commissionPercent: 15,
      isActive: true,
      effectiveFrom: now
    },
    
    {
      id: 'super-bulk-12',
      ruleType: 'volume',
      orderValueMin: 200000,
      orderValueMax: null,
      commissionPercent: 12,
      isActive: true,
      effectiveFrom: now
    },
    
    // Category-specific rules
    {
      id: 'electronics-20',
      ruleType: 'category',
      categoryId: 'electronics',
      orderValueMin: 0,
      orderValueMax: null,
      commissionPercent: 20,
      isActive: true,
      effectiveFrom: now
    },
    
    {
      id: 'gourmet-15',
      ruleType: 'category',
      categoryId: 'gourmet',
      orderValueMin: 0,
      orderValueMax: null,
      commissionPercent: 15,
      isActive: true,
      effectiveFrom: now
    }
  ];
}

/**
 * Calculate commission for multiple orders (batch processing)
 */
export function calculateBatchCommission(
  orders: Array<{
    orderValue: number;
    vendorId: string;
    category: string;
  }>,
  rules: CommissionRule[]
): Array<CommissionResult & { orderIndex: number }> {
  return orders.map((order, index) => ({
    ...calculateCommission(order.orderValue, order.vendorId, order.category, rules),
    orderIndex: index
  }));
}

/**
 * Get commission summary for admin dashboard
 */
export function getCommissionSummary(
  orders: Array<{ orderValue: number; vendorId: string; category: string }>,
  rules: CommissionRule[]
) {
  const results = calculateBatchCommission(orders, rules);
  
  const totalOrderValue = orders.reduce((sum, order) => sum + order.orderValue, 0);
  const totalCommission = results.reduce((sum, result) => sum + result.commissionAmount, 0);
  const totalVendorPayout = results.reduce((sum, result) => sum + result.vendorPayout, 0);
  const averageCommissionPercent = totalOrderValue > 0 ? (totalCommission / totalOrderValue) * 100 : 0;
  
  return {
    totalOrders: orders.length,
    totalOrderValue,
    totalCommission,
    totalVendorPayout,
    averageCommissionPercent: Math.round(averageCommissionPercent * 100) / 100,
    results
  };
}

/**
 * Validate commission rules
 */
export function validateCommissionRules(rules: CommissionRule[]): string[] {
  const errors: string[] = [];

  if (!rules || rules.length === 0) {
    errors.push('At least one commission rule is required');
    return errors;
  }

  // Check for duplicate rule IDs
  const ruleIds = rules.map(rule => rule.id);
  const duplicateIds = ruleIds.filter((id, index) => ruleIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate rule IDs: ${duplicateIds.join(', ')}`);
  }

  // Validate each rule
  rules.forEach((rule, index) => {
    if (!rule.id || rule.id.trim() === '') {
      errors.push(`Rule ${index + 1}: ID is required`);
    }

    if (rule.commissionPercent < 0 || rule.commissionPercent > 100) {
      errors.push(`Rule ${index + 1}: Commission percentage must be between 0 and 100`);
    }

    if (rule.orderValueMin < 0) {
      errors.push(`Rule ${index + 1}: Minimum order value cannot be negative`);
    }

    if (rule.orderValueMax !== null && rule.orderValueMax < rule.orderValueMin) {
      errors.push(`Rule ${index + 1}: Maximum order value cannot be less than minimum order value`);
    }

    if (rule.ruleType === 'vendor' && !rule.vendorId) {
      errors.push(`Rule ${index + 1}: Vendor ID is required for vendor-specific rules`);
    }

    if (rule.ruleType === 'category' && !rule.categoryId) {
      errors.push(`Rule ${index + 1}: Category ID is required for category-specific rules`);
    }
  });

  return errors;
}

/**
 * Format commission amount for display
 */
export function formatCommission(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Get commission rule description for admin display
 */
export function getCommissionRuleDescription(rule: CommissionRule): string {
  const percent = rule.commissionPercent;
  const minValue = rule.orderValueMin;
  const maxValue = rule.orderValueMax;
  
  let description = `${percent}% commission`;
  
  if (rule.ruleType === 'vendor') {
    description += ` for vendor ${rule.vendorId}`;
  } else if (rule.ruleType === 'category') {
    description += ` for category ${rule.categoryId}`;
  } else if (rule.ruleType === 'volume') {
    description += ' for volume orders';
  } else {
    description += ' (default)';
  }
  
  if (minValue > 0 || maxValue !== null) {
    const valueRange = maxValue === null 
      ? `₹${minValue}+` 
      : `₹${minValue}-₹${maxValue}`;
    description += ` (${valueRange})`;
  }
  
  return description;
}