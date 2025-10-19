# Partner Platform Implementation Plan - DRY & Mobile-First

**Date**: October 19, 2025  
**Approach**: Reuse Customer UI components, Mobile-first, IDfy onboarding, Swiggy/Zomato patterns  
**Timeline**: 2 weeks (Partner Dashboard 7 days + Onboarding 5 days + Admin 3 days)

---

## ✅ Validation of Your 12 Prompts

### What's GOOD ✅
1. **Comprehensive** - You've thought through every feature
2. **Mobile-first** - All prompts specify 320px base
3. **Swiggy/Zomato patterns** - Matches industry standards
4. **Technical specs** - Schema, API calls, edge cases covered
5. **Testing checklists** - Every prompt has testing criteria

### What to SIMPLIFY (DRY Principle) 🔄

**Issues**:
1. **Too many features for MVP** - 12 features = 6-8 weeks, not 2-3
2. **Component duplication** - Creating new components when customer UI has reusable ones
3. **Complex features first** - Launch Blockers (bulk pricing, disputes) should be Phase 2
4. **Over-engineering** - IDfy, Razorpay, Delhivery all at once

**DRY Fixes**:
```
❌ Create BulkPricingTiers component from scratch
✅ Reuse FilterChips, Accordion, Input from customer UI

❌ Build custom DisputeResolution page
✅ Reuse DataTable, Sheet components (already exist)

❌ New PartnerBottomNav from scratch
✅ Clone CustomerBottomNav, change icons/routes (5 mins vs 1 hour)

❌ Build all 12 features Week 1
✅ Build core dashboard (5 pages), add features iteratively
```

---

## 🎯 SIMPLIFIED MVP PLAN (2 Weeks)

### Week 1: Partner Dashboard Core (5 Pages)

**Goal**: Approved partners can manage their business

**Pages** (Reusing Customer UI Patterns):
1. **Home/Overview** - Dashboard with stats (reuse Card, Badge components)
2. **Products** - CRUD with DataTable (reuse existing DataTable)
3. **Orders** - Real-time list (reuse Sheet, Badge, DataTable)
4. **Earnings** - Transactions (reuse DataTable, format from customer UI)
5. **Profile** - Edit business info (reuse Form components)

**Shared Components to Reuse**:
- `CustomerBottomNav.tsx` → `PartnerBottomNav.tsx` (change 5 icons/routes)
- `CustomerMobileHeader.tsx` → `PartnerHeader.tsx` (remove cart, add notifications)
- `CustomerItemCard.tsx` → `ProductCard.tsx` (same structure, different data)
- `DataTable` (ui/) → Use directly for Products, Orders, Earnings
- `Sheet` (ui/) → Use for order details, product edit
- `FilterChips.tsx` → Use for order status filters
- `Stepper.tsx` → Reuse for quantity inputs
- `ThemeToggle.tsx` → Reuse as-is

