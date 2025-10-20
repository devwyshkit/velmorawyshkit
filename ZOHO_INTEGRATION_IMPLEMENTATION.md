# Zoho Integration Implementation Plan

**Project:** Wyshkit - Multi-Vendor Gifting Platform  
**Last Updated:** October 20, 2025  
**Status:** Research Complete, Ready for Implementation

---

## Executive Summary

Wyshkit will integrate Zoho ecosystem for **finance automation**, **legal compliance**, and **support operations** - matching Swiggy/Zomato's enterprise-grade backend systems while avoiding custom rebuilds of solved problems.

**Cost-Benefit Analysis:**
- **Development Savings:** ₹15L+ (3 weeks dev time @ ₹5L/week)
- **Zoho Cost:** ₹30K/year (Books + Sign + Analytics)
- **ROI:** 50x in first year
- **Audit Compliance:** Built-in GST/audit trails (crucial for 100+ partners)

---

## 1. Zoho Books - Monthly Commission Invoicing

### Use Case
Automated GST-compliant invoices for partner commission, matching Swiggy's monthly partner statements.

### Integration Points

#### 1.1 OAuth 2.0 Setup
```typescript
// src/lib/integrations/zoho-auth.ts
export const ZOHO_CONFIG = {
  client_id: process.env.ZOHO_CLIENT_ID,
  client_secret: process.env.ZOHO_CLIENT_SECRET,
  redirect_uri: 'https://wyshkit.com/api/zoho/callback',
  scope: 'ZohoBooks.fullaccess.all',
  authorization_url: 'https://accounts.zoho.in/oauth/v2/auth',
  token_url: 'https://accounts.zoho.in/oauth/v2/token',
};

// Get access token (refresh every 60 minutes)
export async function getZohoAccessToken(): Promise<string> {
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  
  const response = await fetch(ZOHO_CONFIG.token_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken!,
      client_id: ZOHO_CONFIG.client_id!,
      client_secret: ZOHO_CONFIG.client_secret!,
      grant_type: 'refresh_token',
    }),
  });
  
  const data = await response.json();
  return data.access_token;
}
```

#### 1.2 Create Commission Invoice
```typescript
// src/lib/integrations/zoho-books.ts
import { getZohoAccessToken } from './zoho-auth';

const ZOHO_ORGANIZATION_ID = process.env.ZOHO_ORGANIZATION_ID;
const ZOHO_API_BASE = 'https://www.zohoapis.in/books/v3';

export async function createCommissionInvoice({
  partnerId,
  partnerName,
  partnerEmail,
  partnerGST,
  month,
  gmv,
  commissionPercent,
  commissionAmount,
  gst,
  totalAmount,
  transactions,
}: CommissionInvoiceData): Promise<string> {
  const accessToken = await getZohoAccessToken();
  
  // Create invoice payload (Zoho Books API format)
  const invoice = {
    customer_name: partnerName,
    customer_id: await getOrCreateCustomer(partnerId, partnerName, partnerEmail, partnerGST),
    invoice_number: `WYK-${partnerId.slice(0, 6).toUpperCase()}-${month.replace('-', '')}`, // e.g., WYK-ABC123-202510
    date: new Date().toISOString().split('T')[0],
    payment_terms: 7, // 7 days
    payment_terms_label: 'Net 7',
    salesperson_name: 'Wyshkit Platform',
    line_items: [
      {
        name: `Commission for ${month}`,
        description: `Platform commission (${commissionPercent}% of ₹${gmv.toLocaleString('en-IN')} GMV)`,
        rate: commissionAmount,
        quantity: 1,
        tax_id: await getGSTTaxId(18), // 18% GST
      },
    ],
    notes: `Commission breakdown:\n${transactions.map(t => `- Order #${t.orderId}: ₹${t.commission}`).join('\n')}`,
    terms: 'Payment via UPI/NEFT to Wyshkit account within 7 days. Auto-deducted from next payout if unpaid.',
    custom_fields: [
      { label: 'Partner ID', value: partnerId },
      { label: 'GMV', value: gmv.toString() },
      { label: 'Commission %', value: commissionPercent.toString() },
    ],
  };
  
  const response = await fetch(`${ZOHO_API_BASE}/invoices?organization_id=${ZOHO_ORGANIZATION_ID}`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoice),
  });
  
  const data = await response.json();
  
  if (data.code !== 0) {
    throw new Error(`Zoho Books API error: ${data.message}`);
  }
  
  return data.invoice.invoice_id; // Return Zoho invoice ID
}

// Helper: Get or create customer in Zoho Books
async function getOrCreateCustomer(partnerId: string, name: string, email: string, gstin: string): Promise<string> {
  const accessToken = await getZohoAccessToken();
  
  // Search for existing customer
  const searchResponse = await fetch(
    `${ZOHO_API_BASE}/contacts?organization_id=${ZOHO_ORGANIZATION_ID}&email=${email}`,
    {
      headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
    }
  );
  
  const searchData = await searchResponse.json();
  
  if (searchData.contacts && searchData.contacts.length > 0) {
    return searchData.contacts[0].contact_id;
  }
  
  // Create new customer
  const createResponse = await fetch(
    `${ZOHO_API_BASE}/contacts?organization_id=${ZOHO_ORGANIZATION_ID}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact_name: name,
        contact_type: 'vendor', // Partner is a vendor to Wyshkit
        email,
        gst_no: gstin,
        custom_fields: [{ label: 'Partner ID', value: partnerId }],
      }),
    }
  );
  
  const createData = await createResponse.json();
  return createData.contact.contact_id;
}

