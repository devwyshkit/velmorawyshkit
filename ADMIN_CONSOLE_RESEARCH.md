# Admin Console Research: Swiggy/Zomato Patterns

## Overview
Research on Swiggy and Zomato admin console patterns for building Wyshkit's admin panel.

---

## Key Differences: Admin vs. Partner Portal

| Aspect | Partner Portal | Admin Console |
|--------|---------------|---------------|
| **Primary Users** | Vendors/Partners | Internal ops team |
| **Device** | Mobile-first (on-the-go) | Desktop-first (office work) |
| **Navigation** | Bottom nav (mobile), sidebar (desktop) | Top nav + sidebar (desktop only) |
| **Data Density** | Simplified, card-based | Dense tables, advanced filters |
| **Permissions** | Single role (partner) | Multi-role (Super Admin, Finance, Support, Content) |
| **Real-time** | Order alerts, stock alerts | Platform-wide monitoring |
| **Actions** | Self-service (own products) | Bulk approvals, escalations |

---

## Swiggy Admin Console Patterns

### 1. Dashboard (Ops Overview)
**Metrics (Top Cards):**
- GMV (Gross Merchandise Value): ₹12.5 Cr today
- Total Orders: 45,230 orders today
- Active Partners: 1,250 restaurants online
- Pending Approvals: 18 partners awaiting review
- Active Disputes: 23 open cases

**Charts:**
- Revenue trend: Line chart (7d, 30d, 90d views)
- Order volume: Bar chart by hour
- Category breakdown: Pie chart
- Top partners: Bar chart (revenue)

**Quick Actions:**
- [Approve Pending Partners] (18)
- [Review Disputes] (23)
- [Process Payouts] (120 partners due)

**Pattern:** Real-time metrics, action-oriented, minimal chrome

---

### 2. Partner Management
**Tabs:** [Approval Queue] [Active Partners] [Rejected] [Suspended]

**Approval Queue (Most Important):**
- DataTable with filters: [All] [KYC Complete] [KYC Pending] [Documents Missing]
- Columns: Partner Name, Category, KYC Status, Submitted Date, Actions
- KYC Status: Visual indicators (✅ PAN ✅ GST ⏳ Bank ❌ FSSAI)
- Row click: Opens partner details side panel
- Bulk actions: [Approve Selected] [Reject Selected]

**Partner Detail Panel:**
- Business info: Name, category, address, contact
- KYC documents: View PAN, GST, bank proof, FSSAI (if applicable)
- IDfy verification results: All green checkmarks or red X with reasons
- Commission tier: Dropdown to set (15%, 17%, 20%)
- Approval workflow:
  - [Request More Info] → Email partner
  - [Reject with Reason] → Text area (min 50 chars)
  - [Approve] → Instant activation
- Audit log: Who approved, when, any notes

**Active Partners:**
- Search: By name, category, city
- Filters: By commission tier, badge type, revenue range
- Sort: By revenue, rating, orders
- Actions per partner:
  - [View Products] → Opens product list
  - [View Orders] → Order history
  - [Adjust Commission] → Change tier
  - [Suspend] → Temporarily disable
  - [View Earnings] → Financial history

**Pattern:** Approval-centric, batch processing, detailed audit trail

---

### 3. Order Monitoring
**Real-time Dashboard:**
- Live order feed: New orders appear at top (WebSocket)
- Filters: [All] [Pending] [In Progress] [Completed] [Cancelled] [Disputed]
- Search: By order #, customer name, partner name
- Columns: Order #, Customer, Partner, Items, Total, Status, Time, Actions

**Order States:**
- 🟡 Pending: Partner hasn't accepted
- 🔵 Preparing: Partner accepted, kitting in progress
- 🚀 Dispatched: Out for delivery
- ✅ Delivered: Completed
- 🔴 Disputed: Customer complaint
- ⚫ Cancelled: Cancelled by customer/partner

**Actions per Order:**
- [View Details] → Full order info
- [Escalate to Partner] → Send reminder
- [Cancel] → If not dispatched
- [Refund] → Process refund (Razorpay)

**Dispute Escalations (Separate Tab):**
- Shows disputes unresolved >48 hours
- Admin can:
  - [Force Refund] → Override partner decision
  - [Mediate] → Chat with both parties
  - [Close] → Final decision

**Pattern:** Real-time monitoring, escalation-focused, quick actions

---

### 4. Analytics & Reports
**Dashboard Tabs:** [Revenue] [Partners] [Categories] [Trends]

**Revenue Analytics:**
- GMV trend: Daily/weekly/monthly
- Commission earned: Platform revenue
- Payout liability: Amount owed to partners
- Tax collected: GST breakdown

**Partner Analytics:**
- Top performers: Revenue, orders, rating
- New signups: This month vs. last month
- Churn rate: Partners who stopped listing
- Average rating: Platform-wide

**Category Analytics:**
- Revenue by category: Bar chart
- Growth categories: Trend lines
- Seasonal patterns: Heatmap

**Export:** [CSV] [Excel] [PDF Report]

**Pattern:** Data-heavy, export-friendly, comparison views

---

### 5. Payout Management
**Tabs:** [Pending Payouts] [Scheduled] [Completed] [Failed]

**Pending Payouts:**
- Auto-calculated for payout cycle (1st, 15th of month)
- DataTable: Partner, Earnings, Commission, Net Payout, Bank Details, Actions
- Bulk selection: [Select All] checkbox
- Actions:
  - [Process Selected] → Batch payout via Razorpay
  - [Hold] → Delay payout (e.g., pending dispute)
  - [Adjust] → Manual correction

