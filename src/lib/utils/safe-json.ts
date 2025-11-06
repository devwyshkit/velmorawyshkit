/**
 * Safe JSON Utilities - Swiggy 2025 Pattern
 * 
 * Safe JSON parsing with Swiggy 2025 silent error handling:
 * - Errors are logged, not shown to users
 * - Returns default value on parse failure
 * - Never throws exceptions
 */

import { logger } from './logger';

/**
 * Safely parse JSON string with default fallback
 * Swiggy 2025: Silent error handling - log error, return default
 * 
 * @param jsonString - JSON string to parse
 * @param defaultValue - Default value to return on parse failure
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    // Swiggy 2025: Silent error handling - log for debugging, return default
    logger.error('Failed to parse JSON', error instanceof Error ? error : new Error(String(error)), {
      jsonString: jsonString.substring(0, 100), // Log first 100 chars for debugging
    });
    return defaultValue;
  }
}

/**
 * Safely stringify object to JSON
 * Swiggy 2025: Silent error handling - log error, return empty string
 * 
 * @param value - Value to stringify
 * @param defaultValue - Default value to return on stringify failure
 * @returns JSON string or default value
 */
export function safeJsonStringify(value: unknown, defaultValue: string = ''): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    // Swiggy 2025: Silent error handling - log for debugging, return default
    logger.error('Failed to stringify JSON', error instanceof Error ? error : new Error(String(error)));
    return defaultValue;
  }
}

