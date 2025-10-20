# Zoho Integration Research & Implementation Plan

## Overview
Wyshkit will use Zoho extensively for finance, invoicing, contracts, and analytics to match enterprise-grade platforms like Swiggy/Zomato.

---

## 1. Zoho Books Integration (Finance & Invoicing)

### Purpose
- **Monthly Commission Invoicing**: Auto-generate invoices for platform commission (15-20%)
- **Payout Tracking**: Record all partner payouts with proper invoicing
- **Financial Reports**: Revenue, commission, partner earnings tracking
- **Expense Management**: Platform costs, refunds, sourcing expenses

### API Capabilities
- **Authentication**: OAuth 2.0 with Client ID/Secret
- **Invoice API**: Create, read, update invoices programmatically
- **Customer API**: Manage partner profiles as customers
- **Payment API**: Record payments and reconciliation
- **Reports API**: Generate financial reports

### Implementation Strategy

#### 1.1 Mock API Client (Development Phase)
```typescript
// src/lib/api/zoho-books-mock.ts
export const zohoBooksMock = {
  // Create invoice for monthly commission
  createCommissionInvoice: async (partnerId: string, month: string) => {
    // Mock: Calculate commission from orders
    const commission = await calculateMonthlyCommission(partnerId, month);
    
    return {
      invoice_id: `INV-${Date.now()}`,
      partner_id: partnerId,
      amount: commission.totalCommission, // in paise
      status: 'sent',
      invoice_url: `https://mock-zoho.com/invoice/${partnerId}`,
      created_at: new Date().toISOString()
    };
  },
  
  // Record payout
  recordPayout: async (partnerId: string, amount: number) => {
    return {
      payment_id: `PAY-${Date.now()}`,
      partner_id: partnerId,
      amount: amount,
      status: 'completed',
      transaction_date: new Date().toISOString()
    };
  },
  
  // Get financial report
  getFinancialReport: async (startDate: string, endDate: string) => {
    return {
      total_revenue: 5000000, // ₹50,000
      total_commission: 1000000, // ₹10,000
      total_payouts: 900000, // ₹9,000
      pending_payouts: 100000, // ₹1,000
      partner_count: 25
    };
  }
};
```

#### 1.2 Commission Calculation Flow
```
Order Completed → Calculate Commission → Generate Invoice → Send to Partner → Record in Zoho Books
```

**Monthly Cron Job:**
1. Run on 1st of every month
2. For each partner: sum previous month's orders
3. Calculate commission (15% for premium, 20% standard)
4. Generate Zoho Books invoice
5. Send invoice email to partner
6. Record in `payouts` table

#### 1.3 Database Schema
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id),
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  total_revenue BIGINT NOT NULL, -- in paise
  commission_percent DECIMAL(5,2) NOT NULL,
  commission_amount BIGINT NOT NULL, -- in paise
  zoho_invoice_id TEXT,
  zoho_invoice_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, month)
);
```

---

## 2. Zoho Sign Integration (Digital Contracts)

### Purpose
- **Partner Onboarding Contracts**: Partnership agreement with commission terms
- **NDA Agreements**: Confidentiality for proprietary platform data
- **Amendment Contracts**: Commission changes, badge upgrades

### API Capabilities
- **Authentication**: OAuth 2.0
- **Template API**: Create reusable contract templates
- **Document API**: Send documents for signing
- **Signer API**: Add signers, track signing status
- **Webhook API**: Get notifications when signed

### Implementation Strategy

