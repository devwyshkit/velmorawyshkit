# Partner Platform Implementation Plan - MVP
## Mobile-First, DRY Principles, Swiggy/Zomato Patterns

**Date**: October 19, 2025  
**Timeline**: 2-3 weeks (14-18 days)  
**Approach**: Reuse customer UI components, build incrementally

---

## Executive Summary

Build a **minimal viable partner platform** that allows vendors to:
1. Sign up with Email+Password (no social login)
2. Complete 4-step onboarding (conditional FSSAI)
3. Wait for admin approval
4. Manage catalog (add/edit products)
5. Accept/reject orders (real-time)
6. View earnings (commission transparency)

**Design Philosophy**: Mobile-first, DRY (reuse 80% from customer UI), Swiggy/Zomato patterns

---

## Phase 1: Foundation (Days 1-3)

### Day 1: Database Schema + Authentication

**Database Migration** (`supabase/migrations/005_partner_platform.sql`):

```sql
-- Partner profiles (extends auth.users)
CREATE TABLE partner_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_type TEXT, -- 'sole_proprietor' | 'partnership' | 'private_limited'
  category TEXT NOT NULL, -- Determines FSSAI requirement
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- KYC (conditional based on category)
  pan_number TEXT,
  pan_verified BOOLEAN DEFAULT false,
  gst_number TEXT,
  gst_verified BOOLEAN DEFAULT false,
  fssai_number TEXT, -- NULL if not food category
  fssai_expiry DATE,
  fssai_verified BOOLEAN DEFAULT false,
  
  -- Banking
  bank_account TEXT, -- Encrypted
  bank_ifsc TEXT,
  bank_verified BOOLEAN DEFAULT false,
  
  -- Approval workflow
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner products
CREATE TABLE partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  images TEXT[], -- Array of Cloudinary URLs
  
  -- Pricing
  price INTEGER NOT NULL, -- in paise
  
  -- Stock
  stock INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER DEFAULT 50,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner orders (links to existing orders table)
ALTER TABLE orders ADD COLUMN partner_id UUID REFERENCES partner_profiles(id);
ALTER TABLE orders ADD COLUMN partner_status TEXT DEFAULT 'pending'; -- 'pending' | 'accepted' | 'preparing' | 'ready'

-- Enable RLS
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies (partners can only see their own data)
CREATE POLICY "Partners can view own profile"
  ON partner_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Partners can update own profile"
  ON partner_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Partners can view own products"
  ON partner_products FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can insert own products"
  ON partner_products FOR INSERT
  WITH CHECK (partner_id = auth.uid());
```

**Partner Authentication** (`src/pages/partner/Login.tsx`, `Signup.tsx`):

```typescript
// REUSE customer Login.tsx structure but:
// - Remove social login buttons (Google, Facebook)
// - Keep Email+Password only
// - Add stricter password validation (min 8 chars, uppercase, number, special)
// - Session: 7 days (vs 30 for customers)
// - Role: Set user.role = 'partner' on signup

// DRY: Reuse from customer UI:
import { CustomerMobileHeader } from '@/components/customer/shared/CustomerMobileHeader';
// Just rename to PartnerHeader (or reuse as-is with logo prop)
```

**Estimated Time**: 6-8 hours

---

### Days 2-3: Partner Layout + Routing

**Partner Layout** (`src/components/partner/PartnerLayout.tsx`):

```typescript
// REUSE CustomerBottomNav pattern but with different nav items
const PartnerBottomNav = () => {
  const navItems = [
    { icon: Home, label: "Home", path: "/partner/dashboard" },
    { icon: Package, label: "Catalog", path: "/partner/catalog" },
    { icon: ShoppingBag, label: "Orders", path: "/partner/orders" },
    { icon: DollarSign, label: "Earnings", path: "/partner/earnings" },
    { icon: User, label: "Profile", path: "/partner/profile" },
  ];
  
  // Rest is IDENTICAL to CustomerBottomNav
  // DRY: Extract base BottomNav component, pass navItems as props
};
```

**Routing** (`src/App.tsx`):

