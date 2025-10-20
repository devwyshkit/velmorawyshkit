# Zoho Books Integration Plan

## Overview
Integrate Zoho Books for automated invoicing, commission contracts, payouts, and financial reporting - mirroring Swiggy/Zomato's financial automation.

---

## Integration Points

### 1. Automated Invoicing
**Trigger:** Order completion (order.status = 'completed')  
**Zoho API:** POST `/invoices`

**Data Flow:**
```
Order Complete → Calculate Commission → Generate Invoice → Send to Partner
```

**Invoice Structure:**
```json
{
  "customer_id": "partner_zoho_id",
  "invoice_number": "WK-2025-10-001",
  "date": "2025-10-20",
  "line_items": [
    {
      "item_id": "commission",
      "name": "Platform Commission - Order #ORD-12345",
      "rate": 500.00,
      "quantity": 1,
      "tax_id": "GST-18%"
    }
  ],
  "notes": "Commission for order period: Oct 1-20, 2025"
}
```

**Implementation:**
```typescript
// src/lib/integrations/zoho-books.ts
export const generateCommissionInvoice = async (
  orderId: string,
  partnerId: string,
  orderTotal: number,
  commissionPercent: number
) => {
  const commissionAmount = orderTotal * (commissionPercent / 100);
  
  // Mock implementation (replace with real Zoho API)
  const invoice = {
    invoice_number: `WK-${new Date().toISOString().slice(0,7).replace('-','')}-${orderId.slice(-4)}`,
    customer_id: partnerId,
    line_items: [{
      name: `Platform Commission - Order #${orderId}`,
      rate: commissionAmount / 100, // Convert paise to rupees
      quantity: 1,
      tax_percentage: 18, // GST
    }],
    date: new Date().toISOString().split('T')[0],
  };
  
  // TODO: Replace with actual Zoho API call
  // const response = await fetch('https://books.zoho.in/api/v3/invoices', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify(invoice)
  // });
  
  console.log('Mock Zoho Invoice:', invoice);
  return invoice;
};
```

---

### 2. Commission Contracts
**Use Case:** Store partner commission agreements in Zoho  
**Zoho API:** POST `/estimates` (use as contracts)

**Contract Template:**
```
Partner: [Partner Name]
Commission Rate: 15% (Premium Partner) or 20% (Standard)
Effective Date: [Signup Date]
Terms:
- Commission charged per completed order
- Payout cycle: Bi-weekly (1st and 15th)
- Minimum payout: ₹1,000
- Loyalty badges unlock lower rates (15% for Premium Partner)
```

**Implementation:**
```typescript
export const createCommissionContract = async (
  partnerId: string,
  partnerName: string,
  commissionPercent: number
) => {
  const contract = {
    estimate_number: `CONTRACT-${partnerId.slice(-8)}`,
    customer_id: partnerId,
    date: new Date().toISOString().split('T')[0],
    line_items: [{
      name: 'Platform Commission Agreement',
      description: `Commission rate: ${commissionPercent}%\nPayout cycle: Bi-weekly`,
      rate: 0, // Contract, no charges
    }],
    notes: `This agreement governs commission structure for ${partnerName}.`,
  };
  
  // TODO: Replace with actual Zoho API call
  console.log('Mock Zoho Contract:', contract);
  return contract;
};
```

---

### 3. Payout Processing
**Trigger:** Bi-weekly cron job (1st and 15th of month)  
**Zoho API:** POST `/vendorpayments`

**Payout Flow:**
```
Calculate Earnings → Deduct Commission → Generate Payout → Zoho Books → Razorpay Transfer
```

**Implementation:**
```typescript
export const processPartnerPayout = async (
  partnerId: string,
  startDate: string,
  endDate: string
) => {
  // Calculate earnings for period
  const { data: orders } = await supabase
    .from('orders')
    .select('total, commission_amount')
    .eq('partner_id', partnerId)
    .eq('status', 'completed')
    .gte('completed_at', startDate)
    .lte('completed_at', endDate);
  
  const totalEarnings = orders?.reduce((sum, o) => sum + (o.total - o.commission_amount), 0) || 0;
  
  if (totalEarnings < 100000) { // Minimum ₹1,000 for payout
    return { skipped: true, reason: 'Below minimum payout threshold' };
  }
  
  // Create payout in Zoho Books
  const payout = {
    vendor_id: partnerId,
    payment_mode: 'bank_transfer',
    amount: totalEarnings / 100,
    date: new Date().toISOString().split('T')[0],
    reference_number: `PAYOUT-${partnerId.slice(-8)}-${new Date().toISOString().slice(0,7)}`,
    description: `Payout for period: ${startDate} to ${endDate}`,
  };
  
  // TODO: Replace with actual Zoho API call
  console.log('Mock Zoho Payout:', payout);
  return payout;
};
```

---

### 4. Financial Reports
**Use Case:** Monthly partner earnings reports  
**Zoho API:** GET `/reports`

**Report Types:**
1. **Partner Earnings Report:** Monthly revenue per partner
2. **Commission Report:** Total platform commissions
3. **Category Performance:** Revenue by product category
4. **Tax Report:** GST collected and payable

**Implementation:**
```typescript
export const generateMonthlyReport = async (month: string) => {
  // Fetch from Supabase
  const { data: partners } = await supabase
    .from('partners')
    .select('id, name, total_revenue, total_commission');
  
  // Format for Zoho Books
  const report = {
    report_type: 'partner_earnings',
    period: month,
    data: partners?.map(p => ({
      partner_name: p.name,
      revenue: p.total_revenue / 100,
      commission: p.total_commission / 100,
      net_payout: (p.total_revenue - p.total_commission) / 100,
    })),
  };
  
  // TODO: Push to Zoho Books for archival
  console.log('Mock Zoho Report:', report);
  return report;
};
```

---

## Zoho Books Setup Requirements

### API Credentials Needed
1. **Organization ID:** From Zoho Books account
2. **Client ID & Secret:** Zoho Developer Console
3. **Access Token:** OAuth 2.0 flow
4. **Refresh Token:** For long-term access

### Environment Variables
```env
ZOHO_ORGANIZATION_ID=your_org_id
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
```

### Required Zoho Books Permissions
- Invoice: Create, Read
- Vendor Payments: Create, Read
- Estimates: Create (for contracts)
- Reports: Read
- Customers: Create, Read (for partners as customers)

---

## Mock Implementation Strategy

**For Development:** Use mock functions that log to console
**For Testing:** Create in-memory invoices/contracts
**For Production:** Replace with actual Zoho API calls

**Mock Wrapper Pattern:**
```typescript
const USE_MOCK = !process.env.ZOHO_ORGANIZATION_ID;

export const zohoBooks = {
  createInvoice: USE_MOCK ? mockCreateInvoice : realCreateInvoice,
  createContract: USE_MOCK ? mockCreateContract : realCreateContract,
  processPayout: USE_MOCK ? mockProcessPayout : realProcessPayout,
};
```

---

## Integration Timeline

**Week 1 (Now):** Mock implementation, test workflows  
**Week 2:** Get Zoho API credentials, test sandbox  
**Week 3:** Replace mocks with real API calls  
**Week 4:** Production testing, error handling

---

## Benefits vs. Building In-House

**Zoho Books:**
✅ Automated GST calculations  
✅ Compliance-ready invoices  
✅ Audit trails built-in  
✅ Partner self-service portal (Zoho feature)  
✅ Integration with Razorpay for payouts  
✅ ~80% less code to maintain

**Building In-House:**
❌ Complex GST/tax logic  
❌ Compliance risk  
❌ Invoice template management  
❌ Audit trail implementation  
❌ Significant dev time (4-6 weeks)

**Verdict:** Use Zoho Books for finance/invoicing, like Swiggy/Zomato do ✅

