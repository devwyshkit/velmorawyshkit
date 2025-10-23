# Zoho Integration Documentation

## Overview
This document outlines the integration points between Wyshkit platform and Zoho services for comprehensive business management.

## Integration Architecture

### 1. Zoho Books Integration (Accounting & Invoicing)

#### 1.1 Order to Invoice Sync
**Endpoint**: `POST /api/zoho/books/invoices`
**Purpose**: Automatically create invoices in Zoho Books when orders are confirmed

**Data Flow**:
```
Wyshkit Order → Zoho Books Invoice
├─ Customer Details (name, email, GSTIN)
├─ Product Details (description, quantity, price)
├─ Tax Calculation (GST 18%)
├─ Commission Deduction
└─ Delivery Charges
```

**API Configuration**:
```javascript
const zohoBooksConfig = {
  organizationId: process.env.ZOHO_ORGANIZATION_ID,
  clientId: process.env.ZOHO_CLIENT_ID,
  clientSecret: process.env.ZOHO_CLIENT_SECRET,
  refreshToken: process.env.ZOHO_REFRESH_TOKEN,
  baseUrl: 'https://books.zoho.com/api/v3'
};
```

**Invoice Creation Flow**:
1. Order confirmed in Wyshkit
2. Extract customer and order details
3. Calculate GST and commissions
4. Create invoice in Zoho Books
5. Send invoice to customer
6. Update order status with invoice ID

#### 1.2 Payment Reconciliation
**Endpoint**: `POST /api/zoho/books/payments`
**Purpose**: Sync payment confirmations from Razorpay to Zoho Books

**Webhook Integration**:
```javascript
// Razorpay webhook → Wyshkit → Zoho Books
app.post('/webhooks/razorpay', async (req, res) => {
  const payment = req.body;
  if (payment.event === 'payment.captured') {
    await syncPaymentToZoho(payment);
  }
});
```

### 2. Zoho CRM Integration (Customer Management)

#### 2.1 Customer Data Sync
**Endpoint**: `POST /api/zoho/crm/contacts`
**Purpose**: Automatically create/update customer records in Zoho CRM

**Customer Fields Mapping**:
```javascript
const customerMapping = {
  'wyshkit_id': 'External_ID',
  'name': 'Full_Name',
  'email': 'Email',
  'phone': 'Phone',
  'gstin': 'GSTIN_Number',
  'company': 'Account_Name',
  'total_orders': 'Custom_Field_1',
  'total_spent': 'Custom_Field_2'
};
```

#### 2.2 Lead Generation
**Endpoint**: `POST /api/zoho/crm/leads`
**Purpose**: Create leads for potential B2B customers

**Lead Creation Triggers**:
- Corporate account registration
- Bulk order inquiries (500+ items)
- High-value orders (>₹1,00,000)
- Repeat customer analysis

### 3. Zoho Inventory Integration (Stock Management)

#### 3.1 Product Sync
**Endpoint**: `POST /api/zoho/inventory/items`
**Purpose**: Sync product catalog from Wyshkit to Zoho Inventory

**Product Data Structure**:
```javascript
const productSync = {
  itemName: product.name,
  sku: product.sku,
  purchaseRate: product.cost_price,
  salesRate: product.selling_price,
  stockOnHand: product.stock,
  reorderLevel: product.min_stock,
  vendorId: product.vendor_zoho_id
};
```

#### 3.2 Stock Updates
**Endpoint**: `PUT /api/zoho/inventory/items/{itemId}/stock`
**Purpose**: Update stock levels when orders are placed

**Stock Update Flow**:
1. Order confirmed → Reduce stock in Zoho
2. Order cancelled → Restore stock in Zoho
3. Stock received → Update stock in Zoho
4. Low stock alert → Notify vendor

### 4. Webhook Configuration

#### 4.1 Zoho to Wyshkit Webhooks
```javascript
// Zoho Books webhooks
const zohoWebhooks = {
  'invoice.created': '/webhooks/zoho/invoice-created',
  'payment.received': '/webhooks/zoho/payment-received',
  'item.stock-updated': '/webhooks/zoho/stock-updated'
};
```

