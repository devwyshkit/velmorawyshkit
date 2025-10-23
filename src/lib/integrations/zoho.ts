/**
 * Zoho Integration API Client
 * Handles Zoho Books, Desk, and Analytics integrations
 * Professional B2B invoicing and support ticket management
 */

// Zoho Books API Client
export class ZohoBooksClient {
  private baseUrl: string;
  private accessToken: string;
  private organizationId: string;

  constructor(accessToken: string, organizationId: string) {
    this.baseUrl = 'https://books.zoho.in/api/v3';
    this.accessToken = accessToken;
    this.organizationId = organizationId;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Zoho Books API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Create invoice for partner commission
  async createCommissionInvoice(partnerData: {
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    month: string;
    year: number;
    commissionAmount: number;
    gstAmount: number;
    totalAmount: number;
    orderCount: number;
    gmv: number;
  }) {
    const invoiceData = {
      customer_id: partnerData.partnerId,
      invoice_number: `WYS-${partnerData.month.toUpperCase()}${partnerData.year}-${partnerData.partnerId.slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      line_items: [
        {
          item_id: 'commission_service',
          name: `Commission - ${partnerData.month} ${partnerData.year}`,
          description: `Platform commission for ${partnerData.orderCount} orders (GMV: ₹${partnerData.gmv.toLocaleString()})`,
          rate: partnerData.commissionAmount,
          quantity: 1,
          tax_id: 'gst_18' // 18% GST
        }
      ],
      notes: 'Payment via NEFT/RTGS to registered bank account',
      terms: 'Net 7 days. Late payment: 2% penalty per month',
      custom_fields: [
        {
          customfield_id: 'cf_order_count',
          value: partnerData.orderCount.toString()
        },
        {
          customfield_id: 'cf_gmv',
          value: partnerData.gmv.toString()
        }
      ]
    };

    return this.makeRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  // Get invoice by ID
  async getInvoice(invoiceId: string) {
    return this.makeRequest(`/invoices/${invoiceId}`);
  }

  // Get all invoices for a customer
  async getCustomerInvoices(customerId: string, page = 1, perPage = 25) {
    return this.makeRequest(`/invoices?customer_id=${customerId}&page=${page}&per_page=${perPage}`);
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId: string, status: 'sent' | 'paid' | 'overdue') {
    return this.makeRequest(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Get invoice PDF
  async getInvoicePDF(invoiceId: string) {
    return this.makeRequest(`/invoices/${invoiceId}/pdf`);
  }

  // Create customer (partner)
  async createCustomer(partnerData: {
    name: string;
    email: string;
    phone: string;
    billingAddress: {
      address: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    gstin?: string;
  }) {
    const customerData = {
      customer_name: partnerData.name,
      email: partnerData.email,
      phone: partnerData.phone,
      billing_address: {
        address: partnerData.billingAddress.address,
        city: partnerData.billingAddress.city,
        state: partnerData.billingAddress.state,
        zip: partnerData.billingAddress.zip,
        country: partnerData.billingAddress.country,
      },
      gst_no: partnerData.gstin,
      customer_type: 'business',
      is_taxable: true,
    };

    return this.makeRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      });
  }
}

// Zoho Desk API Client
export class ZohoDeskClient {
  private baseUrl: string;
  private accessToken: string;
  private organizationId: string;

  constructor(accessToken: string, organizationId: string) {
    this.baseUrl = 'https://desk.zoho.in/api/v1';
    this.accessToken = accessToken;
    this.organizationId = organizationId;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
        headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
          'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Zoho Desk API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Create support ticket
  async createTicket(ticketData: {
    subject: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    category: string;
    requesterEmail: string;
    requesterName: string;
    customFields?: Record<string, any>;
  }) {
    const ticket = {
      subject: ticketData.subject,
      description: ticketData.description,
      priority: ticketData.priority,
      category: ticketData.category,
      requester: {
        email: ticketData.requesterEmail,
        name: ticketData.requesterName,
      },
      customFields: ticketData.customFields || {},
    };

    return this.makeRequest('/tickets', {
        method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  // Get ticket by ID
  async getTicket(ticketId: string) {
    return this.makeRequest(`/tickets/${ticketId}`);
  }

  // Get tickets for a requester
  async getRequesterTickets(requesterEmail: string, page = 1, perPage = 25) {
    return this.makeRequest(`/tickets?requesterEmail=${requesterEmail}&page=${page}&per_page=${perPage}`);
  }

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: 'Open' | 'In Progress' | 'Resolved' | 'Closed') {
    return this.makeRequest(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Add comment to ticket
  async addTicketComment(ticketId: string, comment: string, isPublic: boolean = true) {
    return this.makeRequest(`/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
        content: comment,
        isPublic,
        }),
      });
  }
}

