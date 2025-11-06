// Surge Pricing Logic
// Calculates surge multipliers based on time, location, weather, demand

export interface SurgePricingParams {
  zone: string;
  time: Date;
  weather?: string;
  demand?: number;
}

/**
 * Calculate surge multiplier based on various factors
 * Returns multiplier (1.0 to 5.0)
 */
export function calculateSurgeMultiplier(params: SurgePricingParams): number {
  let multiplier = 1.0;
  
  const hour = params.time.getHours();
  
  // Time-based surge (peak hours: 12-2 PM, 6-10 PM)
  if ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 22)) {
    multiplier = Math.max(multiplier, 1.5); // 1.5x during peak hours
  }
  
  // Weekend surge (Friday evening, Saturday, Sunday)
  const day = params.time.getDay();
  if (day === 5 && hour >= 18) { // Friday evening
    multiplier = Math.max(multiplier, 1.3);
  } else if (day === 6 || day === 0) { // Saturday or Sunday
    multiplier = Math.max(multiplier, 1.4);
  }
  
  // Weather-based surge
  if (params.weather === 'rain' || params.weather === 'extreme_heat') {
    multiplier = Math.min(multiplier * 1.5, 3.0); // Up to 3x
  }
  
  // Demand-based surge (if high demand)
  if (params.demand && params.demand > 80) {
    multiplier = Math.min(multiplier * 1.2, 5.0); // Up to 5x
  }
  
  // Cap at 5.0x maximum
  return Math.min(multiplier, 5.0);
}

/**
 * Apply surge multiplier to delivery fee
 */
export function applySurgeToDeliveryFee(
  baseFee: number,
  multiplier: number
): number {
  return Math.round(baseFee * multiplier);
}

/**
 * Get surge pricing reason for display
 */
export function getSurgeReason(params: SurgePricingParams, multiplier: number): string {
  if (multiplier <= 1.0) return '';
  
  const reasons: string[] = [];
  const hour = params.time.getHours();
  
  if ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 22)) {
    reasons.push('Peak hours');
  }
  
  if (params.weather === 'rain') {
    reasons.push('Rain');
  } else if (params.weather === 'extreme_heat') {
    reasons.push('Extreme heat');
  }
  
  if (params.demand && params.demand > 80) {
    reasons.push('High demand');
  }
  
  return reasons.length > 0 ? reasons.join(' + ') : 'Surge pricing applied';
}
