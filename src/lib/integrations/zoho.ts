/**
 * Zoho Integration - Books & Sign
 * Invoice generation, document management, and business operations
 */

export interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  organizationId: string;
  baseUrl: string;
}

export interface InvoiceData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface DocumentData {
  documentName: string;
  documentType: 'invoice' | 'estimate' | 'purchase_order';
  customerEmail: string;
  content: string;
  attachments?: string[];
}

export class ZohoIntegration {
  private config: ZohoConfig;
  private accessToken: string | null = null;

  constructor(config: ZohoConfig) {
    this.config = config;
  }

  /**
   * Get access token using refresh token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
        }),
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Zoho access token:', error);
      throw new Error('Failed to authenticate with Zoho');
    }
  }

  /**
   * Create customer in Zoho Books
   */
  async createCustomer(customerData: {
    customer_name: string;
    email: string;
    phone?: string;
    billing_address?: {
      address: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  }) {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/books/v3/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();
      return data.customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer in Zoho');
    }
  }

  /**
   * Create invoice in Zoho Books
   */
  async createInvoice(invoiceData: InvoiceData) {
    const token = await this.getAccessToken();
    
    try {
      const invoicePayload = {
        customer_id: invoiceData.customerId,
        invoice_number: `INV-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        line_items: invoiceData.items.map(item => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        subtotal: invoiceData.subtotal,
        tax_total: invoiceData.tax,
        total: invoiceData.total,
        notes: invoiceData.notes || 'Thank you for your business!',
        payment_terms: 'Net 30',
        payment_terms_label: 'Due in 30 days',
      };

      const response = await fetch(`${this.config.baseUrl}/books/v3/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoicePayload),
      });

      const data = await response.json();
      return data.invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw new Error('Failed to create invoice in Zoho');
    }
  }

  /**
   * Send invoice via email
   */
  async sendInvoice(invoiceId: string, customerEmail: string) {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/books/v3/invoices/${invoiceId}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_mail_ids: [customerEmail],
          subject: 'Invoice from Wyshkit',
          body: 'Please find your invoice attached. Thank you for your business!',
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw new Error('Failed to send invoice');
    }
  }

  /**
   * Create estimate in Zoho Books
   */
  async createEstimate(estimateData: InvoiceData) {
    const token = await this.getAccessToken();
    
    try {
      const estimatePayload = {
        customer_id: estimateData.customerId,
        estimate_number: `EST-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        line_items: estimateData.items.map(item => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        subtotal: estimateData.subtotal,
        tax_total: estimateData.tax,
        total: estimateData.total,
        notes: estimateData.notes || 'This is an estimate. Prices may vary.',
      };

      const response = await fetch(`${this.config.baseUrl}/books/v3/estimates`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(estimatePayload),
      });

      const data = await response.json();
      return data.estimate;
    } catch (error) {
      console.error('Error creating estimate:', error);
      throw new Error('Failed to create estimate in Zoho');
    }
  }

  /**
   * Create document in Zoho Sign
   */
  async createDocument(documentData: DocumentData) {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/sign/v1/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_name: documentData.documentName,
          document_type: documentData.documentType,
          recipients: [{
            email: documentData.customerEmail,
            role: 'SIGNER',
          }],
          content: documentData.content,
          attachments: documentData.attachments || [],
        }),
      });

      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document in Zoho Sign');
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string) {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/books/v3/customers?search_text=${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
        },
      });

      const data = await response.json();
      return data.customers?.find((customer: any) => customer.email === email);
    } catch (error) {
      console.error('Error getting customer:', error);
      return null;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string) {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/books/v3/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
        },
      });

      const data = await response.json();
      return data.invoice;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw new Error('Failed to get invoice from Zoho');
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: 'sent' | 'paid' | 'overdue') {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/books/v3/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw new Error('Failed to update invoice status');
    }
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoiceId: string) {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/books/v3/invoices/${invoiceId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Zoho-oauthtoken ${token}`,
        },
      });

      return await response.blob();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }
}

/**
 * Initialize Zoho integration with environment variables
 */
export function initializeZoho(): ZohoIntegration {
  const config: ZohoConfig = {
    clientId: process.env.REACT_APP_ZOHO_CLIENT_ID || '',
    clientSecret: process.env.REACT_APP_ZOHO_CLIENT_SECRET || '',
    refreshToken: process.env.REACT_APP_ZOHO_REFRESH_TOKEN || '',
    organizationId: process.env.REACT_APP_ZOHO_ORGANIZATION_ID || '',
    baseUrl: process.env.REACT_APP_ZOHO_BASE_URL || 'https://www.zohoapis.com',
  };

  return new ZohoIntegration(config);
}

/**
 * Helper function to create invoice from order data
 */
export async function createInvoiceFromOrder(
  orderData: {
    customerEmail: string;
    customerName: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  }
) {
  const zoho = initializeZoho();
  
  try {
    // Get or create customer
    let customer = await zoho.getCustomerByEmail(orderData.customerEmail);
    if (!customer) {
      customer = await zoho.createCustomer({
        customer_name: orderData.customerName,
        email: orderData.customerEmail,
      });
    }

    // Create invoice
    const invoice = await zoho.createInvoice({
      customerId: customer.customer_id,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      items: orderData.items.map(item => ({
        name: item.name,
        description: `Quantity: ${item.quantity}`,
        quantity: item.quantity,
        rate: item.price,
        amount: item.quantity * item.price,
      })),
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      total: orderData.total,
      notes: 'Thank you for choosing Wyshkit!',
    });

    // Send invoice via email
    await zoho.sendInvoice(invoice.invoice_id, orderData.customerEmail);

    return invoice;
  } catch (error) {
    console.error('Error creating invoice from order:', error);
    throw new Error('Failed to create invoice from order');
  }
}