**Zoho Books Integration:**
- [Generate Invoices] → Create invoices in Zoho for all payouts
- [Sync to Zoho] → Push payout data
- [View in Zoho] → External link

**Payout Processing:**
1. Admin selects partners → [Process Payouts]
2. System generates invoices in Zoho Books
3. Razorpay transfers initiated
4. Status updated to "Processing"
5. Webhook confirms transfer → Status = "Completed"
6. Partner notified via email

**Pattern:** Batch processing, Zoho integration, audit trail

---

### 6. Content Management
**Tabs:** [Help Articles] [Announcements] [FAQs]

**Help Articles:**
- Rich text editor: Markdown or WYSIWYG
- Categories: Dropdown (Getting Started, Products, etc.)
- Tags: Multi-select
- Publish status: Draft, Published, Archived
- Analytics: Views, helpful votes per article

**Announcements:**
- Create platform-wide announcements (shown in partner dashboard)
- Target: All partners, Specific category, Badge holders
- Priority: Info, Warning, Critical
- Expiry: Auto-hide after date

**Pattern:** CMS-style editor, targeting options, analytics

---

### 7. Settings & Configuration
**Tabs:** [Platform] [Commissions] [Policies] [Integrations]

**Platform Settings:**
- Platform fee: 15-20% (default)
- Sponsored listing fee: 5% per sale
- Min payout: ₹1,000
- Payout cycle: Bi-weekly

**Commission Tiers:**
- Standard: 20%
- Premium Partner: 15%
- Custom: Manual override per partner

**Policies:**
- Return policy: 7 days for non-custom
- Dispute resolution: 48 hours
- FSSAI requirement: Categories list

**Integrations:**
- IDfy: API key, status (connected/disconnected)
- Zoho Books: Organization ID, sync status
- Razorpay: Account details, payout status
- Cloudinary: Storage usage

**Pattern:** Configuration-heavy, integration status monitoring

---

## Zomato Admin Console Patterns

### 1. Partner Approval (Similar to Swiggy)
- KYC verification with IDfy results
- Commission negotiation: Can set custom rates
- Category assignment: Dropdown with icons
- Featured placement: Toggle to feature partner in "Top Partners"

### 2. Review Moderation
- Flagged reviews: Partner reported as spam/fake
- Admin actions:
  - [Keep Review] → Reject flag
  - [Remove Review] → Delete permanently
  - [Warn Partner] → Flag as inappropriate
- Bulk moderation: Select multiple, moderate together

### 3. Campaign Approval
- Partners request featured campaigns (+5% fee)
- Admin reviews:
  - Banner quality: Check image dimensions
  - Terms compliance: Ensure valid terms
  - [Approve] [Reject with Feedback]

---

## Key Features Missing from Current Wyshkit

### High Priority (Build Now)
1. ✅ Partner approval workflow (need to build)
2. ✅ Order monitoring dashboard (need to build)
3. ✅ Payout processing (need to build)
4. ✅ Dispute escalations (need to build)
5. ✅ Analytics & reports (need to build)

### Medium Priority (Next Phase)
6. Review moderation (can add later)
7. Campaign approval (can add later)
8. Content management (can add later)

### Low Priority (Future)
9. Platform settings (hardcode for now)
10. Integration status monitoring (not critical)

---

## Recommended Admin Routes

1. `/admin/login` - Admin authentication (separate from partner login)
2. `/admin/dashboard` - Overview metrics + quick actions
3. `/admin/partners` - Partner management (approval queue priority)
4. `/admin/orders` - Real-time order monitoring
5. `/admin/disputes` - Escalated disputes (>48 hours)
6. `/admin/payouts` - Payout processing + Zoho sync
7. `/admin/analytics` - Revenue reports, partner performance
8. `/admin/settings` - Platform configuration

---

## Database Schema for Admin

```sql
-- Admin Users Table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'support', -- super_admin, finance, support, content
  permissions JSONB, -- Granular permissions
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Audit Logs
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  action VARCHAR(100) NOT NULL, -- approved_partner, processed_payout, etc.
  target_type VARCHAR(50), -- partner, order, dispute, etc.
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Approvals (tracks approval workflow)
CREATE TABLE partner_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID UNIQUE NOT NULL,
  admin_id UUID REFERENCES admin_users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, more_info_requested
  kyc_pan_verified BOOLEAN DEFAULT FALSE,
  kyc_gst_verified BOOLEAN DEFAULT FALSE,
  kyc_bank_verified BOOLEAN DEFAULT FALSE,
  kyc_fssai_verified BOOLEAN,
  notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## UI Framework for Admin

**Different from Partner Portal:**
- Desktop-only (no mobile optimization needed)
- Top navigation bar (not bottom nav)
- Multi-panel layouts (master-detail, split views)
- Dense DataTables (more columns, smaller text)
- Advanced filters (date ranges, multi-select)

**Shared Components to Reuse:**
- DataTable (but with more columns)
- StatsCard
- StatusBadge
- ImageUploader (for reviewing docs)

---

## Build Timeline for Admin Console

**Week 1:** Research (this document), plan, wireframes  
**Week 2:** Core admin pages (login, dashboard, partners, orders)  
**Week 3:** Payout processing, Zoho integration, dispute escalations  
**Week 4:** Analytics, testing, refinement

**Total:** 4 weeks for complete admin console

---

## Next Immediate Action

Create `ADMIN_CONSOLE_PLAN.md` with:
1. Detailed feature specs
2. Component list
3. API endpoints needed
4. Wireframes (ASCII mockups)

