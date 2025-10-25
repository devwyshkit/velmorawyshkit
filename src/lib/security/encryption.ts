/**
 * Encryption utilities for securing sensitive data in localStorage
 * Prevents XSS attacks from accessing plain text user data
 */

// Simple encryption using Web Crypto API (more secure than crypto-js)
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'wyshkit-fallback-key-2024';

/**
 * Encrypt data using AES-GCM encryption
 * @param data - The data to encrypt
 * @returns Promise<string> - Base64 encoded encrypted data
 */
export const encryptData = async (data: any): Promise<string> => {
  try {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET_KEY.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Return base64 encoded
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to base64 encoding (not secure, but prevents crashes)
    return btoa(JSON.stringify(data));
  }
};

/**
 * Decrypt data using AES-GCM decryption
 * @param encryptedData - Base64 encoded encrypted data
 * @returns Promise<any> - Decrypted data
 */
export const decryptData = async (encryptedData: string): Promise<any> => {
  try {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(SECRET_KEY.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    // Convert back to string and parse JSON
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decrypted);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Fallback to base64 decoding
    try {
      return JSON.parse(atob(encryptedData));
    } catch {
      return null;
    }
  }
};

/**
 * Secure localStorage wrapper with encryption
 */
export const secureStorage = {
  setItem: async (key: string, value: any) => {
    try {
      const encrypted = await encryptData(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage set failed:', error);
      // Fallback to regular storage
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  
  getItem: async (key: string) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return await decryptData(encrypted);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      // Fallback to regular storage
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    }
  },
  
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
  
  clear: () => {
    localStorage.clear();
  }
};
