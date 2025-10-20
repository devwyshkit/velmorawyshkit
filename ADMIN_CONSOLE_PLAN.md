# Admin Console Implementation Plan

## Phase 1: Core Admin Pages (Week 1)

### 1.1 Admin Authentication
**Route:** `/admin/login`  
**File:** `src/pages/admin/Login.tsx`

**Features:**
- Email/password login (separate from partner auth)
- Role-based access control
- Session management
- Password reset

**Different from Partner Login:**
- No social auth (internal users only)
- 2FA optional (future enhancement)
- IP whitelist check (optional security)

---

### 1.2 Admin Dashboard
**Route:** `/admin/dashboard`  
**File:** `src/pages/admin/Home.tsx`

**Stats Cards (Top Row):**
1. **GMV Today:** ₹12.5 Cr (+15% vs yesterday)
2. **Orders Today:** 45,230 (+8%)
3. **Active Partners:** 1,250 (18 pending approval)
4. **Disputes:** 23 open (5 >48 hours)

**Charts (Second Row):**
- Revenue Trend: Line chart (last 30 days)
- Order Volume: Bar chart (hourly, today)
- Category Performance: Pie chart

**Quick Actions (Third Row):**
- [Review 18 Pending Partners] → Navigate to approval queue
- [Escalated Disputes (5)] → Navigate to disputes
- [Process Payouts] → Navigate to payouts
- [View Analytics] → Navigate to analytics

**Real-time Updates:**
- New order notification: Toast with order details
- New partner signup: Counter increments
- Dispute escalation: Red badge appears

---

### 1.3 Partner Management
**Route:** `/admin/partners`  
**File:** `src/pages/admin/Partners.tsx`

**Tabs:**
1. **Approval Queue** (Default tab, most important)
2. **Active Partners**
3. **Rejected**
4. **Suspended**

#### Approval Queue Tab
**DataTable Columns:**
- Checkbox (bulk approve)
- Partner Name
- Category
- KYC Status (✅/⏳/❌ icons for PAN, GST, Bank, FSSAI)
- Submitted Date
- Actions: [View] [Approve] [Reject]

**Filters:**
- [All] [KYC Complete] [KYC Pending] [Documents Missing]
- Search: Partner name, email
- Sort: Newest first, Oldest first