// Zoho Analytics API Client
export class ZohoAnalyticsClient {
  private baseUrl: string;
  private accessToken: string;
  private workspaceId: string;

  constructor(accessToken: string, workspaceId: string) {
    this.baseUrl = 'https://analyticsapi.zoho.in/api';
    this.accessToken = accessToken;
    this.workspaceId = workspaceId;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
        headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
        },
      });

    if (!response.ok) {
      throw new Error(`Zoho Analytics API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get GMV analytics
  async getGMVAnalytics(dateRange: { from: string; to: string }) {
    return this.makeRequest(`/workspaces/${this.workspaceId}/reports/gmv`, {
      method: 'POST',
      body: JSON.stringify({
        dateRange,
        metrics: ['total_gmv', 'order_count', 'average_order_value'],
        groupBy: ['date', 'partner'],
      }),
    });
  }

  // Get commission analytics
  async getCommissionAnalytics(dateRange: { from: string; to: string }) {
    return this.makeRequest(`/workspaces/${this.workspaceId}/reports/commission`, {
      method: 'POST',
        body: JSON.stringify({
        dateRange,
        metrics: ['total_commission', 'commission_by_rule', 'commission_by_partner'],
        groupBy: ['date', 'rule_type', 'partner'],
        }),
      });
  }

  // Get partner performance
  async getPartnerPerformance(partnerId?: string) {
    return this.makeRequest(`/workspaces/${this.workspaceId}/reports/partner-performance`, {
      method: 'POST',
      body: JSON.stringify({
        partnerId,
        metrics: ['gmv', 'order_count', 'commission_earned', 'rating'],
        timeRange: 'last_30_days',
      }),
    });
  }
}

// Main Zoho Integration Service
export class ZohoIntegrationService {
  public books: ZohoBooksClient;
  public desk: ZohoDeskClient;
  public analytics: ZohoAnalyticsClient;

  constructor(config: {
    booksToken: string;
    booksOrgId: string;
    deskToken: string;
    deskOrgId: string;
    analyticsToken: string;
    analyticsWorkspaceId: string;
  }) {
    this.books = new ZohoBooksClient(config.booksToken, config.booksOrgId);
    this.desk = new ZohoDeskClient(config.deskToken, config.deskOrgId);
    this.analytics = new ZohoAnalyticsClient(config.analyticsToken, config.analyticsWorkspaceId);
  }

  // Generate monthly commission invoice
  async generateMonthlyCommissionInvoice(partnerData: {
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    month: string;
    year: number;
    commissionAmount: number;
    orderCount: number;
    gmv: number;
  }) {
    const gstAmount = partnerData.commissionAmount * 0.18; // 18% GST
    const totalAmount = partnerData.commissionAmount + gstAmount;

    return this.books.createCommissionInvoice({
      ...partnerData,
      gstAmount,
      totalAmount,
    });
  }

  // Create support ticket for partner
  async createPartnerSupportTicket(ticketData: {
    subject: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    partnerEmail: string;
    partnerName: string;
  }) {
    return this.desk.createTicket({
      ...ticketData,
      category: 'Partner Support',
      customFields: {
        partner_email: ticketData.partnerEmail,
        partner_name: ticketData.partnerName,
      },
    });
  }

  // Get platform analytics
  async getPlatformAnalytics(dateRange: { from: string; to: string }) {
    const [gmvData, commissionData] = await Promise.all([
      this.analytics.getGMVAnalytics(dateRange),
      this.analytics.getCommissionAnalytics(dateRange),
    ]);

    return {
      gmv: gmvData,
      commission: commissionData,
    };
  }
}

// Environment configuration
export const getZohoConfig = () => {
  return {
    booksToken: process.env.REACT_APP_ZOHO_BOOKS_TOKEN || '',
    booksOrgId: process.env.REACT_APP_ZOHO_BOOKS_ORG_ID || '',
    deskToken: process.env.REACT_APP_ZOHO_DESK_TOKEN || '',
    deskOrgId: process.env.REACT_APP_ZOHO_DESK_ORG_ID || '',
    analyticsToken: process.env.REACT_APP_ZOHO_ANALYTICS_TOKEN || '',
    analyticsWorkspaceId: process.env.REACT_APP_ZOHO_ANALYTICS_WORKSPACE_ID || '',
  };
};

// Initialize Zoho service
export const initializeZohoService = () => {
  const config = getZohoConfig();
  return new ZohoIntegrationService(config);
};

export default ZohoIntegrationService;