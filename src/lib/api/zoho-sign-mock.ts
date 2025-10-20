/**
 * Zoho Sign Mock API Client
 * For development - avoids real API costs
 * Replace with real Zoho Sign API in production
 */

export interface SigningRequest {
  request_id: string;
  document_name: string;
  signer_name: string;
  signer_email: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired';
  signing_url: string;
  expires_at: string;
  sent_at?: string;
  signed_at?: string;
  document_url?: string;
}

export interface ContractTemplate {
  template_id: string;
  name: string;
  description: string;
  fields: string[]; // Fields to be filled
}

/**
 * Mock Zoho Sign API Client
 */
export const zohoSignMock = {
  /**
   * Send partnership contract for signing
   */
  sendPartnershipContract: async (
    partnerId: string,
    partnerData: {
      name: string;
      email: string;
      businessName: string;
      commissionPercent: number;
    }
  ): Promise<SigningRequest> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const requestId = `REQ-${Date.now()}-${partnerId.slice(0, 8)}`;

    return {
      request_id: requestId,
      document_name: 'Wyshkit Partnership Agreement',
      signer_name: partnerData.name,
      signer_email: partnerData.email,
      status: 'sent',
      signing_url: `https://mock-zoho-sign.com/sign/${requestId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      sent_at: new Date().toISOString(),
    };
  },

  /**
   * Check signing status
   */
  getSigningStatus: async (requestId: string): Promise<SigningRequest> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock: Return signed status after 2 seconds (simulate partner signing)
    return {
      request_id: requestId,
      document_name: 'Wyshkit Partnership Agreement',
      signer_name: 'Partner Name',
      signer_email: 'partner@example.com',
      status: 'signed', // Mock as already signed
      signing_url: `https://mock-zoho-sign.com/sign/${requestId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      signed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      document_url: `https://mock-zoho-sign.com/document/${requestId}.pdf`,
    };
  },

  /**
   * Resend signing request
   */
  resendSigningRequest: async (requestId: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      message: 'Signing request resent successfully',
    };
  },

  /**
   * Download signed document
   */
  downloadSignedDocument: async (requestId: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return `https://mock-zoho-sign.com/download/${requestId}.pdf`;
  },

  /**
   * Get available contract templates
   */
  getContractTemplates: async (): Promise<ContractTemplate[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      {
        template_id: 'TMPL-PARTNERSHIP',
        name: 'Partnership Agreement',
        description: 'Standard partnership agreement with commission terms',
        fields: ['partner_name', 'business_name', 'commission_percent', 'start_date'],
      },
      {
        template_id: 'TMPL-NDA',
        name: 'Non-Disclosure Agreement',
        description: 'Confidentiality agreement for platform data',
        fields: ['partner_name', 'business_name', 'effective_date'],
      },
      {
        template_id: 'TMPL-AMENDMENT',
        name: 'Contract Amendment',
        description: 'Amendment to existing partnership terms',
        fields: ['partner_name', 'amendment_type', 'new_terms', 'effective_date'],
      },
    ];
  },

  /**
   * Void/cancel a signing request
   */
  voidSigningRequest: async (requestId: string, reason: string): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
    };
  },
};

/**
 * Generate contract data for partnership agreement
 */
export function generatePartnershipContractData(partnerData: {
  name: string;
  businessName: string;
  commissionPercent: number;
  email: string;
  phone: string;
}) {
  return {
    partner_name: partnerData.name,
    business_name: partnerData.businessName,
    commission_percent: partnerData.commissionPercent,
    email: partnerData.email,
    phone: partnerData.phone,
    start_date: new Date().toISOString().split('T')[0],
    platform_name: 'Wyshkit',
    payment_terms: 'NET 15 days',
    minimum_quality_standards: '4.0+ rating, <2% return rate',
    termination_notice: '30 days',
  };
}