**NEW Components to Build** (Only what's unique):
1. `PartnerLayout.tsx` - Container with sidebar (desktop) + bottom nav (mobile)
2. `StatsCard.tsx` - Dashboard metrics (orders, revenue, rating)
3. `ProductForm.tsx` - Add/edit product sheet
4. `OrderCard.tsx` - Order item in list (reuse Card structure from customer)

**Estimated Time**: 5-7 days (50% faster due to reuse)

---

### Week 2 (Part 1): Vendor Onboarding (4 Steps) - 3 Days

**Goal**: New vendors can signup and complete KYC

**Pages**:
1. **Signup** - Email + Password (reuse customer Login.tsx, modify for partner)
2. **Onboarding** - 4-step stepper (reuse Stepper component)
   - Step 1: Business Details (reuse Form components)
   - Step 2: KYC Documents (IDfy API or manual for MVP)
   - Step 3: Banking (simple form, no Razorpay validation for MVP)
   - Step 4: Review & Submit

**KYC Strategy for MVP**:
```typescript
// ❌ Don't build: Full IDfy integration (Week 1)
// ✅ Do build: Manual document upload + admin review

interface Step2KYC_MVP {
  fields: {
    panCard: {
      number: string;        // Input field
      upload: File;          // Drag-drop (reuse from customer)
      // NO IDfy API call for MVP (admin manually verifies)
    };
    gstNumber: {
      number: string;
      // NO API verification for MVP
    };
    fssaiNumber?: {         // Conditional
      required: category === 'food';
      number: string;
      upload: File;
    };
  };
  
  validation: {
    panFormat: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;  // Regex only
    gstFormat: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[Z0-9]{1}[A-Z]{1}[0-9]{1}$/;
    // NO API calls (save ₹10-15 per partner)
  };
}
```

**Why Simplify**:
- **IDfy costs ₹30-45** per vendor (PAN + GST + Aadhaar)
- **MVP has <20 vendors** (₹600-900 total cost vs free manual review)
- **Add IDfy in Phase 2** when you have 50+ signups/month

**Estimated Time**: 3 days (using reusable forms)

---

### Week 2 (Part 2): Admin Console (3 Days)

**Goal**: Admins can approve partners and monitor orders

**Pages** (Ultra Simple MVP):
1. **Partner Approvals** - DataTable with approve/reject buttons
2. **Orders Monitor** - All orders across partners (read-only for MVP)
3. **Analytics** (Optional) - Basic stats, no complex charts

**Estimated Time**: 3 days (reuse DataTable, simple CRUD)

---

## 🔄 DRY Component Map

### Reuse from Customer UI (No Changes Needed)

| Customer Component | Partner Usage | Time Saved |
|-------------------|---------------|------------|
| `DataTable` (ui/) | Products, Orders, Earnings tables | 8 hours |
| `Sheet` (ui/) | Order details, Product edit | 4 hours |
| `Card` (ui/) | Stats cards, Product cards | 3 hours |
| `Form` components (ui/) | All forms | 6 hours |
| `Stepper.tsx` | Quantity inputs | 1 hour |
| `ThemeToggle.tsx` | Use as-is | 1 hour |
| `FilterChips.tsx` | Order status filters | 2 hours |
| **TOTAL SAVED** | | **25 hours = 3 days** |

### Modify from Customer UI (Clone & Adapt)

| Customer Component | Partner Component | Changes | Time |
|-------------------|-------------------|---------|------|
| `CustomerBottomNav.tsx` | `PartnerBottomNav.tsx` | Change 5 icons (Home, Products, Orders, Earnings, Profile) | 30 mins |
| `CustomerMobileHeader.tsx` | `PartnerHeader.tsx` | Remove cart, add notification bell | 1 hour |
| `CustomerItemCard.tsx` | `ProductCard.tsx` | Add stock badge, edit button | 1 hour |
| **TOTAL** | | | **2.5 hours** |

### Build New (Partner-Specific)

| Component | Purpose | Time |
|-----------|---------|------|
| `PartnerLayout.tsx` | Sidebar (desktop) + bottom nav (mobile) container | 3 hours |
| `StatsCard.tsx` | Dashboard metrics (orders, revenue, rating) | 2 hours |
| `ProductForm.tsx` | Add/edit product sheet | 4 hours |
| `OrderCard.tsx` | Order item with accept/reject | 2 hours |
| `OnboardingStepper.tsx` | 4-step wizard | 4 hours |
| **TOTAL** | | **15 hours = 2 days** |

**Grand Total: 5 days for full partner dashboard** (vs 10 days building from scratch)

---

## 📋 STREAMLINED FEATURE PRIORITY

### Phase 1 (MVP - 2 Weeks): Core Dashboard

**Launch Blockers** (Must Have):
1. ✅ **Partner Authentication** (Login, Signup) - 1 day
2. ✅ **Dashboard Layout** (Sidebar, Bottom Nav) - 1 day
3. ✅ **Products CRUD** (Add, Edit, Delete, List) - 2 days
4. ✅ **Orders Management** (List, Accept, Reject) - 2 days
5. ✅ **Onboarding Flow** (4 steps, manual KYC) - 3 days
6. ✅ **Admin Approvals** (Review, Approve, Reject) - 2 days
7. ✅ **Earnings View** (Read-only transactions) - 1 day

**Total**: 12 days = **2 calendar weeks** (with buffer)

---

### Phase 2 (Post-Launch): Advanced Features

**Add After MVP Proven** (Your 12 Prompts):
1. 🔄 **Bulk Pricing** (3 days) - PROMPT 1
2. 🔄 **Dispute Resolution** (3 days) - PROMPT 2
3. 🔄 **Returns & Refunds** (3 days) - PROMPT 3
4. 🔄 **Campaign Management** (2 days) - PROMPT 4
5. 🔄 **Sponsored Listings** (2 days) - PROMPT 5
6. 🔄 **Loyalty Badges** (2 days) - PROMPT 6
7. 🔄 **Referral Program** (2 days) - PROMPT 7
8. 🔄 **Bulk Operations** (2 days) - PROMPT 8
9. 🔄 **Ratings & Reviews** (2 days) - PROMPT 9
10. 🔄 **Stock Alerts** (1 day) - PROMPT 10
11. 🔄 **Sourcing Limits** (1 day) - PROMPT 11
12. 🔄 **Help Center** (2 days) - PROMPT 12

**Total Phase 2**: 25 days = **5 weeks**

---

## 🚀 IMMEDIATE NEXT STEPS (Phase 1 MVP)

### Step 1: Database Schema (30 mins)

Create `005_partner_platform_core.sql`:

```sql
-- Partner profiles (extends auth.users)
CREATE TABLE partner_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- Determines FSSAI requirement
  address JSONB,
  phone TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_reason TEXT,
  
  -- KYC (stored for admin review, no API calls for MVP)
  pan_number TEXT,
  pan_document_url TEXT,
  gst_number TEXT,
  fssai_number TEXT,           -- NULL if not food
  fssai_document_url TEXT,
  
  -- Banking
  bank_account TEXT,            -- Encrypted
  bank_ifsc TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (simple for MVP)
CREATE TABLE partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,       -- in paise
  stock INTEGER DEFAULT 0,
  images TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (link existing orders table to partners)
ALTER TABLE orders ADD COLUMN partner_id UUID REFERENCES partner_profiles(id);
ALTER TABLE orders ADD COLUMN partner_status TEXT DEFAULT 'pending'; -- 'pending' | 'accepted' | 'preparing' | 'ready'

-- Earnings (simple view)
CREATE VIEW partner_earnings AS
SELECT 
  partner_id,
  DATE_TRUNC('week', created_at) as week,
  SUM(total) as revenue,
  SUM(total * 0.15) as commission,
  SUM(total * 0.85) as payout,
  COUNT(*) as orders
FROM orders
WHERE status = 'completed'
GROUP BY partner_id, week;
```

---

### Step 2: Reusable Component Library (1 day)

Create `src/components/shared/` for cross-platform components:

```typescript
// src/components/shared/MobileBottomNav.tsx (DRY!)
interface BottomNavProps {
  items: Array<{
    icon: LucideIcon;
    label: string;
    path: string;
    badge?: number;
  }>;
}

export const MobileBottomNav = ({ items }: BottomNavProps) => {
  // SAME CODE as CustomerBottomNav, but accepts items as props
  // Use for: Customer, Partner, Admin (3 platforms, 1 component)
};

// Usage:
// Customer: <MobileBottomNav items={customerNavItems} />
// Partner: <MobileBottomNav items={partnerNavItems} />
// Admin: <MobileBottomNav items={adminNavItems} />
```

**Reusable Components to Extract**:
1. `MobileBottomNav` - Used by all 3 platforms
2. `MobileHeader` - Generic header (logo, location, actions)
3. `StatsCard` - Metrics display (orders, revenue, rating)
4. `StatusBadge` - Color-coded status (pending, approved, active)
5. `ImageUploader` - Drag-drop with Cloudinary (onboarding + products)

**Time Saved**: 10-15 hours across all platforms

---

### Step 3: Partner Dashboard (5 Pages) - 5 Days

Using DRY approach, here's the streamlined build:

#### Day 1: Layout & Authentication

**Files to Create**:
1. `src/pages/partner/Login.tsx` - Clone `customer/Login.tsx`, change title/redirect
2. `src/pages/partner/Signup.tsx` - Email+Password only (no social)
3. `src/components/partner/PartnerLayout.tsx` - Sidebar + BottomNav wrapper
4. `src/components/shared/MobileBottomNav.tsx` - **DRY component** (extracted from customer)

**Reuse**: Form components, Button, Input, Card (90% code reuse)

---

#### Day 2: Dashboard Home

**Files to Create**:
1. `src/pages/partner/Home.tsx` - Stats cards + quick actions
2. `src/components/shared/StatsCard.tsx` - **DRY component** (reusable metric display)

**Code Example** (DRY):
```typescript
// StatsCard - Use for Customer, Partner, Admin metrics
export const StatsCard = ({ title, value, icon: Icon, trend, color }) => (
  <Card>
    <CardContent>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <Icon className={`h-8 w-8 text-${color}`} />
      </div>
      {trend && <p className="text-xs mt-2">{trend}</p>}
    </CardContent>
  </Card>
);

// Usage in partner/Home.tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
  <StatsCard title="Orders" value="24" icon={ShoppingBag} trend="+12% this week" color="primary" />
  <StatsCard title="Revenue" value="₹45K" icon={DollarSign} trend="+8%" color="green" />
  <StatsCard title="Rating" value="4.8★" icon={Star} color="yellow" />
  <StatsCard title="Products" value="18" icon={Package} color="blue" />
</div>
```

**Reuse**: Card, Badge, Button (100% reuse)

---

#### Day 3-4: Products Page (CRUD)

**Files to Create**:
1. `src/pages/partner/Products.tsx` - Main page with DataTable
2. `src/components/partner/ProductForm.tsx` - Add/edit sheet
3. `src/components/shared/ImageUploader.tsx` - **DRY component** (for onboarding too)

**Reuse**:
- `DataTable` (ui/) - 100% reuse
- `Sheet` (ui/) - 100% reuse
- `Form` components - 100% reuse

**Code Example** (DRY):
```typescript
// Products.tsx - Reuse DataTable from ui/
import { DataTable } from "@/components/ui/data-table";

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => <img src={row.original.image} className="w-12 h-12 rounded" />
  },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "price", header: "Price", cell: ({ row }) => `₹${row.original.price}` },
  { accessorKey: "stock", header: "Stock" },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuItem onClick={() => editProduct(row.original)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => deleteProduct(row.original.id)}>Delete</DropdownMenuItem>
      </DropdownMenu>
    )
  }
];

return <DataTable columns={columns} data={products} searchKey="name" />;
```

**Time**: 2 days (vs 4 days building custom table)

---

#### Day 5: Orders Page (Real-time)

**Files to Create**:
1. `src/pages/partner/Orders.tsx` - Orders list with tabs
2. `src/components/partner/OrderDetail.tsx` - Order detail sheet

**Reuse**:
- `DataTable` (ui/) - 100% reuse
- `Sheet` (ui/) - 100% reuse
- `Badge` (ui/) - For status
- `Tabs` (ui/) - For New/Preparing/Ready

**Code Example** (DRY + Real-time):
```typescript
// Orders.tsx
import { useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Tabs } from '@/components/ui/tabs';

export const PartnerOrders = () => {
  const [orders, setOrders] = useState([]);
  
  // Supabase real-time subscription (Zomato pattern)
  useEffect(() => {
    const channel = supabase
      .channel('partner-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `partner_id=eq.${partnerId}`
      }, (payload) => {
        setOrders(prev => [payload.new, ...prev]);
        toast({ title: "New Order!", description: `Order #${payload.new.id}` });
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [partnerId]);
  
  return (
    <Tabs defaultValue="new">
      <TabsList>
        <TabsTrigger value="new">New ({newCount})</TabsTrigger>
        <TabsTrigger value="preparing">Preparing</TabsTrigger>
        <TabsTrigger value="ready">Ready</TabsTrigger>
      </TabsList>
      <TabsContent value="new">
        <DataTable columns={orderColumns} data={orders.filter(o => o.status === 'pending')} />
      </TabsContent>
    </Tabs>
  );
};
```

**Time**: 1 day (vs 2-3 days building custom)

---

#### Day 6: Earnings Page

**Files to Create**:
1. `src/pages/partner/Earnings.tsx` - Transactions table

**Reuse**:
- `DataTable` (ui/) - 100% reuse
- `Card` (ui/) - For summary cards

**Code Example** (Simple!):
```typescript
// Earnings.tsx - VERY simple for MVP
export const PartnerEarnings = () => {
  const [earnings, setEarnings] = useState({ week: 0, pending: 0 });
  
  useEffect(() => {
    // Fetch from partner_earnings view
    const fetchEarnings = async () => {
      const { data } = await supabase
        .from('partner_earnings')
        .select('*')
        .eq('partner_id', partnerId)
        .single();
      
      setEarnings(data);
    };
    fetchEarnings();
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">This Week</p>
            <h3 className="text-2xl font-bold">₹{earnings.week / 100}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Pending Payout</p>
            <h3 className="text-2xl font-bold">₹{earnings.pending / 100}</h3>
          </CardContent>
        </Card>
      </div>
      <DataTable columns={transactionColumns} data={transactions} />
    </div>
  );
};
```

**Time**: 4 hours (ultra simple)

---

#### Day 7: Profile Page

**Files to Create**:
1. `src/pages/partner/Profile.tsx` - Edit business details

**Reuse**:
- `Form` components (ui/) - 100% reuse from customer
- `Card` (ui/) - 100% reuse

**Time**: 4 hours

---

### Week 2: Onboarding + Admin (6 Days)

#### Day 8-10: Onboarding (3 Days)

**Files to Create**:
1. `src/pages/partner/Onboarding.tsx` - Stepper container
2. `src/pages/partner/onboarding/Step1Business.tsx` - Business form
3. `src/pages/partner/onboarding/Step2KYC.tsx` - Documents upload (conditional FSSAI)
4. `src/pages/partner/onboarding/Step3Banking.tsx` - Bank details
5. `src/pages/partner/onboarding/Step4Review.tsx` - Summary

**Conditional FSSAI Logic** (Your Question Answered):
```typescript
// Step1Business.tsx
const [category, setCategory] = useState('');

// Step2KYC.tsx
const showFSSAI = ['food', 'perishables', 'beverages'].includes(category);

return (
  <Form>
    <FormField name="pan_number" />
    <FormField name="gst_number" />
    
    {/* Conditional FSSAI - only if food category */}
    {showFSSAI && (
      <>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>FSSAI Required</AlertTitle>
          <AlertDescription>
            Since you deal with food items, FSSAI license is mandatory.
            <Link href="https://foscos.fssai.gov.in" target="_blank">How to get FSSAI?</Link>
          </AlertDescription>
        </Alert>
        <FormField name="fssai_number" required />
        <FormField name="fssai_document" type="file" required />
      </>
    )}
  </Form>
);
```

**Reuse**:
- `Form`, `Input`, `Button`, `Alert` - 100% reuse
- `ImageUploader` - Reuse from shared components

**IDfy for MVP**: **Skip it** (manual review), add in Phase 2

---

#### Day 11-12: Admin Console (2 Days)

**Files to Create**:
1. `src/pages/admin/PartnerApprovals.tsx` - Approval queue
2. `src/components/admin/ApprovalDetail.tsx` - Review KYC sheet

**Reuse**:
- `DataTable` (ui/) - 100% reuse
- `Sheet` (ui/) - 100% reuse

**Code Example** (Simple!):
```typescript
// PartnerApprovals.tsx
const columns: ColumnDef<PartnerProfile>[] = [
  { accessorKey: "business_name", header: "Business Name" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "created_at", header: "Submitted", cell: ({ row }) => formatDate(row.original.created_at) },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => approve(row.original.id)}>Approve</Button>
        <Button size="sm" variant="destructive" onClick={() => reject(row.original.id)}>Reject</Button>
      </div>
    )
  }
];

