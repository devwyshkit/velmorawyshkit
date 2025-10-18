/**
 * IDfy KYC Integration for Partner Onboarding
 * 
 * Provides automated verification for:
 * - PAN Card (Permanent Account Number)
 * - GST Number (Goods and Services Tax)
 * - Bank Account (Penny Drop Verification)
 * 
 * Cost: ₹10-15 per verification
 * Documentation: https://idfy.com/docs
 */

import { supabase } from './supabase-client';

const IDFY_BASE_URL = 'https://eve.idfy.com/v3';
const IDFY_API_KEY = import.meta.env.VITE_IDFY_API_KEY || 'a7cccddc-cd3c-4431-bd21-2d3f7694b955';
const IDFY_ACCOUNT_ID = import.meta.env.VITE_IDFY_ACCOUNT_ID || '1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb';

// ============================================
// Type Definitions
// ============================================

export interface IdfyResponse {
  request_id: string;
  status: 'in_progress' | 'completed' | 'failed';
  result?: {
    valid: boolean;
    name?: string;
    pan?: string;
    gst?: string;
    business_name?: string;
    account_exists?: boolean;
    account_name?: string;
    error?: string;
  };
  error?: string;
}

export interface PANVerificationData {
  panNumber: string;
  name: string;
}

export interface GSTVerificationData {
  gstNumber: string;
}

export interface BankVerificationData {
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
}

// ============================================
// PAN Card Verification
// ============================================

/**
 * Verify PAN Card with name match
 * 
 * @param panNumber - PAN in format AAAAA9999A
 * @param name - Name as per PAN card
 * @returns Verification result with request ID
 * 
 * @example
 * const result = await verifyPAN('ABCDE1234F', 'John Doe');
 * if (result.status === 'completed' && result.result?.valid) {
 *   console.log('PAN verified successfully');
 * }
 */