```typescript
// Add partner routes (protected by role check)
<Route path="/partner">
  <Route path="login" element={<PartnerLogin />} />
  <Route path="signup" element={<PartnerSignup />} />
  
  {/* Protected routes - require auth + role='partner' */}
  <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
    <Route path="onboarding" element={<PartnerOnboarding />} />
    <Route path="dashboard" element={<PartnerDashboard />}>
      <Route index element={<PartnerHome />} />
      <Route path="catalog" element={<PartnerCatalog />} />
      <Route path="orders" element={<PartnerOrders />} />
      <Route path="earnings" element={<PartnerEarnings />} />
      <Route path="profile" element={<PartnerProfile />} />
    </Route>
  </Route>
</Route>
```

**Estimated Time**: 8-10 hours

---

## Phase 2: Onboarding (Days 4-7)

### Day 4-5: 4-Step Onboarding Form

**Onboarding Container** (`src/pages/partner/Onboarding.tsx`):

```typescript
// REUSE Stepper component from customer UI
import { Stepper } from '@/components/customer/shared/Stepper';

const steps = [
  { label: 'Business', component: Step1Business },
  { label: 'KYC', component: Step2KYC },
  { label: 'Banking', component: Step3Banking },
  { label: 'Review', component: Step4Review },
];

// DRY: Same stepper logic as customer checkout, just different steps
```

**Step 1: Business Details** (`src/pages/partner/onboarding/Step1Business.tsx`):

```typescript
// Form fields:
const fields = {
  businessName: 'text input',
  businessType: 'select dropdown',
  category: 'select dropdown', // KEY: Determines FSSAI requirement
  address: 'textarea',
  city: 'text',
  state: 'select',
  pincode: 'number',
  phone: 'tel',
  email: 'email (pre-filled from auth.user)',
};

// Validation (Zod schema):
const schema = z.object({
  businessName: z.string().min(3).max(100),
  category: z.enum(['food', 'perishables', 'tech_gifts', 'chocolates', 'personalized', 'premium']),
  pincode: z.string().length(6).regex(/^[1-9][0-9]{5}$/),
  phone: z.string().regex(/^[6-9]\d{9}$/), // Indian mobile
});

// DRY: Reuse Input, Select, Textarea from Shadcn
// Mobile-first: 320px base, labels above inputs (not inline)
```

**Step 2: KYC Documents** (`src/pages/partner/onboarding/Step2KYC.tsx`):

```typescript
// Conditional logic (YOUR KEY QUESTION):
const requiresFSSAI = ['food', 'perishables'].includes(formData.category);

const fields = {
  // Mandatory for ALL
  pan_number: 'text input with format validation',
  pan_document: 'file upload (drag-drop)',
  gst_number: 'text input with format validation',
  
  // Conditional for food category
  ...(requiresFSSAI && {
    fssai_number: 'text input (14 digits)',
    fssai_expiry: 'date picker (must be future)',
    fssai_document: 'file upload',
  }),
};

// File upload: REUSE pattern from customer proof upload
// DRY: Extract FileUploadZone component (drag-drop, preview, remove)

// Validation: Manual for MVP (no IDfy yet)
// Admin reviews documents in approval flow
```

**Step 3: Banking** (`Step3Banking.tsx`):

```typescript
const fields = {
  accountHolderName: 'text (auto-filled from PAN name)',
  accountNumber: 'number (9-18 digits)',
  confirmAccountNumber: 're-enter for validation',
  ifscCode: 'text (11 chars, auto-fetch bank name)',
  accountType: 'radio (Savings / Current)',
};

// IFSC auto-complete: Use public IFSC API
// DRY: Reuse Input, Radio from Shadcn
```

**Step 4: Review & Submit** (`Step4Review.tsx`):

```typescript
// Shows summary of all steps
// Each section editable (click to go back to that step)
// Terms & Conditions checkbox (mandatory)
// [Submit for Approval] button

// On submit:
// 1. Create partner_profiles record with status='pending'
// 2. Upload documents to Supabase Storage
// 3. Send email to admin: "New partner pending approval"
// 4. Navigate to /partner/dashboard (pending state)

// DRY: Reuse Accordion, Checkbox, Button from Shadcn
```

