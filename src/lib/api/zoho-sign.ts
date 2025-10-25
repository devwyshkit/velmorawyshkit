/**
 * Real Zoho Sign API Client
 * Production-ready implementation for document signing
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
  fields: string[];
}

export interface ZohoSignConfig {
  apiKey: string;
  baseUrl: string;
}

class ZohoSignClient {
  private config: ZohoSignConfig;

  constructor(config: ZohoSignConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Zoho Sign API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    return response.json();
  }

  /**
   * Send partnership contract for signing
   */
  async sendPartnershipContract(
    partnerId: string,
    partnerData: {
      name: string;
      email: string;
      businessName: string;
      commissionPercent: number;
    }
  ): Promise<SigningRequest> {
    try {
      // Create the document request
      const requestData = {
        requests: {
          request_name: `Partnership Agreement - ${partnerData.businessName}`,
          document_ids: ['PARTNERSHIP_TEMPLATE'], // You'll need to upload/create this template in Zoho Sign
          request_type_id: 'PARTNERSHIP_REQUEST',
          expiry_days: 7,
          is_sequential: false,
          actions: {
            action_type: 'SIGN',
            recipient_name: partnerData.name,
            recipient_email: partnerData.email,
            message: `Dear ${partnerData.name}, please review and sign the partnership agreement for ${partnerData.businessName}. Commission rate: ${partnerData.commissionPercent}%.`,
            private_notes: `Partner ID: ${partnerId}, Commission: ${partnerData.commissionPercent}%`,
          },
          fields: {
            recipient_fields: [
              {
                field_id: 'PARTNER_NAME',
                field_name: 'Partner Name',
                field_value: partnerData.name,
                field_type: 'TEXT',
                is_mandatory: true,
              },
              {
                field_id: 'BUSINESS_NAME',
                field_name: 'Business Name',
                field_value: partnerData.businessName,
                field_type: 'TEXT',
                is_mandatory: true,
              },
              {
                field_id: 'COMMISSION_PERCENT',
                field_name: 'Commission Percentage',
                field_value: partnerData.commissionPercent.toString(),
                field_type: 'TEXT',
                is_mandatory: true,
              },
            ],
          },
        },
      };

      const response = await this.makeRequest('/requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (response.requests && response.requests.request_id) {
        const requestId = response.requests.request_id;
        
        // Get the signing URL
        const requestDetails = await this.getSigningStatus(requestId);
        
        return {
          request_id: requestId,
          document_name: `Partnership Agreement - ${partnerData.businessName}`,
          signer_name: partnerData.name,
          signer_email: partnerData.email,
          status: 'sent',
          signing_url: requestDetails.signing_url,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          sent_at: new Date().toISOString(),
        };
      } else {
        throw new Error('Failed to create signing request: Invalid response format');
      }
    } catch (error: any) {
      console.error('Error sending partnership contract:', error);
      throw new Error(`Failed to send partnership contract: ${error.message}`);
    }
  }

  /**
   * Check signing status
   */
  async getSigningStatus(requestId: string): Promise<SigningRequest> {
    try {
      const response = await this.makeRequest(`/requests/${requestId}`);

      if (response.requests) {
        const request = response.requests;
        const signer = request.actions?.[0]; // Get first signer

        return {
          request_id: requestId,
          document_name: request.request_name || 'Partnership Agreement',
          signer_name: signer?.recipient_name || 'Unknown',
          signer_email: signer?.recipient_email || 'Unknown',
          status: this.mapZohoStatus(request.status),
          signing_url: request.signing_url || `https://sign.zoho.in/sign/${requestId}`,
          expires_at: request.expiry_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          sent_at: request.created_time,
          signed_at: request.completed_time,
          document_url: request.completed_doc_url,
        };
      } else {
        throw new Error('Invalid response format from Zoho Sign API');
      }
    } catch (error: any) {
      console.error('Error getting signing status:', error);
      throw new Error(`Failed to get signing status: ${error.message}`);
    }
  }

  /**
   * Resend signing request
   */
  async resendSigningRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest(`/requests/${requestId}/remind`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Please complete the partnership agreement signing process.',
        }),
      });

      return {
        success: true,
        message: 'Signing request resent successfully',
      };
    } catch (error: any) {
      console.error('Error resending signing request:', error);
      return {
        success: false,
        message: `Failed to resend request: ${error.message}`,
      };
    }
  }

  /**
   * Download signed document
   */
  async downloadSignedDocument(requestId: string): Promise<string> {
    try {
      const response = await this.makeRequest(`/requests/${requestId}/pdf`);
      
      if (response.document_url) {
        return response.document_url;
      } else {
        throw new Error('No document URL found in response');
      }
    } catch (error: any) {
      console.error('Error downloading signed document:', error);
      throw new Error(`Failed to download document: ${error.message}`);
    }
  }

  /**
   * Get available contract templates
   */
  async getContractTemplates(): Promise<ContractTemplate[]> {
    try {
      const response = await this.makeRequest('/templates');

      if (response.templates) {
        return response.templates.map((template: any) => ({
          template_id: template.template_id,
          name: template.template_name,
          description: template.description || 'Contract template',
          fields: template.fields?.map((field: any) => field.field_name) || [],
        }));
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('Error getting contract templates:', error);
      return [];
    }
  }

  /**
   * Void/cancel a signing request
   */
  async voidSigningRequest(requestId: string, reason: string): Promise<{ success: boolean }> {
    try {
      await this.makeRequest(`/requests/${requestId}`, {
        method: 'DELETE',
        body: JSON.stringify({
          reason: reason,
        }),
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error voiding signing request:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Map Zoho Sign status to our status format
   */
  private mapZohoStatus(zohoStatus: string): SigningRequest['status'] {
    const statusMap: Record<string, SigningRequest['status']> = {
      'DRAFT': 'draft',
      'SENT': 'sent',
      'VIEWED': 'viewed',
      'SIGNED': 'signed',
      'DECLINED': 'declined',
      'EXPIRED': 'expired',
      'COMPLETED': 'signed',
      'IN_PROGRESS': 'viewed',
    };

    return statusMap[zohoStatus] || 'draft';
  }
}

/**
 * Initialize Zoho Sign client with environment variables
 */
export const initializeZohoSignClient = (): ZohoSignClient | null => {
  const apiKey = import.meta.env.VITE_ZOHO_SIGN_API_KEY;
  const baseUrl = import.meta.env.VITE_ZOHO_SIGN_API_BASE_URL || 'https://sign.zoho.in/api/v1';

  if (!apiKey) {
    console.warn('VITE_ZOHO_SIGN_API_KEY not found in environment variables');
    return null;
  }

  return new ZohoSignClient({ apiKey, baseUrl });
};

/**
 * Main Zoho Sign client instance
 */
export const zohoSign = initializeZohoSignClient();

/**
 * Fallback function that uses mock if real API is not available
 */
export const getZohoSignClient = () => {
  if (zohoSign) {
    return zohoSign;
  } else {
    // Import mock dynamically to avoid circular dependencies
    const { zohoSignMock } = require('./zoho-sign-mock');
    console.warn('Using Zoho Sign mock client - real API key not configured');
    return zohoSignMock;
  }
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

export default ZohoSignClient;