// Helper: Get GST tax ID (18% standard)
async function getGSTTaxId(rate: number): Promise<string> {
  const accessToken = await getZohoAccessToken();
  
  const response = await fetch(
    `${ZOHO_API_BASE}/settings/taxes?organization_id=${ZOHO_ORGANIZATION_ID}`,
    {
      headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` },
    }
  );
  
  const data = await response.json();
  const gst18 = data.taxes.find((tax: any) => tax.tax_name === 'GST [18%]');
  
  return gst18.tax_id;
}
```

#### 1.3 Monthly Cron Job
```typescript
// supabase/functions/monthly-commission-invoice/index.ts
import { createCommissionInvoice } from '@/lib/integrations/zoho-books';
import { supabase } from '@/lib/integrations/supabase-client';

export default async function handler() {
  const today = new Date();
  if (today.getDate() !== 1) return; // Run only on 1st of month
  
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7); // YYYY-MM
  
  // Get all partners with orders last month
  const { data: partners } = await supabase
    .from('partner_profiles')
    .select('id, business_name, email, gstin, commission_percent');
  
  for (const partner of partners) {
    // Calculate GMV and commission
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, created_at')
      .eq('partner_id', partner.id)
      .gte('created_at', `${lastMonth}-01`)
      .lt('created_at', `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`)
      .eq('status', 'completed');
    
    if (!orders || orders.length === 0) continue; // No orders, skip
    
    const gmv = orders.reduce((sum, o) => sum + o.total, 0);
    const commissionAmount = gmv * (partner.commission_percent / 100);
    const gst = commissionAmount * 0.18;
    const totalAmount = commissionAmount + gst;
    
    try {
      // Create Zoho invoice
      const invoiceId = await createCommissionInvoice({
        partnerId: partner.id,
        partnerName: partner.business_name,
        partnerEmail: partner.email,
        partnerGST: partner.gstin,
        month: lastMonth,
        gmv: gmv / 100, // Convert paise to rupees
        commissionPercent: partner.commission_percent,
        commissionAmount: commissionAmount / 100,
        gst: gst / 100,
        totalAmount: totalAmount / 100,
        transactions: orders.map(o => ({
          orderId: o.id,
          commission: (o.total * partner.commission_percent / 100) / 100,
        })),
      });
      
      // Save invoice ID to partner_commissions table
      await supabase.from('partner_commissions').insert({
        partner_id: partner.id,
        month: lastMonth,
        gmv: gmv,
        commission_amount: commissionAmount,
        gst_amount: gst,
        total_amount: totalAmount,
        zoho_invoice_id: invoiceId,
        status: 'pending',
      });
      
      console.log(`Invoice created for ${partner.business_name}: ${invoiceId}`);
    } catch (error) {
      console.error(`Failed to create invoice for ${partner.business_name}:`, error);
    }
  }
}
```

---

## 2. Zoho Sign - Partner Contracts

### Use Case
Digital signature for partner onboarding agreements (commission terms, compliance, liability), matching Swiggy's automated contract signing.

### Integration Points

#### 2.1 Contract Template Setup
**Create in Zoho Sign Dashboard:**
- Template Name: "Wyshkit Partner Agreement"
- Fields:
  - `{{Partner_Name}}` (auto-filled)
  - `{{Business_GSTIN}}` (auto-filled)
  - `{{Commission_Percentage}}` (15% or 20%, auto-filled)
  - `{{Signature_Date}}` (auto-filled)
  - `{{Partner_Signature}}` (e-signature field)
  - `{{Wyshkit_Signature}}` (pre-signed by CEO)

#### 2.2 Send Contract After KYC
```typescript
// src/lib/integrations/zoho-sign.ts
const ZOHO_SIGN_API_BASE = 'https://sign.zoho.in/api/v1';

export async function sendPartnerContract({
  partnerId,
  partnerName,
  partnerEmail,
  gstin,
  commissionPercent,
}: {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  gstin: string;
  commissionPercent: number;
}): Promise<string> {
  const accessToken = await getZohoAccessToken();
  
  const payload = {
    templates: {
      template_id: process.env.ZOHO_SIGN_TEMPLATE_ID, // From Zoho Sign dashboard
      field_data: {
        field_text_data: {
          Partner_Name: partnerName,
          Business_GSTIN: gstin,
          Commission_Percentage: `${commissionPercent}%`,
          Signature_Date: new Date().toLocaleDateString('en-IN'),
        },
      },
      actions: [
        {
          action_type: 'SIGN',
          recipient_name: partnerName,
          recipient_email: partnerEmail,
          signing_order: 1,
          verify_recipient: true, // OTP verification
        },
      ],
    },
  };
  
  const response = await fetch(`${ZOHO_SIGN_API_BASE}/requests`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  
  // Return request ID (track in partner_profiles.contract_zoho_id)
  return data.requests.request_id;
}
```

#### 2.3 Integration in Onboarding
```typescript
// src/pages/partner/Onboarding.tsx (Step 3: KYC Verification)
const handleKYCApproval = async () => {
  // After IDfy KYC succeeds...
  
  try {
    // Send contract via Zoho Sign
    const contractRequestId = await sendPartnerContract({
      partnerId: user.id,
      partnerName: formData.businessName,
      partnerEmail: user.email,
      gstin: formData.gstin,
      commissionPercent: 20, // Default tier
    });
    
    // Save contract ID
    await supabase
      .from('partner_profiles')
      .update({ 
        contract_zoho_id: contractRequestId,
        onboarding_status: 'contract_pending',
      })
      .eq('id', user.id);
    
    toast({
      title: "Contract sent!",
      description: "Check your email to sign the partner agreement",
    });
  } catch (error) {
    console.error('Contract send failed:', error);
  }
};
```

#### 2.4 Webhook for Signature Completion
```typescript
// supabase/functions/zoho-sign-webhook/index.ts
export default async function handler(req: Request) {
  const { request_id, request_status, recipient_email } = await req.json();
  
  if (request_status === 'completed') {
    // Update partner status
    const { data: partner } = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('contract_zoho_id', request_id)
      .single();
    
    if (partner) {
      await supabase
        .from('partner_profiles')
        .update({ 
          onboarding_status: 'approved',
          contract_signed_at: new Date().toISOString(),
        })
        .eq('id', partner.id);
      
      // Send welcome email
      await sendEmail({
        to: recipient_email,
        subject: 'Welcome to Wyshkit!',
        body: 'Your partner account is now active. Start adding products!',
      });
    }
  }
  
  return new Response('OK', { status: 200 });
}
```

---

## 3. Zoho Analytics - Admin Dashboards

### Use Case
Pre-built analytics dashboards for admin console (GMV, partner performance, order trends), saving 2 weeks of custom dashboard development.

### Integration Points

#### 3.1 Database Connection (JDBC)
**Setup in Zoho Analytics:**
1. Create Workspace: "Wyshkit Analytics"
2. Add Data Source: PostgreSQL (Supabase)
   - Host: `db.usiwuxudinfxttvrcczb.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: (from Supabase Settings → Database)
3. Import Tables:
   - `partner_profiles`
   - `partner_products`
   - `orders`
   - `partner_commissions`
   - `campaigns`
   - `reviews`
4. Sync Schedule: Every 1 hour (auto-refresh)

#### 3.2 Dashboard Templates

**Dashboard 1: Executive Overview**
- Total GMV (last 30 days, % change)
- Active Partners (count, growth trend)
- Total Orders (count, avg order value)
- Top 10 Partners by Revenue (bar chart)
- Order Status Breakdown (pie chart: completed, pending, disputed)

**Dashboard 2: Partner Performance**
- Partner List (DataTable):
  - Name, Category, Orders, GMV, Commission Paid, Status
  - Filters: By category, commission tier, onboarding date
- Revenue per Partner (line chart, last 90 days)
- Top Products (bar chart, by orders)
- Partner Growth (new signups per month)

**Dashboard 3: Financial Reports**
- Monthly Commission Summary:
  - GMV, Commission Amount, GST, Total Payable
  - By partner (drilldown)
- Payout Status (pending, completed, failed)
- Dispute Impact (refunds, chargebacks)

#### 3.3 Embed in Admin Console
```typescript
// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';

export const AdminDashboard = () => {
  const [embedUrl, setEmbedUrl] = useState('');
  
  useEffect(() => {
    // Generate embed URL (Zoho Analytics Embed API)
    const generateEmbedUrl = async () => {
      const response = await fetch('/api/zoho/analytics/embed-url', {
        method: 'POST',
        body: JSON.stringify({
          dashboard_id: process.env.ZOHO_ANALYTICS_DASHBOARD_ID,
          filters: { /* optional filters */ },
        }),
      });
      
      const { url } = await response.json();
      setEmbedUrl(url);
    };
    
    generateEmbedUrl();
  }, []);
  
  return (
    <div className="h-screen">
      <h1>Admin Dashboard</h1>
      {embedUrl && (
        <iframe
          src={embedUrl}
          width="100%"
          height="800px"
          frameBorder="0"
          allow="clipboard-write"
        />
      )}
    </div>
  );
};
```

---

## 4. Zoho Desk - Support System (Optional Phase 2)

### Use Case
Replace custom Help Center with enterprise ticketing system at >100 partners.

### Decision: Phase 2 Only
- **Launch with custom Help Center** (already 95% built)
- **Migrate to Zoho Desk** when partner count >100 (projected Month 6)
- **Cost:** $14/agent/month (vs. free custom Help Center)
- **Benefits:** Multi-channel support (email, chat, WhatsApp), SLA tracking, AI auto-responses

### Migration Trigger
```typescript
// Check partner count monthly
const { count } = await supabase
  .from('partner_profiles')
  .select('id', { count: 'exact' })
  .eq('onboarding_status', 'approved');

if (count >= 100) {
  // Trigger Zoho Desk migration plan
  console.log('Reached 100 partners - time to migrate to Zoho Desk');
}
```

---

## 5. Implementation Timeline

### Week 1 (40 hours)
- **Day 1-2 (16h):** Zoho OAuth setup, test API access, create organization
- **Day 3-4 (16h):** Implement Zoho Books invoice creation, test with sandbox
- **Day 5 (8h):** Implement monthly cron job, test with 2 partners

### Week 2 (24 hours)
- **Day 1-2 (16h):** Create contract template in Zoho Sign, test signature flow
- **Day 3 (8h):** Integrate contract sending in onboarding Step 3

### Week 3 (16 hours)
- **Day 1-2 (16h):** Connect Supabase to Zoho Analytics, create 3 dashboards

**Total: 80 hours (2.5 weeks)**

---

## 6. Environment Variables

Add to `.env`:
```env
# Zoho OAuth
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Zoho Books
ZOHO_ORGANIZATION_ID=123456789

# Zoho Sign
ZOHO_SIGN_TEMPLATE_ID=987654321
ZOHO_SIGN_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx

# Zoho Analytics
ZOHO_ANALYTICS_WORKSPACE_ID=111111111
ZOHO_ANALYTICS_DASHBOARD_ID=222222222
```

---

## 7. Database Schema Updates

```sql
-- Add Zoho tracking fields
ALTER TABLE partner_profiles
ADD COLUMN contract_zoho_id TEXT,
ADD COLUMN contract_signed_at TIMESTAMPTZ,
ADD COLUMN zoho_customer_id TEXT;

-- Commission tracking
CREATE TABLE partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id),
  month TEXT NOT NULL, -- YYYY-MM
  gmv BIGINT NOT NULL, -- Gross merchandise value (paise)
  commission_amount BIGINT NOT NULL,
  gst_amount BIGINT NOT NULL,
  total_amount BIGINT NOT NULL,
  zoho_invoice_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, overdue
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Success Metrics

### Month 1 Post-Launch
- ✅ 100% of new partners receive auto-generated contracts
- ✅ 100% of monthly commissions invoiced via Zoho Books
- ✅ Admin dashboard loads in <2s (Zoho Analytics embed)
- ✅ Zero manual invoice creation (100% automated)

### Month 3
- ✅ 95%+ contract signature rate (partners complete onboarding)
- ✅ Average invoice payment time: <7 days (vs. 15 days manual)
- ✅ Admin team uses Zoho Analytics daily (vs. manual SQL queries)

### Month 6
- ✅ 100+ partners onboarded with zero finance team scaling
- ✅ Evaluate Zoho Desk migration based on support ticket volume

---

## 9. Comparison with Swiggy/Zomato

| Feature | Swiggy/Zomato | Wyshkit (with Zoho) | Status |
|---------|---------------|---------------------|--------|
| **Monthly Invoicing** | Automated via custom system | Automated via Zoho Books | ✅ Matched |
| **Contract Signing** | DocuSign/custom e-sign | Zoho Sign | ✅ Matched |
| **Admin Dashboards** | Custom Metabase/Tableau | Zoho Analytics | ✅ Matched |
| **Support Ticketing** | Custom + Zendesk (>1000 partners) | Custom (Phase 1), Zoho Desk (Phase 2) | ✅ Planned |
| **Cost to Build** | ₹50L+ custom dev | ₹30K/year SaaS | ✅ 166x cheaper |
| **Compliance** | GST audit-ready | GST audit-ready (Zoho certified) | ✅ Matched |

---

## 10. Next Steps

1. **Immediate:** Set up Zoho developer account, get OAuth credentials
2. **Week 1:** Implement Zoho Books invoicing (highest ROI)
3. **Week 2:** Add Zoho Sign contracts to onboarding
4. **Week 3:** Connect Zoho Analytics for admin console
5. **Post-Launch:** Monitor usage, optimize cron jobs, plan Zoho Desk migration

---

**ZOHO INTEGRATION: PRODUCTION-READY PLAN** 🚀

Replace manual finance/legal workflows with Swiggy-grade automation at 1/166th the cost!