#### 4.2 Wyshkit to Zoho Webhooks
```javascript
// Wyshkit webhooks to Zoho
const wyshkitWebhooks = {
  'order.created': 'https://books.zoho.com/api/v3/invoices',
  'payment.confirmed': 'https://books.zoho.com/api/v3/payments',
  'customer.registered': 'https://crm.zoho.com/api/v3/contacts'
};
```

## API Implementation

### 1. Zoho Books API Client

```javascript
class ZohoBooksClient {
  constructor(config) {
    this.config = config;
    this.accessToken = null;
  }

  async authenticate() {
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: this.config.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token'
      })
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
  }

  async createInvoice(invoiceData) {
    await this.authenticate();
    
    const response = await fetch(`${this.config.baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });
    
    return response.json();
  }
}
```

### 2. Order to Invoice Mapping

```javascript
function mapOrderToInvoice(order) {
  return {
    customer_id: order.customer.zoho_contact_id,
    invoice_number: `WYS-${order.id}`,
    date: new Date().toISOString().split('T')[0],
    line_items: order.items.map(item => ({
      item_id: item.zoho_item_id,
      quantity: item.quantity,
      rate: item.price,
      tax_id: 'GST_18'
    })),
    notes: `Order ID: ${order.id}\nDelivery Address: ${order.delivery_address}`,
    terms: '100% advance payment received'
  };
}
```

### 3. Error Handling

```javascript
async function handleZohoError(error) {
  if (error.code === 'INVALID_TOKEN') {
    await refreshAccessToken();
    // Retry the request
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Implement exponential backoff
    await delay(Math.pow(2, retryCount) * 1000);
  } else {
    // Log error and notify admin
    console.error('Zoho API Error:', error);
    await notifyAdmin(error);
  }
}
```

## Environment Variables

```bash
# Zoho Configuration
ZOHO_ORGANIZATION_ID=your_org_id
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token

# Zoho API Endpoints
ZOHO_BOOKS_API_URL=https://books.zoho.com/api/v3
ZOHO_CRM_API_URL=https://crm.zoho.com/api/v3
ZOHO_INVENTORY_API_URL=https://inventory.zoho.com/api/v3

# Webhook URLs
ZOHO_WEBHOOK_SECRET=your_webhook_secret
WYSHKIT_WEBHOOK_URL=https://your-domain.com/webhooks/zoho
```

## Testing

### 1. Unit Tests
```javascript
describe('Zoho Integration', () => {
  test('should create invoice from order', async () => {
    const order = createMockOrder();
    const invoice = await createInvoiceFromOrder(order);
    expect(invoice.invoice_number).toBe(`WYS-${order.id}`);
  });

  test('should handle authentication errors', async () => {
    const client = new ZohoBooksClient(invalidConfig);
    await expect(client.createInvoice({})).rejects.toThrow();
  });
});
```

### 2. Integration Tests
```javascript
describe('Zoho Integration E2E', () => {
  test('should sync order to invoice', async () => {
    // Create order in Wyshkit
    const order = await createOrder();
    
    // Wait for webhook
    await waitForWebhook();
    
    // Verify invoice in Zoho
    const invoice = await getInvoiceFromZoho(order.id);
    expect(invoice).toBeDefined();
  });
});
```

## Security Considerations

1. **Token Management**: Implement secure token storage and rotation
2. **Webhook Security**: Verify webhook signatures
3. **Rate Limiting**: Implement proper rate limiting for API calls
4. **Data Encryption**: Encrypt sensitive data in transit and at rest
5. **Access Control**: Implement proper access controls for API endpoints

## Monitoring & Alerts

1. **API Health Checks**: Monitor Zoho API availability
2. **Sync Status**: Track sync success/failure rates
3. **Error Alerts**: Set up alerts for integration failures
4. **Performance Metrics**: Monitor API response times
5. **Data Validation**: Validate data integrity between systems

## Future Enhancements

1. **Advanced Analytics**: Sync sales data for advanced reporting
2. **Automated Reconciliation**: Implement automated payment reconciliation
3. **Multi-currency Support**: Handle multiple currencies
4. **Bulk Operations**: Optimize for bulk data operations
5. **Real-time Sync**: Implement real-time data synchronization
