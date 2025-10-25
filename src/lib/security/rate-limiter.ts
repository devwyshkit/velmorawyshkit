// Rate Limiting for API calls
// Prevents DoS attacks and abuse

import { ValidationSchemas } from '@/lib/validation/schemas';

// In-memory rate limit storage
const rateLimits = new Map<string, number[]>();

// Default rate limits
export const DEFAULT_RATE_LIMITS = {
  // API calls per minute
  API_CALLS: { maxRequests: 60, windowMs: 60 * 1000 },
  // Search requests per minute
  SEARCH: { maxRequests: 30, windowMs: 60 * 1000 },
  // Authentication attempts per minute
  AUTH: { maxRequests: 5, windowMs: 60 * 1000 },
  // Cart operations per minute
  CART: { maxRequests: 20, windowMs: 60 * 1000 },
  // Order operations per minute
  ORDERS: { maxRequests: 10, windowMs: 60 * 1000 },
  // File uploads per hour
  UPLOADS: { maxRequests: 10, windowMs: 60 * 60 * 1000 }
} as const;

/**
 * Check if a request should be rate limited
 * @param key Unique identifier for the rate limit (e.g., user ID, IP)
 * @param maxRequests Maximum number of requests allowed
 * @param windowMs Time window in milliseconds
 * @returns True if request should be allowed, false if rate limited
 */
export const checkRateLimit = (
  key: string,
  maxRequests: number,
  windowMs: number
): boolean => {
  try {
    // Validate inputs
    ValidationSchemas.RateLimit.parse({ key, maxRequests, windowMs });
    
    const now = Date.now();
    const requests = rateLimits.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    // Check if we're at the limit
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    rateLimits.set(key, validRequests);
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request if validation fails
    return true;
  }
};

/**
 * Get rate limit status for a key
 * @param key The rate limit key
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns Object with current status
 */
export const getRateLimitStatus = (
  key: string,
  maxRequests: number,
  windowMs: number
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  current: number;
} => {
  const now = Date.now();
  const requests = rateLimits.get(key) || [];
  const validRequests = requests.filter(time => now - time < windowMs);
  
  return {
    allowed: validRequests.length < maxRequests,
    remaining: Math.max(0, maxRequests - validRequests.length),
    resetTime: validRequests.length > 0 ? validRequests[0] + windowMs : now,
    current: validRequests.length
  };
};

/**
 * Clear rate limit for a specific key
 * @param key The rate limit key to clear
 */
export const clearRateLimit = (key: string): void => {
  rateLimits.delete(key);
};

/**
 * Clear all rate limits (useful for testing)
 */
export const clearAllRateLimits = (): void => {
  rateLimits.clear();
};

/**
 * Rate limiter decorator for functions
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @param keyGenerator Function to generate rate limit key
 * @returns Decorated function with rate limiting
 */
export const withRateLimit = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRequests: number,
  windowMs: number,
  keyGenerator: (...args: Parameters<T>) => string
): T => {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    if (!checkRateLimit(key, maxRequests, windowMs)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    return await fn(...args);
  }) as T;
};

/**
 * Rate limiter for Supabase operations
 * @param operation The operation type
 * @param userId The user ID (or IP for anonymous users)
 * @returns True if operation is allowed
 */
export const checkSupabaseRateLimit = (
  operation: keyof typeof DEFAULT_RATE_LIMITS,
  userId: string
): boolean => {
  const limits = DEFAULT_RATE_LIMITS[operation];
  const key = `${operation}:${userId}`;
  
  return checkRateLimit(key, limits.maxRequests, limits.windowMs);
};

/**
 * Get user-specific rate limit key
 * @param userId User ID or IP address
 * @param operation Operation type
 * @returns Rate limit key
 */
export const getUserRateLimitKey = (userId: string, operation: string): string => {
  return `${operation}:${userId}`;
};

/**
 * Rate limiter middleware for API endpoints
 * @param operation The operation type
 * @param userId The user ID
 * @throws Error if rate limit exceeded
 */
export const enforceRateLimit = (
  operation: keyof typeof DEFAULT_RATE_LIMITS,
  userId: string
): void => {
  if (!checkSupabaseRateLimit(operation, userId)) {
    const limits = DEFAULT_RATE_LIMITS[operation];
    const status = getRateLimitStatus(
      getUserRateLimitKey(userId, operation),
      limits.maxRequests,
      limits.windowMs
    );
    
    throw new Error(
      `Rate limit exceeded. ${status.remaining} requests remaining. ` +
      `Reset in ${Math.ceil((status.resetTime - Date.now()) / 1000)} seconds.`
    );
  }
};

/**
 * Cleanup old rate limit entries (call periodically)
 * @param maxAge Maximum age in milliseconds
 */
export const cleanupRateLimits = (maxAge: number = 24 * 60 * 60 * 1000): void => {
  const now = Date.now();
  
  for (const [key, requests] of rateLimits.entries()) {
    const validRequests = requests.filter(time => now - time < maxAge);
    
    if (validRequests.length === 0) {
      rateLimits.delete(key);
    } else {
      rateLimits.set(key, validRequests);
    }
  }
};

// Auto-cleanup every hour
setInterval(() => {
  cleanupRateLimits();
}, 60 * 60 * 1000);
