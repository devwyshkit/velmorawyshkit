/**
 * Mock Mode Utility
 * 
 * Provides mock mode detection and management for development testing.
 * Mock mode allows testing the complete user flow without backend dependencies.
 * 
 * Swiggy 2025 Pattern: Development-only feature, never enabled in production
 */

// Check if we're in development mode
export const isDevelopment = import.meta.env.DEV;

// Storage key for mock mode preference
const MOCK_MODE_STORAGE_KEY = 'wyshkit_mock_mode';

/**
 * Check if mock mode is enabled
 * Phase 1 Cleanup: Always return true - we're in pure mock mode for now
 * This simplifies the codebase and removes all conditionals
 */
export const isMockModeEnabled = (): boolean => {
  // Always mock mode during cleanup phase
  return true;
};

/**
 * Enable mock mode
 * Only works in development
 */
export const enableMockMode = (): boolean => {
  if (!isDevelopment) {
    console.warn('Mock mode can only be enabled in development');
    return false;
  }

  try {
    localStorage.setItem(MOCK_MODE_STORAGE_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Failed to enable mock mode:', error);
    return false;
  }
};

/**
 * Disable mock mode
 */
export const disableMockMode = (): boolean => {
  try {
    localStorage.removeItem(MOCK_MODE_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to disable mock mode:', error);
    return false;
  }
};

/**
 * Toggle mock mode
 */
export const toggleMockMode = (): boolean => {
  if (isMockModeEnabled()) {
    return disableMockMode();
  } else {
    return enableMockMode();
  }
};

/**
 * Get mock user data
 * Returns a consistent mock user for testing
 */
export const getMockUser = () => {
  return {
    id: 'mock-user-123',
    email: 'test@wyshkit.com',
    name: 'Test User',
    avatar: undefined,
    phone: '+919876543210',
    isEmailVerified: true,
    isPhoneVerified: true,
    role: 'customer' as const,
  };
};