return <DataTable columns={columns} data={pendingPartners} />;
```

**Time**: 2 days (vs 5 days building custom UI)

---

## 🛠 Customer UI Changes Needed

### What Needs to Change:

#### 1. Partners Data Structure (Add Status Field)

Currently `supabase-data.ts` has basic Partner interface. Need to add:

```typescript
// src/lib/integrations/supabase-data.ts
export interface Partner {
  id: string;
  name: string;
  image: string;
  rating: number;
  delivery: string;
  // ... existing fields ...
  
  // ADD THESE for partner platform integration:
  status?: 'pending' | 'approved' | 'rejected';  // NEW
  category: string;                               // Already exists ✅
  business_email?: string;                        // NEW
  commission_percent?: number;                    // NEW (for earnings)
}
```

#### 2. Items/Products - Link to Partners

Already has `partner_id` ✅ No changes needed!

```typescript
export interface Item {
  partner_id: string;  // ✅ Already exists
  // ... rest is good
}
```

#### 3. Customer UI - Filter Only Approved Partners

**Change needed in**: `src/pages/customer/CustomerHome.tsx`

```typescript
// BEFORE (shows all partners)
const { data: partners } = await supabase.from('partners').select('*');

// AFTER (shows only approved)
const { data: partners } = await supabase
  .from('partners')
  .select('*')
  .eq('status', 'approved')  // ← ADD THIS
  .eq('is_active', true);     // ← AND THIS (for partner self-disable)
