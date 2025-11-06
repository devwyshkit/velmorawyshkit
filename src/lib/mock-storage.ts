/**
 * Safe localStorage Wrapper
 * 
 * Provides error handling, quota management, and data validation
 * for localStorage operations in mock mode.
 * 
 * Swiggy 2025 Pattern: Graceful degradation, never crash on storage errors
 */

// Phase 1 Cleanup: Removed mock-data-validator dependency

interface StorageOptions {
  defaultValue?: any;
  validator?: (data: any) => boolean;
  onError?: (error: Error) => void;
}

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely get item from localStorage
 */
export const safeGetItem = <T>(
  key: string,
  options: StorageOptions = {}
): T | null => {
  if (!isStorageAvailable()) {
    if (options.onError) {
      options.onError(new Error('localStorage is not available'));
    }
    return options.defaultValue ?? null;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return options.defaultValue ?? null;
    }

    let parsed = JSON.parse(item);

    // Phase 1 Cleanup: Removed data migration - simplified storage

    // Validate if validator provided
    if (options.validator && !options.validator(parsed)) {
      console.warn(`Invalid data in localStorage key "${key}", using default`);
      return options.defaultValue ?? null;
    }

    return parsed as T;
  } catch (error) {
    // Invalid JSON or parse error
    console.error(`Error reading localStorage key "${key}":`, error);
    if (options.onError) {
      options.onError(error as Error);
    }
    // Try to clean up corrupted data
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore cleanup errors
    }
    return options.defaultValue ?? null;
  }
};

/**
 * Safely set item in localStorage
 */
export const safeSetItem = (
  key: string,
  value: any,
  options: StorageOptions = {}
): boolean => {
  if (!isStorageAvailable()) {
    if (options.onError) {
      options.onError(new Error('localStorage is not available'));
    }
    return false;
  }

  try {
    // Validate if validator provided
    if (options.validator && !options.validator(value)) {
      throw new Error(`Invalid data for localStorage key "${key}"`);
    }

    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error: any) {
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error('localStorage quota exceeded');
      if (options.onError) {
        options.onError(new Error('Storage quota exceeded. Please clear some data.'));
      }
      return false;
    }

    // Other errors
    console.error(`Error writing to localStorage key "${key}":`, error);
    if (options.onError) {
      options.onError(error);
    }
    return false;
  }
};

/**
 * Safely remove item from localStorage
 */
export const safeRemoveItem = (key: string): boolean => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely clear all mock-related localStorage items
 */
export const clearMockStorage = (): void => {
  if (!isStorageAvailable()) {
    return;
  }

  const mockKeys = [
    'wyshkit_mock_mode',
    'wyshkit_mock_cart',
    'wyshkit_mock_orders',
    'wyshkit_mock_addresses',
  ];

  mockKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing localStorage key "${key}":`, error);
    }
  });
};

/**
 * Get storage usage estimate
 */
export const getStorageUsage = (): { used: number; available: number } => {
  if (!isStorageAvailable()) {
    return { used: 0, available: 0 };
  }

  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    // Most browsers have 5-10MB limit, estimate 5MB
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    return {
      used: total,
      available: Math.max(0, estimatedLimit - total),
    };
  } catch {
    return { used: 0, available: 0 };
  }
};

