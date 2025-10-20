# 🔧 ZOHO COMPLETE INTEGRATION PLAN - WYSHKIT

**Date:** October 20, 2025  
**Purpose:** Leverage Zoho's comprehensive platform for finance, support, and analytics (matching Swiggy/Zomato backend patterns)

---

## 🎯 WHY ZOHO? (vs. Building Custom)

**Your Insight:** "Why reinvent when Zoho has everything Swiggy/Zomato use?"

### Zoho Benefits:
1. **Zoho Books** → Invoicing, commission contracts, GST compliance (Indian tax)
2. **Zoho Desk** → Support tickets, live chat, knowledge base
3. **Zoho Analytics** → Admin dashboards, partner performance, GMV reports
4. **Zoho Sign** → Digital contracts for partner onboarding
5. **Zoho CRM** → Partner relationship management (optional)

### vs. Custom Implementation:
| Feature | Custom | Zoho | Winner |
|---------|--------|------|--------|
| Invoicing | Build from scratch (2 weeks) | Zoho Books API (2 days) | ✅ Zoho |
| GST Compliance | Manual tax logic (1 week) | Built-in (0 days) | ✅ Zoho |
| Support Tickets | Custom tables (1 week) | Zoho Desk (2 days) | ✅ Zoho |
| Analytics | Build charts (2 weeks) | Zoho Analytics (3 days) | ✅ Zoho |
| Contracts | PDF generation (1 week) | Zoho Sign (1 day) | ✅ Zoho |
| **Total Time** | **7 weeks** | **1.5 weeks** | **✅ Zoho (5x faster)** |

**Decision:** Use Zoho for finance, support, contracts. Keep custom for product/order management (core business logic).

---

## 📦 ZOHO BOOKS - INVOICING & COMMISSION

### Use Cases in Wyshkit:

#### 1. Monthly Commission Invoices
**What:** Auto-generate invoices for partners each month (15% or 20% commission on GMV)

**Zoho Books API:**
```typescript
// Create invoice for partner
POST https://books.zoho.in/api/v3/invoices

{
  "customer_id": "partner_zoho_id", // Created during onboarding
  "invoice_number": "WYS-OCT2025-BOAT",
  "date": "2025-10-31",
  "due_date": "2025-11-07", // 7 days payment terms
  "line_items": [
    {
      "item_id": "commission_service",
      "name": "Commission - October 2025",
      "description": "15% commission on GMV ₹5,00,000",
      "rate": 75000,
      "quantity": 1,
      "tax_id": "gst_18" // 18% GST
    }
  ],
  "notes": "Payment via NEFT/RTGS to registered bank account",
  "terms": "Net 7 days. Late payment: 2% penalty"
}
```

**When to Run:** 1st of every month (cron job)  
**Workflow:**
1. Fetch partner GMV from Supabase: `SELECT SUM(total) FROM orders WHERE partner_id = X AND status = 'completed' AND created_at BETWEEN '2025-10-01' AND '2025-10-31'`
2. Calculate commission: `gmv * partner.commission_percent`
3. Create Zoho invoice
4. Email invoice to partner
5. Mark in Supabase: `partner_invoices` table with Zoho invoice ID

**Benefits:**
- ✅ GST auto-calculated (18% on services)
- ✅ Indian tax compliance (GSTIN validation)
- ✅ Professional invoice PDF (Zoho template)
- ✅ Payment reminders (automated)
- ✅ Export for accountants (CSV, Excel)

#### 2. Partner Onboarding Contracts
**What:** Digital contracts defining commission tiers, payment terms, liability

**Zoho Sign API (integrated with Books):**
```typescript
POST https://sign.zoho.in/api/v1/requests

{
  "templates": {
    "template_id": "partner_agreement_template"
  },
  "actions": [
    {
      "recipient_email": "boat@example.com",
      "recipient_name": "Boat Lifestyle",
      "action_type": "SIGN",
      "signing_order": 1,
      "fields": {
        "partner_name": "Boat Lifestyle Pvt Ltd",
        "commission_percent": "15%",
        "payment_terms": "Net 7 days",
        "contract_start": "2025-10-20",
        "contract_end": "2026-10-20"
      }
    },
    {
      "recipient_email": "legal@wyshkit.com",
      "recipient_name": "Wyshkit Legal",
      "action_type": "SIGN",
      "signing_order": 2
    }
  ]
}
```

