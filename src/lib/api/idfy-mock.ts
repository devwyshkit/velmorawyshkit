/**
 * IDfy KYC Mock API Client
 * For development - avoids real API costs (₹5-15 per verification)
 * Replace with real IDfy API in production
 */

export interface VerificationResult {
  verification_id: string;
  status: 'verified' | 'failed' | 'pending' | 'manual_review';
  verified_at?: string;
  cost: number; // in rupees
  details?: any;
  error_message?: string;
}

export interface PANVerification extends VerificationResult {
  pan_number: string;
  name_match: boolean;
  details: {
    name: string;
    registered_name: string;
    dob?: string;
    category: string; // Individual, Company, etc.
  };
}

export interface GSTVerification extends VerificationResult {
  gst_number: string;
  details: {
    business_name: string;
    registration_date: string;
    state: string;
    business_type: string;
    status: 'active' | 'cancelled' | 'suspended';
  };
}

export interface BankVerification extends VerificationResult {
  account_number: string;
  ifsc: string;
  name_match: boolean;
  details: {
    account_holder_name: string;
    bank_name: string;
    branch: string;
    account_type: 'savings' | 'current';
  };
}

export interface FSSAIVerification extends VerificationResult {
  fssai_number: string;
  details: {
    license_type: 'Central' | 'State';
    business_name: string;
    valid_until: string;
    category: string;
  };
}

/**
 * Mock IDfy API Client
 */
export const idfyMock = {
  /**
   * Verify PAN card
   * Cost: ₹10
   */
  verifyPAN: async (panNumber: string, name: string): Promise<PANVerification> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock validation: Check PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return {
        verification_id: `VER-PAN-${Date.now()}`,
        pan_number: panNumber,
        status: 'failed',
        name_match: false,
        cost: 10,
        error_message: 'Invalid PAN format',
        details: {
          name: '',
          registered_name: '',
          category: '',
        },
      };
    }

    // Mock success
    return {
      verification_id: `VER-PAN-${Date.now()}`,
      pan_number: panNumber,
      status: 'verified',
      name_match: true,
      verified_at: new Date().toISOString(),
      cost: 10,
      details: {
        name: name,
        registered_name: name.toUpperCase(),
        dob: '1990-01-01',
        category: 'Individual',
      },
    };
  },

  /**
   * Verify GST number
   * Cost: ₹15
   */
  verifyGST: async (gstNumber: string): Promise<GSTVerification> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation: Check GST format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstNumber)) {
      return {
        verification_id: `VER-GST-${Date.now()}`,
        gst_number: gstNumber,
        status: 'failed',
        cost: 15,
        error_message: 'Invalid GST format',
        details: {
          business_name: '',
          registration_date: '',
          state: '',
          business_type: '',
          status: 'cancelled',
        },
      };
    }

    // Mock success
    return {
      verification_id: `VER-GST-${Date.now()}`,
      gst_number: gstNumber,
      status: 'verified',
      verified_at: new Date().toISOString(),
      cost: 15,
      details: {
        business_name: 'Test Business Pvt Ltd',
        registration_date: '2020-04-01',
        state: 'Karnataka',
        business_type: 'Private Limited Company',
        status: 'active',
      },
    };
  },

  /**
   * Verify bank account
   * Cost: ₹10
   */
  verifyBankAccount: async (
    accountNumber: string,
    ifsc: string,
    name: string
  ): Promise<BankVerification> => {
    await new Promise(resolve => setTimeout(resolve, 700));

    // Mock validation: Check IFSC format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc)) {
      return {
        verification_id: `VER-BANK-${Date.now()}`,
        account_number: accountNumber,
        ifsc: ifsc,
        status: 'failed',
        name_match: false,
        cost: 10,
        error_message: 'Invalid IFSC code',
        details: {
          account_holder_name: '',
          bank_name: '',
          branch: '',
          account_type: 'savings',
        },
      };
    }

    // Mock success
    return {
      verification_id: `VER-BANK-${Date.now()}`,
      account_number: accountNumber,
      ifsc: ifsc,
      status: 'verified',
      name_match: true,
      verified_at: new Date().toISOString(),
      cost: 10,
      details: {
        account_holder_name: name,
        bank_name: 'HDFC Bank',
        branch: 'MG Road, Bangalore',
        account_type: 'current',
      },
    };
  },

  /**
   * Verify FSSAI license (for food vendors)
   * Cost: ₹15
   */
  verifyFSSAI: async (fssaiNumber: string): Promise<FSSAIVerification> => {
    await new Promise(resolve => setTimeout(resolve, 900));

    // Mock validation: Check FSSAI format (14 digits)
    const fssaiRegex = /^[0-9]{14}$/;
    if (!fssaiRegex.test(fssaiNumber)) {
      return {
        verification_id: `VER-FSSAI-${Date.now()}`,
        fssai_number: fssaiNumber,
        status: 'failed',
        cost: 15,
        error_message: 'Invalid FSSAI number format',
        details: {
          license_type: 'State',
          business_name: '',
          valid_until: '',
          category: '',
        },
      };
    }

    // Mock success
    return {
      verification_id: `VER-FSSAI-${Date.now()}`,
      fssai_number: fssaiNumber,
      status: 'verified',
      verified_at: new Date().toISOString(),
      cost: 15,
      details: {
        license_type: 'Central',
        business_name: 'Test Food Products Pvt Ltd',
        valid_until: '2026-12-31',
        category: 'Manufacturer',
      },
    };
  },

  /**
   * Get total verification cost for a partner
   */
  calculateVerificationCost: (
    verificationsNeeded: ('pan' | 'gst' | 'bank' | 'fssai')[]
  ): number => {
    const costs = {
      pan: 10,
      gst: 15,
      bank: 10,
      fssai: 15,
    };

    return verificationsNeeded.reduce((total, type) => total + costs[type], 0);
  },
};

/**
 * Validation helpers
 */
export const kycValidators = {
  isPANValid: (pan: string): boolean => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  },

  isGSTValid: (gst: string): boolean => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
  },

  isIFSCValid: (ifsc: string): boolean => {
    return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  },

  isFSSAIValid: (fssai: string): boolean => {
    return /^[0-9]{14}$/.test(fssai);
  },
};