**Estimated Time**: 16-20 hours

---

### Days 6-7: Pending State Dashboard

**Pending State** (`src/pages/partner/Pending.tsx`):

```typescript
// When status='pending', show limited dashboard:
// - Banner: "Your application is under review. We'll notify you within 24-48 hours."
// - Can view: Profile, Support
// - Cannot view: Catalog, Orders, Earnings (show lock icons)
// - [Contact Support] button

// DRY: Reuse Banner, Card, Button from Shadcn
```

**Estimated Time**: 6-8 hours

---

## Phase 3: Partner Dashboard (Days 8-14)

### Day 8-9: Dashboard Home (Post-Approval)

**Home Page** (`src/pages/partner/Home.tsx`):

```typescript
// Stats cards (4-col grid on desktop, 2-col on mobile)
const stats = [
  { label: 'Orders Today', value: '12', icon: ShoppingBag },
  { label: 'Revenue Today', value: '₹24,000', icon: DollarSign },
  { label: 'Products', value: '18', icon: Package },
  { label: 'Rating', value: '4.8★', icon: Star },
];

// Quick actions
const actions = [
  { label: 'Add Product', icon: Plus, path: '/partner/catalog?action=add' },
  { label: 'View Orders', icon: Eye, path: '/partner/orders' },
];

// Recent orders (5 latest, real-time)
// DRY: Reuse Card, Badge from Shadcn
```

**Estimated Time**: 8-10 hours

---

### Day 10-12: Catalog Manager

**Products Page** (`src/pages/partner/Catalog.tsx`):

```typescript
// REUSE DataTable from src/components/ui/data-table.tsx
const columns: ColumnDef<Product>[] = [
  { accessorKey: 'image', cell: ({ row }) => <img src={row.original.image} className="w-12 h-12 rounded" /> },
  { accessorKey: 'name', header: 'Product Name' },
  { accessorKey: 'price', header: 'Price', cell: ({ row }) => `₹${row.original.price / 100}` },
  { accessorKey: 'stock', header: 'Stock' },
  { id: 'actions', cell: ActionsCell },
];

// [+ Add Product] button → Opens bottom sheet
// DRY: Reuse Sheet, DataTable, Button from Shadcn
```

**Add Product Sheet** (`src/components/partner/AddProductSheet.tsx`):

```typescript
const fields = {
  name: 'text input',
  description: 'textarea (3-4 lines)',
  images: 'drag-drop upload (max 5 images)',
  price: 'number input (in ₹)',
  stock: 'number input',
  stockAlertThreshold: 'number input (default 50)',
};

// Image upload to Cloudinary (reuse customer proof upload pattern)
// DRY: Extract ImageUploader component (drag-drop, preview carousel, remove)

// Form validation: React Hook Form + Zod
// Mobile-first: Bottom sheet 80vh on mobile, modal on desktop
```

**Stock Alert** (Critical for MVP):

```typescript
// Real-time listener (add to Dashboard.tsx)
useEffect(() => {
  const channel = supabase
    .channel('stock-alerts')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'partner_products',
      filter: `partner_id=eq.${partnerId}`
    }, (payload) => {
      const product = payload.new;
      if (product.stock < product.stock_alert_threshold) {
        toast({
          title: "Low Stock Alert",
          description: `${product.name}: Only ${product.stock} units left`,
          variant: "destructive"
        });
      }
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}, [partnerId]);
```

**Estimated Time**: 12-16 hours

---

### Day 13-14: Orders Management

**Orders Page** (`src/pages/partner/Orders.tsx`):

```typescript
// Tabs: [New] [Preparing] [Completed]
// Real-time subscription to orders table
// REUSE: Tabs, DataTable, Badge from Shadcn

const columns = [
  { accessorKey: 'id', header: 'Order #' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'items', header: 'Items' },
  { accessorKey: 'total', header: 'Amount' },
  { accessorKey: 'status', header: 'Status', cell: StatusBadge },
  { id: 'actions', cell: ({ row }) => (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => acceptOrder(row.original.id)}>Accept</Button>
      <Button size="sm" variant="outline" onClick={() => rejectOrder(row.original.id)}>Reject</Button>
    </div>
  )},
];

// Accept order: Update order.partner_status = 'accepted'
// Reject order: Open dialog for rejection reason
```