export async function verifyPAN(panNumber: string, name: string): Promise<IdfyResponse> {
  try {
    // Call Supabase Edge Function (backend proxy) to avoid CORS
    const response = await supabase.functions.invoke('verify-kyc', {
      body: {
        type: 'pan',
        data: {
          id_number: panNumber.toUpperCase(),
          name: name,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Verification failed');
    }

    const data = response.data;
    return {
      request_id: data.request_id || data.task_id || `pan_${Date.now()}`,
      status: data.status || 'completed',
      result: {
        valid: data.status === 'completed' && data.result?.source_output?.status === 'id_found',
        name: data.result?.source_output?.name_on_card,
        pan: panNumber.toUpperCase(),
      },
    };
  } catch (error) {
    console.error('IDfy PAN verification error:', error);
    return {
      request_id: `pan_error_${Date.now()}`,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Verification service unavailable. Please contact support at partners@wyshkit.com',
    };
  }
}

// ============================================
// GST Number Verification
// ============================================

/**
 * Verify GST Number and fetch business details
 * 
 * @param gstNumber - GST in format 22AAAAA0000A1Z5
 * @returns Verification result with business name
 * 
 * @example
 * const result = await verifyGST('22AAAAA0000A1Z5');
 * if (result.status === 'completed' && result.result?.valid) {
 *   console.log('Business:', result.result.business_name);
 * }
 */
export async function verifyGST(gstNumber: string): Promise<IdfyResponse> {
  try {
    // Call Supabase Edge Function (backend proxy)
    const response = await supabase.functions.invoke('verify-kyc', {
      body: {
        type: 'gst',
        data: {
          gstin: gstNumber.toUpperCase(),
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Verification failed');
    }

    const data = response.data;
    return {
      request_id: data.request_id || data.task_id || `gst_${Date.now()}`,
      status: data.status || 'completed',
      result: {
        valid: data.status === 'completed' && data.result?.source_output?.status === 'Active',
        gst: gstNumber.toUpperCase(),
        business_name: data.result?.source_output?.legal_name,
      },
    };
  } catch (error) {
    console.error('IDfy GST verification error:', error);
    return {
      request_id: `gst_error_${Date.now()}`,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Verification service unavailable. Please contact support at partners@wyshkit.com',
    };
  }
}

// ============================================
// Bank Account Verification (Penny Drop)
// ============================================

/**
 * Verify bank account with penny drop method
 * 
 * @param accountNumber - Bank account number
 * @param ifsc - IFSC code
 * @param accountHolder - Name as per bank account
 * @returns Verification result with account name match
 * 
 * @example
 * const result = await verifyBankAccount('1234567890', 'HDFC0000123', 'John Doe');
 * if (result.status === 'completed' && result.result?.valid) {
 *   console.log('Account name:', result.result.account_name);
 * }
 */
export async function verifyBankAccount(
  accountNumber: string,
  ifsc: string,
  accountHolder: string
): Promise<IdfyResponse> {
  try {
    // Call Supabase Edge Function (backend proxy)
    const response = await supabase.functions.invoke('verify-kyc', {
      body: {
        type: 'bank',
        data: {
          account_number: accountNumber,
          ifsc: ifsc.toUpperCase(),
          name_as_per_bank: accountHolder,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Verification failed');
    }

    const data = response.data;
    return {
      request_id: data.request_id || data.task_id || `bank_${Date.now()}`,
      status: data.status || 'completed',
      result: {
        valid: data.status === 'completed' && data.result?.source_output?.account_exists,
        account_exists: data.result?.source_output?.account_exists,
        account_name: data.result?.source_output?.name_at_bank,
      },
    };
  } catch (error) {
    console.error('IDfy Bank verification error:', error);
    return {
      request_id: `bank_error_${Date.now()}`,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Verification service unavailable. Please contact support at partners@wyshkit.com',
    };
  }
}

// ============================================
// Get Verification Status (for async tasks)
// ============================================

/**
 * Check status of an async verification task
 * 
 * @param requestId - Request ID from initial verification
 * @returns Current verification status
 */
export async function getVerificationStatus(requestId: string): Promise<IdfyResponse> {
  try {
    const response = await fetch(`${IDFY_BASE_URL}/tasks/${requestId}`, {
      headers: {
        'api-key': IDFY_API_KEY || '',
        'account-id': IDFY_ACCOUNT_ID || '',
      },
    });

    if (!response.ok) {
      throw new Error(`IDfy status check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      request_id: requestId,
      status: data.status || 'in_progress',
      result: data.result,
    };
  } catch (error) {
    console.error('IDfy status check error:', error);
    return {
      request_id: requestId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Supabase Integration Helpers
// ============================================

/**
 * Update partner verification status in Supabase
 * 
 * @param partnerId - Partner profile ID
 * @param verificationType - Type of verification
 * @param verified - Verification result (true/false)
 * @param requestId - IDfy request ID for audit trail
 */
export async function updatePartnerVerification(
  partnerId: string,
  verificationType: 'pan' | 'gst' | 'bank',
  verified: boolean,
  requestId: string
): Promise<void> {
  const updateField = {
    pan: { pan_verified: verified, idfy_pan_request_id: requestId },
    gst: { gst_verified: verified, idfy_gst_request_id: requestId },
    bank: { bank_verified: verified, idfy_bank_request_id: requestId },
  }[verificationType];

  const { error } = await supabase
    .from('partner_profiles')
    .update(updateField)
    .eq('id', partnerId);

  if (error) {
    console.error('Failed to update verification status:', error);
    throw error;
  }
}

// ============================================
// Client-Side Validation (free, instant)
// ============================================

/**
 * Validate PAN format (client-side, no API call)
 * Format: AAAAA9999A (5 letters, 4 digits, 1 letter)
 */
export function validatePANFormat(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

/**
 * Validate GST format (client-side, no API call)
 * Format: 22AAAAA0000A1Z5 (2 digits, 5 letters, 4 digits, 1 letter, 1 digit, Z, 1 alphanumeric)
 */
export function validateGSTFormat(gst: string): boolean {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
}

/**
 * Validate IFSC format (client-side, no API call)
 * Format: AAAA0999999 (4 letters, 0, 6 alphanumeric)
 */
export function validateIFSCFormat(ifsc: string): boolean {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.toUpperCase());
}

/**
 * Validate Indian phone number format (client-side)
 * Format: 6-9 followed by 9 digits
 */
export function validatePhoneFormat(phone: string): boolean {
  const phoneRegex = /^[6-9][0-9]{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate pincode format (client-side)
 * Format: 6 digits
 */
export function validatePincodeFormat(pincode: string): boolean {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
}