**When to Run:** After KYC approval (onboarding Step 3)  
**Workflow:**
1. Admin approves partner KYC
2. Trigger Zoho Sign contract
3. Partner receives email with DocuSign-like flow
4. Both parties sign
5. Signed PDF stored in Zoho Books (attached to partner contact)
6. Update Supabase: `partner_profiles.contract_signed = true`, `contract_zoho_id = X`

**Benefits:**
- ✅ Legally binding digital signatures
- ✅ Audit trail (who signed when)
- ✅ Template system (update once, apply to all)
- ✅ Automatic reminders (if unsigned after 3 days)

#### 3. Payout Processing
**What:** Track payouts to partners (reconcile with invoices)

**Zoho Books:**
```typescript
// Record payment against invoice
POST https://books.zoho.in/api/v3/customerpayments

{
  "customer_id": "partner_zoho_id",
  "payment_mode": "NEFT",
  "amount": 75000,
  "date": "2025-11-07",
  "reference_number": "TXN-BOAT-NOV07",
  "invoices": [
    {
      "invoice_id": "WYS-OCT2025-BOAT",
      "amount_applied": 75000
    }
  ]
}
```

**When to Run:** After manual bank transfer (admin action)  
**Workflow:**
1. Admin processes bank transfer (NEFT/RTGS)
2. Admin clicks "Mark as Paid" in Wyshkit admin console
3. API call to Zoho Books to record payment
4. Invoice status changes to "Paid"
5. Partner receives payment confirmation email

**Benefits:**
- ✅ Reconciliation (invoices vs. actual payments)
- ✅ Aging reports (overdue invoices)
- ✅ Banker's checklist (who to pay next)

---

## 🎧 ZOHO DESK - SUPPORT & TICKETING

### Replace Custom Help Center Tables

**Currently:** 
- `help_articles` table (custom)
- `support_tickets` table (custom)
- `ticket_messages` table (custom)

**Zoho Desk Alternative:**
- Knowledge Base (articles, FAQs)
- Ticketing (partner support requests)
- Live Chat (WebWidget)
- SLA management (24h response time)

**Decision:** Keep custom for now, migrate to Zoho Desk in Phase 2  
**Why:** 
- Current custom implementation already built (90% complete)
- Zoho Desk requires account ($14/agent/month)
- Phase 1: Launch with custom
- Phase 2: Migrate to Zoho Desk when >100 partners (support volume justifies cost)

**When to Migrate:**
- If support tickets >50/day
- If need multi-agent workflows
- If need phone support integration

---

## 📊 ZOHO ANALYTICS - ADMIN DASHBOARDS

### Use Case: Partner Performance Dashboard

**What:** Admin console analytics (GMV, commissions, top partners, category trends)

**Zoho Analytics Integration:**
1. Connect Supabase to Zoho Analytics (JDBC connector)
2. Create dashboard templates:
   - **GMV Overview**: Total, monthly trends, YoY growth
   - **Partner Performance**: Top 10 by revenue, avg order value
   - **Commission Breakdown**: 15% tier vs. 20% tier partners
   - **Category Analysis**: Which gift categories sell most
   - **Geographic Trends**: Delhi vs. Mumbai vs. Bangalore

**Zoho Analytics API:**
```typescript
// Fetch pre-built report
GET https://analyticsapi.zoho.in/api/{org_id}/workspaces/{workspace_id}/views/{view_id}/data

// Returns JSON data for chart rendering
{
  "data": {
    "columns": ["partner_name", "revenue", "commission"],
    "rows": [
      ["Boat Lifestyle", 500000, 75000],
      ["ChocoCraft", 300000, 60000],
      ["GiftZone", 200000, 40000]
    ]
  }
}
```

