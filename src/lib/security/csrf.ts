// CSRF Protection for Supabase mutations
// Prevents Cross-Site Request Forgery attacks

import { ValidationSchemas } from '@/lib/validation/schemas';

// CSRF token storage key
const CSRF_TOKEN_KEY = 'wyshkit_csrf_token';

/**
 * Generate a new CSRF token and store it in sessionStorage
 * @returns The generated CSRF token
 */
export const generateCSRFToken = (): string => {
  const token = crypto.randomUUID();
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
};

/**
 * Validate a CSRF token against the stored token
 * @param token The token to validate
 * @returns True if valid, false otherwise
 */
export const validateCSRFToken = (token: string): boolean => {
  try {
    // Validate token format
    ValidationSchemas.CSRFToken.parse(token);
    
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    return token === storedToken;
  } catch (error) {
    console.error('CSRF token validation failed:', error);
    return false;
  }
};

/**
 * Clear the CSRF token (call on logout)
 */
export const clearCSRFToken = (): void => {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
};

/**
 * Get the current CSRF token
 * @returns The current token or null if not set
 */
export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem(CSRF_TOKEN_KEY);
};

/**
 * Wrapper for Supabase mutations that includes CSRF protection
 * @param mutationFn The mutation function to protect
 * @param token The CSRF token
 * @returns Promise with the mutation result
 */
export const withCSRFProtection = async <T>(
  mutationFn: () => Promise<T>,
  token: string
): Promise<T> => {
  if (!validateCSRFToken(token)) {
    throw new Error('Invalid CSRF token. Please refresh the page and try again.');
  }
  
  return await mutationFn();
};

/**
 * Generate CSRF token for form submissions
 * @returns Object with token and validation function
 */
export const createCSRFProtection = () => {
  const token = generateCSRFToken();
  
  return {
    token,
    validate: (submittedToken: string) => validateCSRFToken(submittedToken),
    clear: () => clearCSRFToken()
  };
};

/**
 * Middleware for API calls that require CSRF protection
 * @param token The CSRF token from the request
 * @returns True if the request should proceed
 */
export const csrfMiddleware = (token: string): boolean => {
  if (!token) {
    throw new Error('CSRF token is required');
  }
  
  if (!validateCSRFToken(token)) {
    throw new Error('Invalid CSRF token');
  }
  
  return true;
};

/**
 * Initialize CSRF protection for the application
 * Call this when the user logs in
 */
export const initializeCSRFProtection = (): string => {
  return generateCSRFToken();
};

/**
 * Cleanup CSRF protection
 * Call this when the user logs out
 */
export const cleanupCSRFProtection = (): void => {
  clearCSRFToken();
};
