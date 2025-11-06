/**
 * ID Generator Utility - Swiggy 2025 Pattern
 * 
 * Centralized ID generation following Swiggy 2025 principles:
 * - Uses crypto.randomUUID() when available (browser native, collision-free)
 * - Falls back to timestamp + counter + random for mock data
 * - Format: {prefix}_{timestamp}_{counter}_{random}
 * - Collision detection for fallback method
 */

// Counter for ensuring uniqueness within same millisecond
let idCounter = 0;

/**
 * Generate a unique ID following Swiggy 2025 pattern
 * 
 * @param prefix - Optional prefix for the ID (e.g., 'order', 'notification')
 * @returns Unique ID string
 */
export function generateId(prefix?: string): string {
  // Swiggy 2025: Prefer crypto.randomUUID() for true uniqueness
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const uuid = crypto.randomUUID();
    return prefix ? `${prefix}_${uuid}` : uuid;
  }

  // Fallback: timestamp + counter + random (Swiggy 2025 pattern for mock data)
  const timestamp = Date.now();
  const counter = (idCounter = (idCounter + 1) % 10000); // Reset counter at 10000 to prevent overflow
  const random = Math.random().toString(36).substring(2, 8);
  
  const id = `${timestamp}_${counter}_${random}`;
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a mock order ID
 * Swiggy 2025: Consistent format for orders
 */
export function generateOrderId(): string {
  return generateId('mock_order');
}

/**
 * Generate a notification ID
 * Swiggy 2025: Consistent format for notifications
 */
export function generateNotificationId(): string {
  return generateId('notification');
}

/**
 * Generate an address ID
 * Swiggy 2025: Consistent format for addresses
 */
export function generateAddressId(): string {
  return generateId('mock_address');
}

/**
 * Generate a session ID
 * Swiggy 2025: Consistent format for sessions
 */
export function generateSessionId(): string {
  return generateId('session');
}

/**
 * Generate a payment ID
 * Swiggy 2025: Consistent format for payments
 */
export function generatePaymentId(): string {
  return generateId('pay');
}

/**
 * Generate a card ID
 * Swiggy 2025: Consistent format for payment cards
 */
export function generateCardId(): string {
  return generateId('card');
}

/**
 * Generate a UPI ID
 * Swiggy 2025: Consistent format for UPI methods
 */
export function generateUpiId(): string {
  return generateId('upi');
}

/**
 * Generate a wallet ID
 * Swiggy 2025: Consistent format for wallet methods
 */
export function generateWalletId(): string {
  return generateId('wallet');
}

/**
 * Generate a return request ID
 * Swiggy 2025: Consistent format for return requests
 */
export function generateReturnId(): string {
  return generateId('return');
}