**Estimated Time**: 10-12 hours

---

## Phase 4: Admin Console (Days 15-18)

### Day 15-16: Admin Layout + Partner Approvals

**Admin Layout**: Similar to partner layout, different nav items

**Partner Approvals** (`src/pages/admin/PartnerApprovals.tsx`):

```typescript
// DataTable with pending partners
const columns = [
  { accessorKey: 'business_name', header: 'Business Name' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'submitted_at', header: 'Submitted' },
  { accessorKey: 'status', header: 'KYC Status', cell: KYCStatusBadges },
  { id: 'actions', cell: ({ row }) => (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => viewDetails(row.original.id)}>Review</Button>
    </div>
  )},
];

// Click Review → Opens detail sheet with all KYC documents
// Shows: PAN (image + number), GST, FSSAI (if food), Bank details
// Admin can: [Approve] [Reject] [Request More Info]

// Approve: Update status='approved', send email
// Reject: Require rejection_reason, send email with reason
```

**Estimated Time**: 10-12 hours

---

### Day 17-18: Admin Orders + Polish

**Admin Orders Monitoring**: View all orders across all partners  
**Polish**: Fix any bugs, mobile testing, final UAT

**Estimated Time**: 10-12 hours

---

## DRY Component Reuse Matrix

| Component | Customer UI | Partner UI | Admin UI | Notes |
|-----------|-------------|------------|----------|-------|
| **BottomNav** | ✅ Used | ✅ Reuse (different items) | ✅ Reuse | Extract to shared/BottomNav.tsx with items prop |
| **MobileHeader** | ✅ Used | ✅ Reuse (different logo) | ✅ Reuse | Pass logo prop |
| **ItemCard** | ✅ Used | ❌ Not needed | ❌ Not needed | Customer-specific |
| **Stepper** | ✅ Used | ✅ Reuse (onboarding) | ❌ Not needed | Shared component |
| **DataTable** | ❌ Not used | ✅ Use (products, orders) | ✅ Use (approvals) | Already in ui/ |
| **Sheet** | ✅ Used | ✅ Reuse (add product, order detail) | ✅ Reuse | Shadcn component |
| **Toast** | ✅ Used | ✅ Reuse | ✅ Reuse | Shadcn component |
| **FileUpload** | ✅ Used (proof) | ✅ Reuse (KYC docs) | ❌ Not needed | Extract to shared |
| **ComplianceFooter** | ✅ Used | ✅ Reuse | ✅ Reuse | Same footer everywhere |

**DRY Refactoring** (Day 1 task):

```typescript
// Extract shared BottomNav
// FROM: CustomerBottomNav.tsx
// TO: src/components/shared/BottomNav.tsx

interface BottomNavProps {
  items: NavItem[];
  basePath: string; // '/customer' or '/partner' or '/admin'
}

// Usage:
<BottomNav items={partnerNavItems} basePath="/partner" />
```

---

## Mobile-First Design System

### Breakpoints (Consistent Across All Platforms)

```typescript
const breakpoints = {
  mobile: '320px - 767px',  // Base
  tablet: '768px - 1023px',
  desktop: '1024px+',
};

// Tailwind config (already set):
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px
```

### Component Sizing Standards

```typescript
const designTokens = {
  // Touch targets (mobile-first)
  minTouchTarget: '48px', // Buttons, nav items
  
  // Typography
  heading1: '20px / 1.4 (mobile), 24px / 1.3 (desktop)',
  heading2: '18px / 1.4 (mobile), 20px / 1.4 (desktop)',
  body: '16px / 1.5',
  small: '14px / 1.5',
  tiny: '12px / 1.4',
  
  // Spacing (8px grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  // Bottom sheets
  sheetHeight: {
    mobile: '80vh',
    desktop: '600px',
  },
  
  // Bottom nav
  bottomNavHeight: '56px (h-14)',
  
  // Content padding (account for bottom nav)
  contentPadding: 'pb-20 (80px for nav + safe area)',
};
```