```

**Files to Update**:
- `src/pages/customer/CustomerHome.tsx` (line ~70)
- `src/pages/customer/Search.tsx` (line ~50)
- `src/lib/integrations/supabase-data.ts` - `searchPartners()` function

**Time**: 30 mins

---

#### 4. Orders - Add Partner Status

**Change needed in**: Orders table already has structure, just add partner workflow

```typescript
// Order flow:
// Customer places order → partner_status = 'pending'
// Partner accepts → partner_status = 'accepted'
// Partner prepares → partner_status = 'preparing'
// Partner ships → partner_status = 'ready'
```

**Customer UI Changes**:
- `src/pages/customer/Track.tsx` - Show partner preparation status
- No other changes needed (order structure already good)

**Time**: 1 hour

---

## 📊 FINAL RECOMMENDATION

### Option A: MVP First (Recommended)

**Build Only**:
1. Partner Dashboard (5 pages, DRY approach) - **5 days**
2. Onboarding (4 steps, manual KYC) - **3 days**
3. Admin Approvals (1 page) - **2 days**

**Skip for MVP**:
- Bulk Pricing (your PROMPT 1)
- Disputes (PROMPT 2)
- Returns (PROMPT 3)
- All WEEK 1 features (PROMPTS 4-12)

**Total**: **10 days = 2 weeks**

**Then**: Launch with 5-10 manually approved partners, validate model, add features based on feedback

---

### Your 12 Prompts - Use in Phase 2

**Save your prompts for later!** They're excellent but:
- Too complex for MVP (6-8 weeks)
- Some features need real data to test (e.g., disputes need actual orders)
- Better to launch simple, iterate based on partner feedback

**Phase 2 Priority** (Post-MVP):
1. PROMPT 10: Stock Alerts (1 day) - Quick win, prevents overselling
2. PROMPT 1: Bulk Pricing (3 days) - Requested by partners
3. PROMPT 9: Reviews Management (2 days) - Trust signal
4. PROMPT 8: Bulk Operations (2 days) - Efficiency for partners
5. PROMPT 7: Referral (2 days) - Growth driver
6. ... rest based on partner requests

---

## ✅ WHAT I'LL BUILD (If You Approve)

### Phase 1 MVP (2 Weeks):

**Week 1:**
1. Partner authentication (Login, Signup) - Email+Password only
2. PartnerLayout with sidebar (desktop) + bottom nav (mobile)
3. Dashboard Home - Stats cards (today's orders, revenue, rating)
4. Products page - DataTable with add/edit/delete
5. Orders page - Real-time with accept/reject

**Week 2:**
6. Earnings page - Simple transactions view
7. Profile page - Edit business details
8. Onboarding flow - 4 steps with conditional FSSAI
9. Admin approvals - Review & approve/reject
10. Customer UI updates - Filter approved partners only

**DRY Approach**:
- Extract `MobileBottomNav`, `MobileHeader`, `StatsCard`, `ImageUploader` to `components/shared/`
- Reuse 90% of customer UI components
- Same design system (colors, spacing, typography)
- Same mobile-first approach (320px base)

**No IDfy Integration**: Manual KYC review for MVP (save ₹30-45 per partner)

**Timeline**: 10 working days = 2 calendar weeks

---

## ❓ Your Decision

**Option 1: Build MVP Now** (My Recommendation)
- 2 weeks to functional partner platform
- Reuses 90% of customer UI
- No over-engineering (manual KYC, simple features)
- Your 12 prompts used in Phase 2 (after launch)

**Option 2: Build Full Feature Set** (Your 12 Prompts)
- 6-8 weeks to complete all features
- Risk of over-building before validation
- But comprehensive from day 1

**Option 3: Hybrid Approach**
- Week 1: Core dashboard (5 pages)
- Week 2: Pick 3 features from your 12 prompts
- Week 3: Onboarding + Admin

Which approach do you prefer? 🚀