**Row Click → Partner Detail Panel (Side sheet):**
```
┌─────────────────────────────────────────┐
│ GiftCraft                        [X]    │
├─────────────────────────────────────────┤
│ Business Details                        │
│ Category: Home & Living                 │
│ Email: partner@giftcraft.com            │
│ Phone: +91 98765 43210                  │
│ Address: Mumbai, Maharashtra            │
│                                          │
│ KYC Verification                        │
│ ✅ PAN: ABCDE1234F (Verified via IDfy)  │
│ ✅ GST: 22AAAAA0000A1Z5 (Verified)       │
│ ⏳ Bank: 1234567890 (Pending)           │
│ ❌ FSSAI: Not applicable                │
│                                          │
│ Documents (Click to view)               │
│ 📄 PAN Card.pdf                         │
│ 📄 GST Certificate.pdf                  │
│ 📄 Bank Proof.pdf                       │
│                                          │
│ Commission Tier                         │
│ [Dropdown: 20% Standard ▼]              │
│                                          │
│ Admin Notes                             │
│ [Text area for internal notes]          │
│                                          │
│ ┌──────────────────────────────────┐   │
│ │ [Request More Info]              │   │
│ │ [Reject with Reason]             │   │
│ │ [Approve Partner] ✅             │   │
│ └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Bulk Approval:**
- Select multiple partners (checkboxes)
- [Approve Selected (5)] → Confirms and approves all
- Only works if all KYC verified

#### Active Partners Tab
**Features:**
- Full partner list with performance metrics
- Columns: Name, Category, Rating, Orders, Revenue, Commission, Status, Actions
- Advanced filters:
  - Commission tier: [All] [20%] [15%] [Custom]
  - Badge: [All] [Premium] [5-Star] [Fast Fulfillment]
  - Revenue range: Slider (₹0 - ₹10L+)
  - Category: Multi-select dropdown
- Actions:
  - [View Products] → Navigate to products page
  - [Adjust Commission] → Update commission tier
  - [Suspend] → Temporarily disable (with reason)
  - [View Earnings] → Financial breakdown

---

### 1.4 Order Monitoring
**Route:** `/admin/orders`  
**File:** `src/pages/admin/Orders.tsx`

**Real-time Feed:**
- WebSocket subscription to orders table
- New orders appear at top with slide-in animation
- Auto-refresh every 10 seconds

**DataTable:**
- Columns: Order #, Time, Customer, Partner, Items, Total, Status, Actions
- Filters: Status (all states), Date range, Partner, Amount range
- Search: Order #, customer name, partner name
- Sort: Newest first (default)

**Actions per Order:**
- [View Details] → Opens order detail panel
- [Track] → Shows delivery timeline
- [Contact Partner] → Send message
- [Cancel] → If not dispatched (with reason)
- [Refund] → Process refund (requires approval)

**Order Detail Panel:**
```
┌─────────────────────────────────────────┐
│ Order #ORD-12345                 [X]    │
├─────────────────────────────────────────┤
│ Status: 🚀 Dispatched                   │
│ Ordered: Oct 20, 2025 10:30 AM         │
│ Expected: Oct 22, 2025                  │
│                                          │
│ Customer Details                        │
│ Name: Priya Mehta                       │
│ Phone: +91 98765 43210                  │
│ Address: Bangalore, Karnataka           │
│                                          │
│ Partner Details                         │
│ Name: GiftCraft                         │
│ Contact: partner@giftcraft.com          │
│                                          │
│ Items (2)                               │
│ • Premium Hamper x2 - ₹4,998            │
│ • Gift Wrapping x2 - ₹298               │
│                                          │
│ Pricing                                 │
│ Subtotal: ₹5,296                        │
│ GST (18%): ₹953                         │
│ Total: ₹6,249                           │
│ Commission (20%): ₹1,250                │
│ Partner Net: ₹4,999                     │
│                                          │
│ Timeline                                │
│ ✅ Order Placed - Oct 20, 10:30 AM     │
│ ✅ Partner Accepted - Oct 20, 10:45 AM │
│ ✅ Dispatched - Oct 21, 9:00 AM        │
│ ⏳ Out for Delivery - Oct 22           │
│                                          │
│ [Send Reminder to Partner]              │
│ [Cancel Order] [Issue Refund]           │
└─────────────────────────────────────────┘
```

---

## Phase 2: Financial & Dispute Management (Week 2-3)

### 2.1 Dispute Escalations
**Route:** `/admin/disputes`  
**File:** `src/pages/admin/Disputes.tsx`

**Only shows disputes that:**
- Unresolved for >48 hours, OR
- Partner rejected customer's claim, OR
- Customer disputed partner's resolution

**DataTable:**
- Columns: Dispute #, Order #, Customer, Partner, Issue, Age, Status, Actions
- Filters: [All] [Escalated] [High Priority]
- Sort: Oldest first (urgent ones on top)

**Actions:**
- [Review] → Opens dispute detail
- [Force Refund] → Admin overrides partner decision
- [Mediate] → Start chat with both parties
- [Close] → Final admin decision

**Admin Powers:**
- Can force full/partial refunds
- Can suspend partner if pattern of issues
- Can compensate customer from platform wallet

---

### 2.2 Payout Processing
**Route:** `/admin/payouts`  
**File:** `src/pages/admin/Payouts.tsx`

**Tabs:** [Pending] [Scheduled] [Processing] [Completed] [Failed]

**Pending Payouts Tab:**
- Auto-calculated every payout cycle (1st, 15th)
- Shows partners eligible for payout (min ₹1,000)
- DataTable with financial breakdown

**Bulk Processing:**
1. [Select All] → Selects all eligible
2. [Generate Zoho Invoices] → Creates invoices in Zoho Books
3. [Process via Razorpay] → Initiates bank transfers
4. [Mark as Paid] → Updates status
5. [Notify Partners] → Sends payout confirmation emails

**Zoho Books Integration:**
- Real-time sync status indicator
- [View in Zoho] button per payout
- Monthly reconciliation report

---

## Phase 3: Analytics & Content (Week 4)

### 3.1 Analytics Dashboard
**Route:** `/admin/analytics`  
**File:** `src/pages/admin/Analytics.tsx`

**Metrics:**
- Platform GMV: Daily/weekly/monthly trends
- Partner growth: New signups, churn rate
- Category performance: Revenue by category
- Geographic distribution: Revenue by city
- Commission earned: Platform revenue

**Export Options:**
- CSV: Raw data
- Excel: Formatted with charts
- PDF: Presentation-ready report

---

### 3.2 Content Management
**Route:** `/admin/content`  
**File:** `src/pages/admin/Content.tsx`

**Help Articles:**
- WYSIWYG editor (TipTap or similar)
- Category assignment
- Publish/unpublish
- View analytics (views, helpful votes)

**Announcements:**
- Create platform announcements
- Target specific partners (by category, badge)
- Schedule publish date

---

## Technology Stack for Admin

**Frontend:**
- React (Vite) - Same as partner portal
- Shadcn UI - Same components
- React Hook Form + Zod - Form handling
- Recharts - Advanced analytics charts
- TipTap - Rich text editor (for content)

**Backend:**
- Supabase - Same database
- Zoho Books API - Invoicing, payouts
- Razorpay - Payout transfers
- IDfy - KYC verification results

**Deployment:**
- Same Vite build
- Route protection: Admin role check
- Separate subdomain: admin.wyshkit.com (optional)

---

## Build Order (Recommended)

### Week 1: Core Admin
1. Admin login + authentication
2. Admin dashboard (overview)
3. Partner approval workflow (approval queue)
4. Order monitoring (real-time feed)

### Week 2: Financial
5. Payout processing
6. Zoho Books integration (mock first)
7. Dispute escalations
8. Analytics dashboard

### Week 3: Content & Settings
9. Help article management
10. Platform settings
11. Admin user management
12. Audit log viewer

---

## Success Criteria

✅ **Partner Approval:** <24 hours from signup to approval  
✅ **Order Monitoring:** Real-time updates, zero manual tracking  
✅ **Payouts:** 100% automated, Zoho synced, zero errors  
✅ **Disputes:** 95%+ resolved within 48 hours  
✅ **Analytics:** Daily reports auto-generated  
✅ **Audit:** All admin actions logged

---

**Ready to build after partner portal is complete ✅**