**Benefits:**
- ✅ No need to build custom charts (Recharts, ChartJS)
- ✅ Pre-built templates (revenue, sales, inventory)
- ✅ Scheduled email reports (send to stakeholders)
- ✅ Drill-down capabilities (click partner → see orders)

**Decision:** Use Zoho Analytics for admin dashboards  
**Implementation Time:** 1 week (vs. 3 weeks custom)

---

## 🔗 INTEGRATION ARCHITECTURE

### Phase 1: Core Integrations (Week 1-2)

```
┌─────────────────────────────────────────────────────────┐
│                     WYSHKIT FRONTEND                   │
│  (React + Vite + Supabase Client)                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (Database + Auth)                 │
│  - partner_profiles                                     │
│  - orders                                               │
│  - products                                             │
│  - campaigns, reviews, disputes, returns                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│       SUPABASE EDGE FUNCTIONS (Serverless API)          │
│  - monthly-commission-invoice.ts                        │
│  - onboarding-contract-send.ts                          │
│  - payout-record.ts                                     │
│  - analytics-sync.ts                                    │
└─────────────────────────────────────────────────────────┘
          │           │            │            │
          ▼           ▼            ▼            ▼
    ┌─────────┐  ┌────────┐  ┌─────────┐  ┌──────────┐
    │ Zoho    │  │ Zoho   │  │ Zoho    │  │ Zoho     │
    │ Books   │  │ Sign   │  │ Desk    │  │Analytics │
    │ API     │  │ API    │  │ (Phase  │  │ API      │
    │         │  │        │  │  2)     │  │          │
    └─────────┘  └────────┘  └─────────┘  └──────────┘
```

### API Client Pattern

**File:** `src/lib/integrations/zoho-books.ts`

```typescript
import { supabase } from '@/lib/supabase';

const ZOHO_BOOKS_API = 'https://books.zoho.in/api/v3';
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID;

// Get access token (OAuth 2.0 refresh token flow)
async function getZohoAccessToken(): Promise<string> {
  const { data } = await supabase
    .from('zoho_tokens')
    .select('access_token, expires_at')
    .single();

  if (data && new Date(data.expires_at) > new Date()) {
    return data.access_token;
  }

  // Refresh token if expired
  const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      grant_type: 'refresh_token'
    })
  });

  const { access_token, expires_in } = await response.json();

  // Store new token
  await supabase
    .from('zoho_tokens')
    .upsert({
      access_token,
      expires_at: new Date(Date.now() + expires_in * 1000).toISOString()
    });

  return access_token;
}

// Create invoice
export async function createCommissionInvoice(partnerId: string, gmv: number, commissionPercent: number) {
  const token = await getZohoAccessToken();

  // Get partner's Zoho customer ID
  const { data: partner } = await supabase
    .from('partner_profiles')
    .select('zoho_customer_id, business_name')
    .eq('id', partnerId)
    .single();

  if (!partner.zoho_customer_id) {
    throw new Error('Partner not linked to Zoho Books. Run onboarding sync first.');
  }

  const invoiceData = {
    customer_id: partner.zoho_customer_id,
    invoice_number: `WYS-${new Date().toISOString().slice(0, 7)}-${partnerId.slice(0, 8).toUpperCase()}`,
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    line_items: [
      {
        name: `Commission - ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`,
        description: `${commissionPercent}% commission on GMV ₹${gmv.toLocaleString('en-IN')}`,
        rate: gmv * commissionPercent / 100,
        quantity: 1,
        tax_id: process.env.ZOHO_GST_18_TAX_ID // 18% GST
      }
    ],
    notes: 'Payment via NEFT/RTGS to registered bank account within 7 days'
  };

  const response = await fetch(`${ZOHO_BOOKS_API}/invoices?organization_id=${ZOHO_ORG_ID}`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invoiceData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Zoho Books error: ${error.message}`);
  }

  const { invoice } = await response.json();

  // Store in Supabase for reconciliation
  await supabase.from('partner_invoices').insert({
    partner_id: partnerId,
    invoice_number: invoice.invoice_number,
    zoho_invoice_id: invoice.invoice_id,
    amount: invoice.total,
    month: new Date().toISOString().slice(0, 7),
    status: 'sent',
    due_date: invoice.due_date
  });

  return invoice;
}