#### 2.1 Mock API Client
```typescript
// src/lib/api/zoho-sign-mock.ts
export const zohoSignMock = {
  // Send partnership contract
  sendPartnershipContract: async (partnerId: string, partnerData: any) => {
    return {
      request_id: `REQ-${Date.now()}`,
      document_name: 'Wyshkit Partnership Agreement',
      signer_email: partnerData.email,
      status: 'sent',
      signing_url: `https://mock-zoho-sign.com/sign/${partnerId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  },
  
  // Check signing status
  getSigningStatus: async (requestId: string) => {
    return {
      request_id: requestId,
      status: 'signed', // sent, viewed, signed, declined
      signed_at: new Date().toISOString(),
      document_url: `https://mock-zoho-sign.com/document/${requestId}.pdf`
    };
  }
};
```

#### 2.2 Contract Templates

**Partnership Agreement Template:**
- Platform commission rate (15-20%)
- Payment terms (monthly NET 15)
- Quality standards
- Dispute resolution process
- Termination clauses
- Data protection (GDPR compliance)

**Integration in Onboarding:**
1. Partner completes KYC (IDfy verification)
2. Admin approves business legitimacy
3. Auto-generate contract with partner details
4. Send via Zoho Sign for digital signature
5. Upon signing: update `partner_profiles.contract_signed` = true
6. Store signed document URL in database

#### 2.3 Database Schema
```sql
ALTER TABLE partner_profiles
ADD COLUMN contract_signed BOOLEAN DEFAULT false,
ADD COLUMN contract_signed_at TIMESTAMPTZ,
ADD COLUMN contract_document_url TEXT,
ADD COLUMN zoho_request_id TEXT;
```

---

## 3. Zoho Analytics Integration (Dashboards & Reports)

### Purpose
- **Admin Dashboard**: GMV, active partners, commission trends
- **Partner Performance**: Sales, ratings, compliance metrics
- **Customer Analytics**: Popular occasions, avg order value, repeat rate

### API Capabilities
- **Data API**: Push data to Zoho Analytics
- **Report API**: Fetch pre-built reports
- **Embed API**: Embed dashboards in admin console

### Implementation Strategy

#### 3.1 Mock Dashboard Data
```typescript
// src/lib/api/zoho-analytics-mock.ts
export const zohoAnalyticsMock = {
  // Admin dashboard metrics
  getAdminMetrics: async () => {
    return {
      gmv: 50000000, // ₹5L gross merchandise value
      active_partners: 45,
      total_orders: 1250,
      avg_order_value: 249900, // ₹2,499
      commission_earned: 10000000, // ₹1L
      top_category: 'Corporate Gifts',
      growth_rate: 23.5 // % month-over-month
    };
  },
  
  // Partner performance
  getPartnerMetrics: async (partnerId: string) => {
    return {
      total_sales: 2500000, // ₹25,000
      order_count: 42,
      avg_rating: 4.7,
      response_time: '2.3 hours',
      return_rate: 1.2, // %
      compliance_score: 95
    };
  }
};
```

#### 3.2 Integration Points
- Push daily order data to Zoho Analytics
- Fetch reports for admin console
- Embed partner performance dashboards
- Real-time metric updates via webhooks

---

## 4. IDfy KYC Integration (Automated Verification)

### Purpose
- **Automated Document Verification**: PAN, GST, bank account, FSSAI
- **Reduce Manual Review**: Auto-approve verified partners
- **Compliance**: Regulatory requirements for marketplace platforms

### API Capabilities
- **PAN Verification**: ₹5-10 per check, instant verification
- **GST Verification**: ₹10-15 per check, validate business registration
- **Bank Account Verification**: ₹5-10 per check, verify account details
- **FSSAI Verification**: ₹10-15 per check (food vendors only)

### Implementation Strategy

#### 4.1 Mock API Client
```typescript
// src/lib/api/idfy-mock.ts
export const idfyMock = {
  // Verify PAN
  verifyPAN: async (panNumber: string, name: string) => {
    return {
      verification_id: `VER-PAN-${Date.now()}`,
      pan_number: panNumber,
      status: 'verified', // verified, failed, pending
      name_match: true,
      details: {
        name: name,
        registered_name: name,
        dob: '1990-01-01'
      },
      cost: 10 // ₹10
    };
  },
  
  // Verify GST
  verifyGST: async (gstNumber: string) => {
    return {
      verification_id: `VER-GST-${Date.now()}`,
      gst_number: gstNumber,
      status: 'active',
      business_name: 'Test Business Pvt Ltd',
      registration_date: '2020-04-01',
      state: 'Karnataka',
      cost: 15 // ₹15
    };
  },
  
  // Verify Bank Account
  verifyBankAccount: async (accountNumber: string, ifsc: string, name: string) => {
    return {
      verification_id: `VER-BANK-${Date.now()}`,
      account_number: accountNumber,
      ifsc: ifsc,
      status: 'verified',
      name_match: true,
      account_holder_name: name,
      bank_name: 'HDFC Bank',
      cost: 10 // ₹10
    };
  },
  
  // Verify FSSAI (for food vendors)
  verifyFSSAI: async (fssaiNumber: string) => {
    return {
      verification_id: `VER-FSSAI-${Date.now()}`,
      fssai_number: fssaiNumber,
      status: 'active',
      license_type: 'Central',
      valid_until: '2026-12-31',
      business_name: 'Test Food Products',
      cost: 15 // ₹15
    };
  }
};
```

#### 4.2 Verification Workflow
```
Partner Uploads Documents → IDfy API Verification → Auto-Approve if Verified → Admin Review (Optional) → Contract Signing via Zoho Sign → Activate Account
```

#### 4.3 Integration in Onboarding
**In `Onboarding.tsx`:**
1. Partner uploads PAN document
2. Auto-extract PAN number (OCR or manual input)
3. Call `idfyMock.verifyPAN(pan, name)`
4. Show real-time verification status
5. Repeat for GST, bank account
6. If category = "Food & Beverages", verify FSSAI
7. Update `partner_profiles` with verification status

#### 4.4 Database Schema
```sql
ALTER TABLE partner_profiles
ADD COLUMN pan_verification_id TEXT,
ADD COLUMN gst_verification_id TEXT,
ADD COLUMN bank_verification_id TEXT,
ADD COLUMN fssai_verification_id TEXT,
ADD COLUMN idfy_total_cost INTEGER DEFAULT 0, -- in rupees
ADD COLUMN auto_verified BOOLEAN DEFAULT false;
```

---

## 5. Implementation Roadmap

### Phase 1: Mock APIs (Week 1)
- ✅ Create mock Zoho Books client
- ✅ Create mock Zoho Sign client
- ✅ Create mock Zoho Analytics client
- ✅ Create mock IDfy client
- ✅ Document all APIs in this file

### Phase 2: Database Migrations (Week 1)
- [ ] Create `payouts` table
- [ ] Add contract fields to `partner_profiles`
- [ ] Add IDfy verification fields to `partner_profiles`
- [ ] Run migrations in Supabase

### Phase 3: UI Integration (Week 2)
- [ ] Add Zoho invoice display in Earnings page
- [ ] Add contract signing step in Onboarding
- [ ] Add IDfy verification status in Onboarding
- [ ] Add admin dashboard with Zoho Analytics

### Phase 4: Cron Jobs (Week 2)
- [ ] Create monthly commission invoice cron
- [ ] Create daily badge check cron
- [ ] Create sourcing limit reset cron
- [ ] Deploy to Supabase Edge Functions

### Phase 5: Production APIs (Week 3+)
- [ ] Replace mocks with real Zoho Books API
- [ ] Replace mocks with real Zoho Sign API
- [ ] Replace mocks with real IDfy API
- [ ] Add OAuth 2.0 authentication
- [ ] Add webhook handlers

---

## 6. Cost Estimation

### IDfy Costs (Per Partner Onboarding)
- PAN Verification: ₹10
- GST Verification: ₹15
- Bank Account Verification: ₹10
- FSSAI Verification (if applicable): ₹15
**Total per partner**: ₹35-50

### Zoho Costs
- **Zoho Books**: $10-29/month (up to 50 partners as customers)
- **Zoho Sign**: $10-20/month (unlimited signatures on basic plan)
- **Zoho Analytics**: $24-48/month (based on data volume)
**Total monthly**: $44-97 (~₹3,500-8,000)

### ROI Analysis
With 50 active partners generating ₹5L GMV at 15-20% commission:
- **Monthly Commission**: ₹75,000 - ₹1,00,000
- **Automation Cost**: ₹8,000 (Zoho)
- **Net Benefit**: Saves 20+ hours/month of manual invoicing & contract management

---

## 7. Production Readiness Checklist

### Zoho Books
- [ ] Create Zoho Developer account
- [ ] Register application and get Client ID/Secret
- [ ] Set up OAuth 2.0 flow
- [ ] Create invoice templates
- [ ] Test invoice generation with sandbox
- [ ] Configure webhook for payment notifications

### Zoho Sign
- [ ] Create Zoho Sign account
- [ ] Upload contract templates
- [ ] Test document sending
- [ ] Configure webhook for signing events
- [ ] Add signed document storage (S3/Cloudinary)

### IDfy
- [ ] Create IDfy account
- [ ] Get API keys for production
- [ ] Test all verification types
- [ ] Add error handling for failed verifications
- [ ] Configure webhook for verification results

---

## 8. Best Practices (Swiggy/Zomato Patterns)

### From Research:
1. **Automated Invoicing**: Like Swiggy, auto-generate partner invoices monthly
2. **Digital Contracts**: Like Zomato, use e-signatures for onboarding
3. **KYC Automation**: Use IDfy to reduce manual verification (10x faster)
4. **Admin Dashboards**: Embed Zoho Analytics for real-time insights
5. **Audit Trails**: Log all Zoho/IDfy API calls for compliance

### Implementation Notes:
- Use mock APIs during development to avoid costs
- Switch to production APIs only after thorough testing
- Keep all API keys in environment variables (never commit)
- Add retry logic for API failures
- Cache Zoho Analytics data (refresh every 15 minutes)

---

## Next Steps

1. ✅ Create mock API clients (this document)
2. [ ] Build mock API services in `src/lib/api/`
3. [ ] Create database migrations
4. [ ] Integrate into Onboarding workflow
5. [ ] Build Earnings page with invoice display
6. [ ] Build Admin Console with analytics
7. [ ] Deploy cron jobs for automation
8. [ ] Test end-to-end workflows
9. [ ] Document in user guides
10. [ ] Switch to production APIs

**This comprehensive Zoho + IDfy integration will make Wyshkit enterprise-grade, matching Swiggy/Zomato's automation standards!** 🚀