---

## Simplified MVP Feature Set

### ✅ Include in MVP (Core 7 Features)

1. **Partner Auth** (Email+Password only)
2. **4-Step Onboarding** (Business, KYC, Banking, Review)
3. **Approval Flow** (Pending → Approved states)
4. **Dashboard Home** (Stats, quick actions)
5. **Catalog Manager** (Add/edit products, single price)
6. **Orders** (Accept/reject, real-time)
7. **Stock Alerts** (Low stock notifications)

### ❌ Move to Phase 2 (Post-MVP)

1. Bulk Pricing (too complex, start with single price)
2. Dispute Resolution (admin-handled initially)
3. Returns & Refunds (admin-handled initially)
4. Campaign Management (monetization feature)
5. Sponsored Listings (monetization feature)
6. Loyalty Badges (need data first)
7. Referral Program (growth feature)
8. Bulk Operations (nice-to-have)
9. Reviews Management (admin-handled initially)
10. Sourcing Limits (complex business logic)
11. Help Center (email support initially)

**Rationale**: Focus on core workflow (onboarding → catalog → orders). Add advanced features once you have 20-50 active partners and real usage data.

---

## Implementation Timeline

### Week 1: Foundation + Onboarding
- **Day 1**: Database schema + partner auth (8h)
- **Day 2-3**: Partner layout + routing (16h)
- **Day 4-5**: 4-step onboarding (16h)
- **Day 6-7**: Pending state + admin approval UI (16h)

**Deliverable**: Partners can sign up, complete onboarding, await approval

---

### Week 2: Dashboard + Orders
- **Day 8-9**: Dashboard home (stats, quick actions) (16h)
- **Day 10-12**: Catalog manager (DataTable, add/edit products) (20h)
- **Day 13-14**: Orders management (real-time, accept/reject) (16h)

**Deliverable**: Approved partners can manage catalog and orders

---

### Week 3: Admin Console + Polish
- **Day 15-16**: Admin layout + partner approvals (20h)
- **Day 17**: Admin orders monitoring (8h)
- **Day 18**: Testing, bug fixes, UAT (8h)

**Deliverable**: Full partner platform MVP ready

---

**Total**: 144-160 hours (18-20 working days with testing)  
**Calendar**: 3-4 weeks (accounting for meetings, delays)

---

## Key Decisions Answered

### 1. Login/Signup Strategy

| Platform | Method | Why Different | Session |
|----------|--------|---------------|---------|
| **Customer** | Social (Google, Facebook, Apple) | Convenience, quick checkout | 30 days |
| **Partner** | **Email + Password ONLY** | Professional, audit trail, no social for business | 7 days |
| **Admin** | Email + Password + 2FA | Security (approves money), audit log | 4 hours |

**Swiggy/Zomato Comparison**: ✅ Exactly the same - Customer social, Partner email, Admin 2FA

---

### 2. FSSAI Collection Strategy

```typescript
// Step 1: Ask category FIRST
const category = formData.category;

// Step 2: Conditional FSSAI
if (['food', 'perishables', 'beverages'].includes(category)) {
  showFields(['pan', 'gst', 'fssai']); // FSSAI mandatory
  showAlert('FSSAI is mandatory for food category');
} else {
  showFields(['pan', 'gst']); // FSSAI hidden
}

// On submit, validation:
if (category.includes('food') && !fssai_number) {
  throw new Error('FSSAI required for food category');
}
```

**Admin Approval**:
- For food partners: Verify FSSAI expiry date (must be future)
- For non-food: Skip FSSAI check

**Swiggy/Zomato Comparison**: ✅ Exactly the same - conditional based on category, strict enforcement

---

### 3. KYC Integration (MVP vs Production)

**MVP Approach** (Recommended):
- **No IDfy integration** (save ₹10-15 per partner)
- **Manual verification**: Admin reviews PAN/GST documents visually
- **Time**: ~10 minutes per partner (acceptable for <20 partners/month)