// Send onboarding contract
export async function sendPartnerContract(partnerId: string) {
  // Use Zoho Sign API (similar pattern)
  // ...
}

// Record payout
export async function recordPayout(invoiceId: string, amount: number, referenceNumber: string) {
  // Use Zoho Books customer payments API
  // ...
}
```

### Cron Jobs (Supabase Edge Functions)

**File:** `supabase/functions/monthly-commission-invoice/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createCommissionInvoice } from '../_shared/zoho-books.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Run on 1st of every month
  const today = new Date();
  if (today.getDate() !== 1) {
    return new Response('Not the 1st of the month, skipping', { status: 200 });
  }

  // Get all active partners
  const { data: partners } = await supabase
    .from('partner_profiles')
    .select('id, commission_percent')
    .eq('status', 'active');

  const results = [];

  for (const partner of partners) {
    try {
      // Calculate last month's GMV
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
      const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString();
      const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('partner_id', partner.id)
        .eq('status', 'completed')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const gmv = orders?.reduce((sum, o) => sum + o.total, 0) || 0;

      if (gmv === 0) {
        console.log(`Skipping ${partner.id}: No sales last month`);
        continue;
      }

      // Create Zoho invoice
      const invoice = await createCommissionInvoice(partner.id, gmv, partner.commission_percent);

      results.push({
        partner_id: partner.id,
        invoice_id: invoice.invoice_id,
        amount: invoice.total,
        status: 'success'
      });
    } catch (error) {
      results.push({
        partner_id: partner.id,
        error: error.message,
        status: 'failed'
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

## 🔑 ENVIRONMENT VARIABLES

Add to `.env`:

```bash
# Zoho Books
ZOHO_CLIENT_ID=1000.XXXXXXXXX.XXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_ORG_ID=12345678

# Zoho Sign
ZOHO_SIGN_CLIENT_ID=1000.XXXXXXXXX.XXXXXXXXXXXXXXXX
ZOHO_SIGN_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Zoho Analytics
ZOHO_ANALYTICS_ORG_ID=12345678
ZOHO_ANALYTICS_WORKSPACE_ID=87654321

# Tax IDs (create in Zoho Books)
ZOHO_GST_18_TAX_ID=tax_12345678  # 18% GST for services
```

**How to Get:**
1. Create Zoho account: https://www.zoho.com/in/books/
2. Go to Developer Console: https://api-console.zoho.in/
3. Create "Self Client" app
4. Generate authorization code → Get refresh token
5. Store refresh token (never expires unless revoked)

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Zoho Books (Invoicing) - Week 1

- [ ] Create Zoho Books account (free trial 14 days, then $15/month)
- [ ] Set up organization (Wyshkit Pvt Ltd)
- [ ] Configure GST settings (18% for services)
- [ ] Create OAuth app in Zoho Developer Console
- [ ] Get refresh token (OAuth 2.0 flow)
- [ ] Create `zoho_tokens` table in Supabase
- [ ] Build `src/lib/integrations/zoho-books.ts` API client
- [ ] Test: Create invoice for test partner
- [ ] Build `supabase/functions/monthly-commission-invoice/index.ts` cron
- [ ] Test: Run cron manually, verify invoice created
- [ ] Deploy cron job to Supabase (scheduled for 1st of month)

### Phase 2: Zoho Sign (Contracts) - Week 1

- [ ] Enable Zoho Sign (included in Books, or $10/month standalone)
- [ ] Create contract template (use legal team's draft)
- [ ] Add merge fields (partner_name, commission_percent, dates)
- [ ] Build `sendPartnerContract()` function in `zoho-books.ts`
- [ ] Integrate in onboarding: After KYC approval → Send contract
- [ ] Test: Onboard test partner, verify contract email received
- [ ] Store signed contract ID in `partner_profiles.contract_zoho_id`

### Phase 3: Zoho Analytics (Dashboards) - Week 2

- [ ] Create Zoho Analytics workspace
- [ ] Connect Supabase database (JDBC connector)
- [ ] Create 5 dashboards:
  - GMV Overview
  - Partner Performance
  - Commission Breakdown
  - Category Trends
  - Geographic Analysis
- [ ] Build `src/lib/integrations/zoho-analytics.ts` client
- [ ] Embed dashboards in Admin Console (iFrame or API)
- [ ] Test: View dashboards in admin panel
- [ ] Schedule email reports (weekly to stakeholders)

### Phase 4: Payouts Reconciliation - Week 2

- [ ] Build `recordPayout()` function
- [ ] Add "Mark as Paid" button in Admin Console → Invoices page
- [ ] Test: Record test payment, verify invoice status changes
- [ ] Build aging report: Show overdue invoices
- [ ] Build banker's checklist: Next 10 payouts to process

### Phase 5: Zoho Desk (Support) - Phase 2 (Future)

- [ ] Create Zoho Desk account (when >100 partners)
- [ ] Migrate `help_articles` to Zoho Knowledge Base
- [ ] Replace custom tickets with Zoho Desk API
- [ ] Embed chat widget in partner portal
- [ ] Train support agents on Zoho Desk

---

## 💰 COST BREAKDOWN

| Service | Plan | Cost/Month | When to Upgrade |
|---------|------|------------|-----------------|
| **Zoho Books** | Standard | $15 | Immediately (invoicing) |
| **Zoho Sign** | Standard | Included in Books | Immediately (contracts) |
| **Zoho Analytics** | Standard | $24 | After 50 partners (dashboards) |
| **Zoho Desk** | Standard | $14/agent × 2 | After 100 partners (support volume) |
| **Total (Phase 1)** | | **$15/month** | |
| **Total (Phase 2)** | | **$67/month** | When >100 partners |

**vs. Building Custom:**
- Development time saved: **5 weeks** (₹5-10 lakh if outsourced)
- Maintenance time saved: **2 days/month** (bug fixes, updates)
- Compliance assurance: GST, Indian tax laws (priceless)

**ROI:** Positive after 1 month (time saved > subscription cost)

---

## 🎯 DECISION MATRIX

| Feature | Custom | Zoho | Decision |
|---------|--------|------|----------|
| **Invoicing** | 2 weeks dev | 2 days | ✅ **Zoho Books** |
| **Contracts** | 1 week dev | 1 day | ✅ **Zoho Sign** |
| **Analytics** | 3 weeks dev | 3 days | ✅ **Zoho Analytics** |
| **Support Tickets** | Already built | $14/agent | ✅ **Keep Custom (Phase 1)**, migrate later |
| **Order Management** | Core logic | Not applicable | ✅ **Keep Custom** (Supabase) |
| **Product Catalog** | Core logic | Not applicable | ✅ **Keep Custom** (Supabase) |

**Final Architecture:**
- **Zoho:** Finance, contracts, analytics, support (operational tools)
- **Supabase:** Products, orders, partners, campaigns (core business logic)
- **Integration:** Supabase Edge Functions call Zoho APIs

---

## 🚀 NEXT STEPS

### Immediate (This Week):
1. Create Zoho Books account
2. Get OAuth credentials
3. Build `zoho-books.ts` API client
4. Test invoice creation for 1 partner
5. Document API responses

### Short-term (Next 2 Weeks):
6. Build monthly commission cron job
7. Integrate contract sending in onboarding
8. Test end-to-end: Onboard partner → Generate invoice → Record payout

### Medium-term (Month 2):
9. Set up Zoho Analytics dashboards
10. Embed in Admin Console
11. Train admin team on Zoho Books UI

### Long-term (Month 3+):
12. Migrate to Zoho Desk (if support volume justifies)
13. Add Zoho CRM for partner relationships (optional)

---

**Last Updated:** October 20, 2025  
**Next Action:** Create Zoho Books account, get OAuth credentials, build API client  
**Estimated Time to First Invoice:** 2 days

