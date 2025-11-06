/**
 * Mock Addresses Storage
 * 
 * Manages addresses in localStorage for mock mode.
 * Provides address operations without backend dependency.
 * 
 * Swiggy 2025 Pattern: localStorage-based addresses for development testing
 */

import { safeGetItem, safeSetItem } from './mock-storage';
// Phase 1 Cleanup: Removed mock-data-validator - simplified validation

const ADDRESSES_STORAGE_KEY = 'wyshkit_mock_addresses';

// Swiggy 2025 Pattern: Clean type names without "Mock" prefix
export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  house: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  created_at: string;
}

import { generateAddressId } from './utils/id-generator';

/**
 * Generate a mock address ID
 * Swiggy 2025: Use centralized ID generator
 */
// Function is now imported from id-generator.ts

/**
 * Get all addresses from localStorage
 */
export const getAddresses = (): Address[] => {
  // Phase 1 Cleanup: Simplified validation - removed validator dependency
  const addresses = safeGetItem<Address[]>(ADDRESSES_STORAGE_KEY, { 
    defaultValue: [],
  });
  return addresses || [];
};

/**
 * Get address by ID
 */
export const getAddressById = (addressId: string): Address | null => {
  const addresses = getAddresses();
  return addresses.find((addr) => addr.id === addressId) || null;
};

/**
 * Get default address
 */
export const getDefaultAddress = (): Address | null => {
  const addresses = getAddresses();
  return addresses.find((addr) => addr.isDefault) || addresses[0] || null;
};

/**
 * Add a new address
 */
export const addAddress = (address: Omit<Address, 'id' | 'created_at'>): Address => {
  const addresses = getAddresses();
  
  // If this is set as default, unset other defaults
  if (address.isDefault) {
    addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  const newAddress: Address = {
    ...address,
    id: generateAddressId(),
    created_at: new Date().toISOString(),
  };

  addresses.push(newAddress);
  safeSetItem(ADDRESSES_STORAGE_KEY, addresses);

  return newAddress;
};

/**
 * Update an address
 */
export const updateAddress = (addressId: string, updates: Partial<Address>): boolean => {
  const addresses = getAddresses();
  const addressIndex = addresses.findIndex((addr) => addr.id === addressId);

  if (addressIndex >= 0) {
    // If setting as default, unset other defaults
    if (updates.isDefault === true) {
      addresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    addresses[addressIndex] = {
      ...addresses[addressIndex],
      ...updates,
    };

    return safeSetItem(ADDRESSES_STORAGE_KEY, addresses);
  }

  return false;
};

/**
 * Delete an address
 */
export const deleteAddress = (addressId: string): boolean => {
  const addresses = getAddresses();
  const filtered = addresses.filter((addr) => addr.id !== addressId);
  return safeSetItem(ADDRESSES_STORAGE_KEY, filtered);
};

/**
 * Pre-populate addresses with sample data for testing
 */
export const prePopulateAddresses = (): void => {
  const existingAddresses = getAddresses();
  if (existingAddresses.length > 0) {
    // Don't overwrite existing addresses
    return;
  }

  const sampleAddresses: Address[] = [
    {
      id: 'mock_address_1',
      label: 'Home',
      name: 'Test User',
      phone: '+919876543210',
      house: '123',
      area: 'MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      isDefault: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock_address_2',
      label: 'Work',
      name: 'Test User',
      phone: '+919876543210',
      house: '456',
      area: 'Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560095',
      isDefault: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock_address_3',
      label: 'Other',
      name: 'Test User',
      phone: '+919876543210',
      house: '789',
      area: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      isDefault: false,
      created_at: new Date().toISOString(),
    },
  ];

  safeSetItem(ADDRESSES_STORAGE_KEY, sampleAddresses);
};