**Production Approach** (Phase 2 - when you have 50+ partners/month):
- **IDfy API**: Auto-verify PAN, GST, Aadhaar (2-5 seconds)
- **Cost**: ₹10-15 per partner (worth it at scale)
- **Time**: Instant approval (95% automation)

**When to Switch**: When manual verification takes >2 hours/day

---

## Technical Stack (Reusing 80% from Customer UI)

### Frontend
- **React 18.3.1** (same)
- **React Router 6.30.1** (same)
- **Shadcn UI** (same - reuse all components)
- **Tailwind CSS** (same - reuse design tokens)
- **Supabase JS 2.75.0** (same)

### New Dependencies (Partner-specific)
- None! Everything reuses customer UI stack

### Backend
- **Supabase** (same - just new tables)
- **Supabase Storage** (for KYC document uploads)
- **Supabase Realtime** (for order notifications)

### APIs (Phase 2, not MVP)
- IDfy: PAN/GST verification
- Razorpay: Bank account verification

---

## File Structure

```
src/
├── components/
│   ├── shared/              # NEW - DRY components
│   │   ├── BottomNav.tsx   # Extracted from CustomerBottomNav
│   │   ├── MobileHeader.tsx # Extracted from CustomerMobileHeader
│   │   ├── FileUploader.tsx # Extracted from customer proof
│   │   └── Stepper.tsx     # Moved from customer/shared
│   │
│   ├── partner/             # NEW
│   │   ├── AddProductSheet.tsx
│   │   ├── OrderCard.tsx
│   │   └── StatsCard.tsx
│   │
│   └── admin/               # NEW
│       ├── PartnerDetailSheet.tsx
│       └── KYCReviewCard.tsx
│
├── pages/
│   ├── partner/             # NEW
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Onboarding.tsx
│   │   ├── onboarding/
│   │   │   ├── Step1Business.tsx
│   │   │   ├── Step2KYC.tsx
│   │   │   ├── Step3Banking.tsx
│   │   │   └── Step4Review.tsx
│   │   ├── Dashboard.tsx (layout)
│   │   ├── Home.tsx
│   │   ├── Catalog.tsx
│   │   ├── Orders.tsx
│   │   ├── Earnings.tsx
│   │   └── Profile.tsx
│   │
│   └── admin/               # NEW
│       ├── Login.tsx
│       ├── Dashboard.tsx (layout)
│       ├── PartnerApprovals.tsx
│       └── Orders.tsx
│
└── lib/
    └── integrations/
        └── partner-data.ts  # NEW - Partner CRUD functions
```

**Total New Files**: ~25 files  
**Reused Components**: ~15 from customer UI  
**DRY Ratio**: 60-70% code reuse

---

## Success Criteria

### MVP Launch Checklist

- [ ] Partner can signup with email+password
- [ ] Partner completes 4-step onboarding (conditional FSSAI)
- [ ] Admin reviews KYC documents
- [ ] Admin approves/rejects with reason
- [ ] Approved partner accesses full dashboard
- [ ] Partner adds 5 products with images
- [ ] Customer UI shows partner products
- [ ] Partner receives real-time order notifications
- [ ] Partner accepts/rejects orders
- [ ] Stock alerts work (low stock notifications)
- [ ] All pages mobile-responsive (320px)
- [ ] No console errors
- [ ] Lighthouse score ≥80

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Manual KYC slow at scale | Set SLA (24-48h), hire part-time reviewer, add IDfy when >50/month |
| Partners don't complete onboarding | Save-as-you-go, reminder emails, simplify steps |
| Stock overselling | Real-time stock checks, decrement on order, alerts at threshold |
| Bad actors (fake partners) | Manual KYC review, GST verification, bank verification |
| UI inconsistency across platforms | DRY shared components, design system tokens |

---

## Next Steps

**I recommend starting with**: Partner Authentication + Database Schema (Day 1)

**Ready to proceed?** I can generate:
1. Complete database migration (005_partner_platform.sql)
2. Partner Login/Signup pages (reusing customer pattern)
3. Protected routing with role checks
4. Partner layout with mobile-first bottom nav

**Shall I begin building?** 🚀

