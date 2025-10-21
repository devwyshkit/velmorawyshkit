/**
 * Real IDfy KYC Verification Service
 * Production API integration for partner onboarding
 * 
 * API Docs: https://eve-api-docs.idfy.com/
 * Account: Production (1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb)
 */

const IDFY_CONFIG = {
  accountId: import.meta.env.VITE_IDFY_ACCOUNT_ID || '1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb',
  apiKey: import.meta.env.VITE_IDFY_API_KEY || 'a7cccddc-cd3c-4431-bd21-2d3f7694b955',
  baseUrl: import.meta.env.VITE_IDFY_BASE_URL || 'https://eve.idfy.com/v3',
};

interface IdfyResponse {
  request_id: string;
  status: 'completed' | 'failed' | 'in_progress';
  result?: {
    source_output?: any;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * PAN Card Verification
 * Cost: ₹10 per verification
 * Response time: 1-3 seconds
 * 
 * @param panNumber - 10 character PAN (ABCDE1234F)
 * @returns Verification result with name and validity
 */
export const verifyPAN = async (panNumber: string) => {
  try {
    const response = await fetch(`${IDFY_CONFIG.baseUrl}/tasks/sync/ind_pan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'account-id': IDFY_CONFIG.accountId,
        'api-key': IDFY_CONFIG.apiKey,
      },
      body: JSON.stringify({
        task_id: `pan_${Date.now()}`,
        group_id: 'partner_kyc',
        data: {
          id_number: panNumber,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result: IdfyResponse = await response.json();

    return {
      verification_id: result.request_id,
      verified: result.status === 'completed' && result.result?.source_output?.valid === 'yes',
      name: result.result?.source_output?.name_on_card || '',
      number: panNumber,
      valid: result.result?.source_output?.valid === 'yes',
      raw_response: result,
    };
  } catch (error: any) {
    console.error('PAN verification error:', error);
    throw error;
  }
};

/**
 * GST Verification
 * Cost: ₹10 per verification
 * Response time: 1-3 seconds
 * 
 * @param gstNumber - 15 character GSTIN
 * @returns Verification result with business name and status
 */
export const verifyGST = async (gstNumber: string) => {
  try {
    const response = await fetch(`${IDFY_CONFIG.baseUrl}/tasks/sync/ind_gst`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'account-id': IDFY_CONFIG.accountId,
        'api-key': IDFY_CONFIG.apiKey,
      },
      body: JSON.stringify({
        task_id: `gst_${Date.now()}`,
        group_id: 'partner_kyc',
        data: {
          gstin: gstNumber,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result: IdfyResponse = await response.json();

    return {
      verification_id: result.request_id,
      verified: result.status === 'completed' && result.result?.source_output?.status === 'Active',
      business_name: result.result?.source_output?.legal_name || '',
      gstin: gstNumber,
      status: result.result?.source_output?.status || 'Unknown',
      address: result.result?.source_output?.principal_place_of_business_address || '',
      raw_response: result,
    };
  } catch (error: any) {
    console.error('GST verification error:', error);
    throw error;
  }
};

/**
 * Bank Account Verification
 * Cost: ₹3 per verification
 * Response time: 1-3 seconds
 * 
 * @param accountNumber - Bank account number
 * @param ifsc - IFSC code
 * @returns Verification result with account holder name
 */
export const verifyBankAccount = async (accountNumber: string, ifsc: string) => {
  try {
    const response = await fetch(`${IDFY_CONFIG.baseUrl}/tasks/sync/ind_bank_account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'account-id': IDFY_CONFIG.accountId,
        'api-key': IDFY_CONFIG.apiKey,
      },
      body: JSON.stringify({
        task_id: `bank_${Date.now()}`,
        group_id: 'partner_kyc',
        data: {
          account_number: accountNumber,
          ifsc: ifsc,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result: IdfyResponse = await response.json();

    return {
      verification_id: result.request_id,
      verified: result.status === 'completed' && result.result?.source_output?.account_exists === true,
      account_holder_name: result.result?.source_output?.name_at_bank || '',
      bank_name: result.result?.source_output?.bank_name || '',
      branch: result.result?.source_output?.branch || '',
      account_number: accountNumber,
      ifsc: ifsc,
      raw_response: result,
    };
  } catch (error: any) {
    console.error('Bank verification error:', error);
    throw error;
  }
};

/**
 * FSSAI License Verification
 * Cost: ₹10 per verification
 * Response time: 1-3 seconds
 * Required for food/consumable products
 * 
 * @param fssaiNumber - 14 digit FSSAI license number
 * @returns Verification result with business details
 */
export const verifyFSSAI = async (fssaiNumber: string) => {
  try {
    const response = await fetch(`${IDFY_CONFIG.baseUrl}/tasks/sync/ind_fssai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'account-id': IDFY_CONFIG.accountId,
        'api-key': IDFY_CONFIG.apiKey,
      },
      body: JSON.stringify({
        task_id: `fssai_${Date.now()}`,
        group_id: 'partner_kyc',
        data: {
          fssai_license_number: fssaiNumber,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const result: IdfyResponse = await response.json();

    return {
      verification_id: result.request_id,
      verified: result.status === 'completed' && result.result?.source_output?.license_status === 'Active',
      business_name: result.result?.source_output?.business_name || '',
      license_number: fssaiNumber,
      license_status: result.result?.source_output?.license_status || 'Unknown',
      address: result.result?.source_output?.address || '',
      raw_response: result,
    };
  } catch (error: any) {
    console.error('FSSAI verification error:', error);
    throw error;
  }
};

/**
 * Handle IDfy API errors with user-friendly messages
 */
export const handleIdfyError = (error: any): string => {
  const statusCode = error.response?.status;
  
  switch (statusCode) {
    case 401:
      return 'API configuration error. Please contact support.';
    case 403:
      return 'Insufficient verification credits. Please contact admin.';
    case 422:
      return 'Invalid document format. Please check and try again.';
    case 429:
      return 'Too many requests. Please wait a moment.';
    case 500:
    case 502:
    case 503:
      return 'Verification service temporarily unavailable. Try again in a few minutes.';
    default:
      return error.message || 'Verification failed. Please try again.';
  }
};

/**
 * Check if IDfy is configured (has credentials)
 */
export const isIdfyConfigured = (): boolean => {
  return !!(IDFY_CONFIG.accountId && IDFY_CONFIG.apiKey);
};

