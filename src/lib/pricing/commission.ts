// Commission Calculation System
// Dynamic commission control with vendor-specific and volume-based rates

import { CommissionRule, CommissionCalculation } from '@/types/tiered-pricing';

/**
 * Create default commission rules
 */
export function createDefaultCommissionRules(): CommissionRule[] {
  return [
    {
      id: 'default-commission',
      ruleType: 'default',
      orderValueMinPaise: 0,
      orderValueMaxPaise: null,
      commissionPercent: 18.00,
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'volume-tier-1',
      ruleType: 'volume',
      orderValueMinPaise: 500000, // ₹5000
      orderValueMaxPaise: 4999000, // ₹49990
      commissionPercent: 15.00,
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'volume-tier-2',
      ruleType: 'volume',
      orderValueMinPaise: 5000000, // ₹50000
      orderValueMaxPaise: null,
      commissionPercent: 12.00,
      isActive: true,
      effectiveFrom: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

/**
 * Calculate commission for an order
 */
export function calculateCommission(
  orderValuePaise: number,
  vendorId?: string,
  category?: string,
  commissionRules: CommissionRule[] = createDefaultCommissionRules()
): CommissionCalculation {
  // Filter active rules
  const activeRules = commissionRules.filter(rule => rule.isActive);
  
  // Find applicable rule (priority: vendor-specific > category > volume > default)
  let applicableRule: CommissionRule | undefined;
  
  // 1. Check for vendor-specific rule
  if (vendorId) {
    applicableRule = activeRules.find(rule => 
      rule.ruleType === 'vendor' && 
      rule.vendorId === vendorId &&
      orderValuePaise >= rule.orderValueMinPaise &&
      (rule.orderValueMaxPaise === null || orderValuePaise <= rule.orderValueMaxPaise)
    );
  }
  
  // 2. Check for category-specific rule
  if (!applicableRule && category) {
    applicableRule = activeRules.find(rule => 
      rule.ruleType === 'category' && 
      rule.category === category &&
      orderValuePaise >= rule.orderValueMinPaise &&
      (rule.orderValueMaxPaise === null || orderValuePaise <= rule.orderValueMaxPaise)
    );
  }
  
  // 3. Check for volume-based rule
  if (!applicableRule) {
    applicableRule = activeRules.find(rule => 
      rule.ruleType === 'volume' &&
      orderValuePaise >= rule.orderValueMinPaise &&
      (rule.orderValueMaxPaise === null || orderValuePaise <= rule.orderValueMaxPaise)
    );
  }
  
  // 4. Fall back to default rule
  if (!applicableRule) {
    applicableRule = activeRules.find(rule => rule.ruleType === 'default');
  }
  
  if (!applicableRule) {
    throw new Error('No applicable commission rule found');
  }
  
  const commissionAmount = Math.round(orderValuePaise * (applicableRule.commissionPercent / 100));
  const vendorReceives = orderValuePaise - commissionAmount;
  
  return {
    orderValue: orderValuePaise,
    appliedRule: applicableRule,
    commissionAmount,
    vendorReceives,
    platformEarns: commissionAmount
  };
}

/**
 * Get commission rate for display
 */
export function formatCommission(commissionPercent: number): string {
  return `${commissionPercent.toFixed(2)}%`;
}

/**
 * Get commission amount for display
 */
export function formatCommissionAmount(commissionAmountPaise: number): string {
  return `₹${Math.round(commissionAmountPaise / 100).toLocaleString()}`;
}

/**
 * Get vendor earnings for display
 */
export function formatVendorEarnings(vendorReceivesPaise: number): string {
  return `₹${Math.round(vendorReceivesPaise / 100).toLocaleString()}`;
}

/**
 * Calculate commission for multiple orders (bulk calculation)
 */
export function calculateBulkCommission(
  orders: Array<{
    orderValuePaise: number;
    vendorId?: string;
    category?: string;
  }>,
  commissionRules: CommissionRule[] = createDefaultCommissionRules()
): {
  totalOrderValue: number;
  totalCommission: number;
  totalVendorEarnings: number;
  breakdown: Array<{
    orderValue: number;
    commission: number;
    vendorEarnings: number;
    appliedRule: CommissionRule;
  }>;
} {
  let totalOrderValue = 0;
  let totalCommission = 0;
  let totalVendorEarnings = 0;
  const breakdown = [];
  
  for (const order of orders) {
    const calculation = calculateCommission(
      order.orderValuePaise,
      order.vendorId,
      order.category,
      commissionRules
    );
    
    totalOrderValue += order.orderValuePaise;
    totalCommission += calculation.commissionAmount;
    totalVendorEarnings += calculation.vendorReceives;
    
    breakdown.push({
      orderValue: order.orderValuePaise,
      commission: calculation.commissionAmount,
      vendorEarnings: calculation.vendorReceives,
      appliedRule: calculation.appliedRule
    });
  }
  
  return {
    totalOrderValue,
    totalCommission,
    totalVendorEarnings,
    breakdown
  };
}

/**
 * Get commission tier information for upselling
 */
export function getCommissionTierInfo(
  currentOrderValuePaise: number,
  commissionRules: CommissionRule[] = createDefaultCommissionRules()
): {
  currentTier: CommissionRule;
  nextTier?: CommissionRule;
  savingsPotential?: number;
  message?: string;
} {
  const volumeRules = commissionRules
    .filter(rule => rule.ruleType === 'volume' && rule.isActive)
    .sort((a, b) => a.orderValueMinPaise - b.orderValueMinPaise);
  
  let currentTier = commissionRules.find(rule => rule.ruleType === 'default' && rule.isActive);
  
  // Find current tier
  for (const rule of volumeRules) {
    if (currentOrderValuePaise >= rule.orderValueMinPaise &&
        (rule.orderValueMaxPaise === null || currentOrderValuePaise <= rule.orderValueMaxPaise)) {
      currentTier = rule;
      break;
    }
  }
  
  if (!currentTier) return {};
  
  // Find next tier
  const nextTier = volumeRules.find(rule => 
    rule.orderValueMinPaise > currentOrderValuePaise
  );
  
  if (nextTier && currentTier.commissionPercent > nextTier.commissionPercent) {
    const orderValueNeeded = nextTier.orderValueMinPaise - currentOrderValuePaise;
    const commissionDifference = currentTier.commissionPercent - nextTier.commissionPercent;
    const savingsPotential = Math.round(orderValueNeeded * (commissionDifference / 100));
    
    return {
      currentTier,
      nextTier,
      savingsPotential,
      message: `Increase order by ₹${Math.round(orderValueNeeded / 100)} to reduce commission to ${nextTier.commissionPercent}%`
    };
  }
  
  return { currentTier };
}

/**
 * Validate commission rule
 */
export function validateCommissionRule(rule: CommissionRule): string[] {
  const errors: string[] = [];
  
  if (rule.commissionPercent < 0 || rule.commissionPercent > 100) {
    errors.push('Commission percentage must be between 0 and 100');
  }
  
  if (rule.orderValueMinPaise < 0) {
    errors.push('Minimum order value cannot be negative');
  }
  
  if (rule.orderValueMaxPaise !== null && rule.orderValueMaxPaise < rule.orderValueMinPaise) {
    errors.push('Maximum order value cannot be less than minimum order value');
  }
  
  if (rule.ruleType === 'vendor' && !rule.vendorId) {
    errors.push('Vendor ID is required for vendor-specific rules');
  }
  
  if (rule.ruleType === 'category' && !rule.category) {
    errors.push('Category is required for category-specific rules');
  }
  
  if (rule.effectiveUntil && new Date(rule.effectiveUntil) <= new Date(rule.effectiveFrom)) {
    errors.push('Effective until date must be after effective we date');
  }
  
  return errors;
}

/**
 * Check for overlapping commission rules
 */
export function checkOverlappingRules(
  newRule: CommissionRule,
  existingRules: CommissionRule[]
): string[] {
  const errors: string[] = [];
  
  for (const existingRule of existingRules) {
    if (existingRule.id === newRule.id) continue;
    if (!existingRule.isActive) continue;
    
    // Check if rules have the same type and vendor/category
    if (newRule.ruleType === existingRule.ruleType) {
      if (newRule.ruleType === 'vendor' && newRule.vendorId === existingRule.vendorId) {
        // Check for overlapping order value ranges
        const newMin = newRule.orderValueMinPaise;
        const newMax = newRule.orderValueMaxPaise || Infinity;
        const existingMin = existingRule.orderValueMinPaise;
        const existingMax = existingRule.maxOrderValuePaise || Infinity;
        
        if ((newMin <= existingMax && newMax >= existingMin)) {
          errors.push(`Overlapping order value range with existing vendor rule: ${existingRule.id}`);
        }
      }
      
      if (newRule.ruleType === 'category' && newRule.category === existingRule.category) {
        // Similar overlap check for category rules
        const newMin = newRule.orderValueMinPaise;
        const newMax = newRule.orderValueMaxPaise || Infinity;
        const existingMin = existingRule.orderValueMinPaise;
        const existingMax = existingRule.maxOrderValuePaise || Infinity;
        
        if ((newMin <= existingMax && newMax >= existingMin)) {
          errors.push(`Overlapping order value range with existing category rule: ${existingRule.id}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Get commission analytics for a vendor
 */
export function getVendorCommissionAnalytics(
  vendorId: string,
  orders: Array<{
    orderValuePaise: number;
    commissionPaise: number;
    createdAt: string;
  }>,
  timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
): {
  totalOrders: number;
  totalOrderValue: number;
  totalCommission: number;
  averageCommissionRate: number;
  averageOrderValue: number;
  trend: 'up' | 'down' | 'stable';
  topCommissionRules: Array<{
    ruleId: string;
    orderCount: number;
    totalCommission: number;
    averageRate: number;
  }>;
} {
  const now = new Date();
  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  const recentOrders = orders.filter(order => 
    new Date(order.createdAt) >= cutoffDate
  );
  
  const totalOrders = recentOrders.length;
  const totalOrderValue = recentOrders.reduce((sum, order) => sum + order.orderValuePaise, 0);
  const totalCommission = recentOrders.reduce((sum, order) => sum + order.commissionPaise, 0);
  const averageCommissionRate = totalOrderValue > 0 ? (totalCommission / totalOrderValue) * 100 : 0;
  const averageOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;
  
  // Calculate trend (simplified)
  const midPoint = Math.floor(recentOrders.length / 2);
  const firstHalf = recentOrders.slice(0, midPoint);
  const secondHalf = recentOrders.slice(midPoint);
  
  const firstHalfAvg = firstHalf.length > 0 ? 
    firstHalf.reduce((sum, order) => sum + order.orderValuePaise, 0) / firstHalf.length : 0;
  const secondHalfAvg = secondHalf.length > 0 ? 
    secondHalf.reduce((sum, order) => sum + order.orderValuePaise, 0) / secondHalf.length : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'up';
  else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'down';
  
  // Group by commission rules (simplified - would need actual rule data)
  const topCommissionRules = [
    {
      ruleId: 'default',
      orderCount: totalOrders,
      totalCommission,
      averageRate: averageCommissionRate
    }
  ];
  
  return {
    totalOrders,
    totalOrderValue,
    totalCommission,
    averageCommissionRate,
    averageOrderValue,
    trend,
    topCommissionRules
  };
}