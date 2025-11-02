export interface RefrensInvoiceItem {
  name: string;
  rate: number;
  quantity: number;
  gstRate?: number;
}

export interface RefrensInvoicePayload {
  invoiceTitle: string;
  invoiceSubTitle?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  invoiceType: 'INVOICE' | 'BOS';
  currency: string;
  billedTo: {
    name: string;
    street?: string;
    city?: string;
    pincode?: string;
    gstState?: string;
    state?: string;
    country: string;
    gstin?: string;
    panNumber?: string;
    phone?: string;
    email?: string;
  };
  billedBy: {
    name: string;
    street?: string;
    city?: string;
    pincode?: string;
    gstState?: string;
    country: string;
    gstin?: string;
  };
  items: RefrensInvoiceItem[];
  email?: {
    to: { name: string; email: string };
    cc?: Array<{ name: string; email: string }>;
  };
}

export interface RefrensInvoiceResponse {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
  billType: string;
  status: string;
  billedBy: any;
  billedTo: any;
  invoiceTitle: string;
  items: any[];
  finalTotal: {
    total: number;
    amount: number;
    subTotal: number;
    igst?: number;
    cgst?: number;
    sgst?: number;
  };
  share: {
    link: string;
    pdf: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class RefrensService {
  private apiKey: string;
  private urlKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_REFRENS_API_KEY || '';
    this.urlKey = import.meta.env.VITE_REFRENS_URL_KEY || '';
    this.baseUrl = import.meta.env.VITE_REFRENS_BASE_URL || 'https://api.refrens.com';
  }

  async createInvoice(payload: RefrensInvoicePayload): Promise<RefrensInvoiceResponse> {
    if (!this.apiKey || !this.urlKey) {
      console.warn('Refrens API credentials not configured. Using mock invoice.');
      return this.getMockInvoiceResponse(payload);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/businesses/${this.urlKey}/invoices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Refrens invoice:', error);
      // Return mock invoice on error to prevent checkout failure
      return this.getMockInvoiceResponse(payload);
    }
  }

  async getInvoice(invoiceId: string): Promise<RefrensInvoiceResponse> {
    if (!this.apiKey || !this.urlKey) {
      throw new Error('Refrens API credentials not configured');
    }

    const response = await fetch(
      `${this.baseUrl}/businesses/${this.urlKey}/invoices/${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async findInvoices(params?: { $limit?: number; $skip?: number; $sort?: any }): Promise<any> {
    if (!this.apiKey || !this.urlKey) {
      throw new Error('Refrens API credentials not configured');
    }

    const queryString = new URLSearchParams();
    if (params?.$limit) queryString.append('$limit', params.$limit.toString());
    if (params?.$skip) queryString.append('$skip', params.$skip.toString());
    if (params?.$sort) queryString.append('$sort', JSON.stringify(params.$sort));

    const response = await fetch(
      `${this.baseUrl}/businesses/${this.urlKey}/invoices?${queryString.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private getMockInvoiceResponse(payload: RefrensInvoicePayload): RefrensInvoiceResponse {
    // Mock response for development/testing
    const subtotal = payload.items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    const gst = subtotal * 0.18; // 18% GST
    const total = subtotal + gst;

    return {
      _id: `mock_${Date.now()}`,
      invoiceNumber: payload.invoiceNumber || `WYSH-${Date.now()}`,
      invoiceDate: payload.invoiceDate || new Date().toISOString(),
      currency: payload.currency,
      billType: payload.invoiceType,
      status: 'UNPAID',
      billedBy: payload.billedBy,
      billedTo: payload.billedTo,
      invoiceTitle: payload.invoiceTitle,
      items: payload.items.map(item => ({
        name: item.name,
        rate: item.rate,
        quantity: item.quantity,
        gstRate: item.gstRate || 18,
        subTotal: item.rate * item.quantity,
        amount: item.rate * item.quantity,
        total: (item.rate * item.quantity) * (1 + (item.gstRate || 18) / 100),
      })),
      finalTotal: {
        total,
        amount: subtotal,
        subTotal: subtotal,
        cgst: gst / 2,
        sgst: gst / 2,
      },
      share: {
        link: '#',
        pdf: '#',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const refrensService = new RefrensService();

