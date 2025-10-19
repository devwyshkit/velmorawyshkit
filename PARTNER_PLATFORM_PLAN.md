# Wyshkit Partner Platform - Comprehensive Plan
## Based on Swiggy/Zomato Best Practices

**Date**: October 19, 2025  
**Approach**: Think like Swiggy, Zomato, IDFC First Bank product teams

---

## 🎯 Executive Summary

**Build Order** (Recommended):
1. **Partner Dashboard First** (7-10 days) - So approved vendors can manage their business
2. **Vendor Onboarding Integrated** (5-7 days) - IDFC-style progressive onboarding
3. **Admin Console Last** (5-7 days) - Internal approval & monitoring tool

**Total Timeline**: 3-4 weeks to full partner platform MVP

---

## 1. How It Should Work (Swiggy/Zomato Pattern)

### The Approval Flow (Exactly like Zomato)

```
┌──────────────┐
│   VENDOR     │ 1. Signup (Email + Password)
│   SIGNUP     │    - Business email required
└──────┬───────┘    - Creates auth account with role='partner'
       │
       ▼
┌──────────────┐
│  ONBOARDING  │ 2. Multi-Step KYC (IDFC First Bank style)
│   (4 STEPS)  │    Step 1: Business Details (name, category, address)
└──────┬───────┘    Step 2: KYC Documents (PAN, GST, FSSAI if food)
       │            Step 3: Banking (account for payouts)
       │            Step 4: Review & Submit
       ▼
┌──────────────┐
│   PENDING    │ 3. Waiting for Admin Approval
│   APPROVAL   │    - Dashboard shows "Pending Review" message
└──────┬───────┘    - Limited access (can't add products yet)
       │            - Can view approval status
       ▼
┌──────────────┐
│    ADMIN     │ 4. Admin Reviews Application
│   REVIEWS    │    - Verifies documents via IDfy
└──────┬───────┘    - Checks business legitimacy
       │            - Approves or Rejects with reason
       ▼
┌──────────────┐
│   APPROVED   │ 5. Full Dashboard Access Granted
│  DASHBOARD   │    - Can add/edit products
└──────────────┘    - Can manage orders
                     - Can view earnings
```

**Key Insight**: This is EXACTLY how Zomato works. New restaurants can't add menu items until admin approves their KYC.

---

## 2. Login/Signup Strategy (Different for Each Platform)

### Customer Login/Signup (Already Built ✅)
**Pattern**: Swiggy/Zomato social-first

```typescript
// Customer UI - Social Login Priority
interface CustomerAuth {
  methods: ['Google OAuth', 'Facebook OAuth', 'Apple Sign In', 'Email+OTP'];
  priority: 'Social first (80% use Google)';
  flow: 'Optional - can browse as guest, required for cart/checkout';
  session: '30 days';
}
```

**Why Different**: Customers want quick access, don't want passwords, social trust

---

### Partner Login/Signup (TO BUILD)
**Pattern**: Swiggy Partner App - Email+Password (business account)

```typescript
// Partner UI - Professional Business Login
interface PartnerAuth {
  methods: ['Email + Password ONLY'];
  priority: 'No social login (business account)';
  flow: 'Required - can\'t access dashboard as guest';
  session: '7 days (shorter for security)';
  verification: 'Email verification mandatory before onboarding';
  passwordPolicy: 'Min 8 chars, uppercase, number, special char';
}
```

**Why Different**:
- Business accounts need audit trail (who did what)
- No social login (imagine "Login with Facebook" for a restaurant - unprofessional)
- Email = business identity (owner's email)
- Stricter password policy (handling money, customer data)

**Swiggy/Zomato Comparison**:
- Swiggy Partner App: Email + Password (no social)
- Zomato Restaurant Dashboard: Email + Password (no social)
- Both require email verification before onboarding

---

### Admin Login (TO BUILD)
**Pattern**: Internal tools - Highest security

```typescript
// Admin UI - Maximum Security
interface AdminAuth {
  methods: ['Email + Password + 2FA (OTP to admin phone)'];
  priority: 'Security over convenience';
  flow: 'Required - no guest access';
  session: '4 hours (expires fast)';
  ipRestriction: 'Optional - whitelist office IPs';
  auditLog: 'Every action logged (who approved what partner)';
}
```

**Why Different**:
- Admins approve money flow (highest risk)
- Need to know WHO did WHAT (audit trail)
- 2FA mandatory (Zomato uses SMS OTP for admin)

---

## 3. Onboarding Flow (IDFC First Bank Style)

### Why IDFC Pattern?
- **Progressive Disclosure**: Don't overwhelm with all fields at once
- **Save-as-you-go**: Can exit and return (Zomato does this)
- **Real-time validation**: Instant feedback (PAN format, GST number)
- **Document upload**: Drag-drop with preview (IDFC signature move)

### Step 1: Business Details (Like Zomato's "Restaurant Info")

```typescript
interface Step1BusinessDetails {
  fields: {
    businessName: string;           // "Sweet Delights"
    businessType: 'sole_proprietor' | 'partnership' | 'private_limited' | 'llp';
    category: 'tech_gifts' | 'chocolates' | 'personalized' | 'food' | 'perishables';
    // ↑ THIS IS KEY - determines what certificates to ask next
    
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
    };
    
    phone: string;                  // Business contact
    email: string;                  // Already from signup, but confirm
    website?: string;               // Optional
    
    operatingHours: {
      monday: { open: '09:00', close: '18:00', closed: false };
      // ... other days
    };
  };
  
  validation: {
    businessName: 'Min 3 chars, no special chars except & . -';
    phone: 'Indian mobile format (+91)';
    pincode: 'Valid Indian pincode (6 digits)';
    email: 'Valid business email (ideally not Gmail/Yahoo)';
  };
  
  ui: {
    layout: 'Single column form, left-aligned labels (IDFC style)';
    saveButton: 'Always visible at bottom, "Save & Continue"';
    autosave: 'Save draft every 30 seconds to local storage';
    exitModal: 'Warn if unsaved changes, offer "Save Draft"';
  };
}
```

**Key Decision**: Category selection determines NEXT steps:
- If `category === 'food' || 'perishables'` → Step 2 asks for FSSAI
- If `category === 'tech_gifts'` → Step 2 skips FSSAI, only asks PAN/GST

---

### Step 2: KYC Documents (Conditional based on category)

```typescript
interface Step2KYCDocuments {
  mandatoryForAll: {
    panCard: {
      number: string;                // 'ABCDE1234F' format
      name: string;                  // Name on PAN (must match business)
      document: File;                // Upload PAN image
      verification: 'IDfy API call'; // Real-time verification
    };
    
    gstNumber: {
      number: string;                // 15-digit GST
      state: string;                 // GST state code
      verification: 'IDfy API + Government GST Portal';
    };
    
    ownerAadhaar: {
      number: string;                // Masked (xxxx-xxxx-1234)
      verification: 'IDfy eKYC (OTP to Aadhaar mobile)';
      consent: 'Checkbox: "I authorize Wyshkit to verify Aadhaar"';
    };
  };
  
  conditionalDocuments: {
    fssaiLicense: {
      required: 'IF category === "food" OR "perishables"';
      number: string;                // 14-digit FSSAI
      expiryDate: Date;              // Must be future date
      document: File;                // Upload FSSAI certificate
      verification: 'Manual admin review (no API available)';
    };
    
    drugLicense: {
      required: 'IF category === "health_supplements"';
      // Similar structure
    };
  };
  
  implementation: {
    idfyIntegration: {
      api: 'IDfy (https://idfy.com)';
      services: ['PAN Verification', 'GST Verification', 'Aadhaar eKYC'];
      cost: '₹10-15 per verification';
      response: 'Instant (< 5 seconds)';
      fallback: 'If API fails, mark for manual admin review';
    };
  };
}
```

**Why IDfy?**
- **Industry Standard**: Used by Swiggy, Zomato, PhonePe, Paytm
- **Government-authorized**: Legally valid KYC
- **Fast**: 2-5 second response
- **Comprehensive**: PAN, Aadhaar, GST, Driving License, Voter ID
- **Compliance**: PMLA/KYC compliant (important for payments)

**Alternatives** (if IDfy too expensive for MVP):
1. **DigiLocker API** (Government, free but complex setup)
2. **Manual Verification** (admin reviews documents, slower but zero cost)
3. **Hybrid**: Manual for MVP, IDfy when you have revenue

**Recommendation**: Start with **manual verification** for MVP (save ₹10-15 per partner), add IDfy in Phase 2 when you have 50+ partners signing up daily.

---

### Step 3: Banking Details

```typescript
interface Step3Banking {
  fields: {
    accountHolderName: string;     // Must match PAN name
    accountNumber: string;         // 9-18 digits
    ifscCode: string;              // 11 chars (HDFC0001234)
    bankName: string;              // Auto-populated from IFSC
    branchName: string;            // Auto-populated from IFSC
    accountType: 'savings' | 'current';
    
    // For verification (Razorpay's fund account method)
    pennyDrop: {
      method: 'Razorpay Fund Account Validation';
      cost: '₹3 per verification';
      process: 'Deposit ₹1, verify name match, refund';
    };
  };
  
  validation: {
    accountNumber: 'Numeric, 9-18 digits';
    ifscCode: 'Valid IFSC format, check against RBI database';
    nameMatch: 'Account holder name ~80% match with PAN name (fuzzy)';
  };
  
  security: {
    encryption: 'Encrypt account number at rest (AES-256)';
    access: 'Only admin + partner can view full account number';
    display: 'Show masked (xxxx-xxxx-1234) in UI';
  };
}
```

**Key Insight**: Zomato/Swiggy verify bank accounts before first payout to prevent fraud. Use Razorpay's penny drop for ₹3/verification.

---

### Step 4: Review & Submit

```typescript
interface Step4Review {
  display: {
    sections: [
      { title: 'Business Details', editable: true, fields: ['name', 'address', ...] },
      { title: 'KYC Documents', editable: true, fields: ['PAN', 'GST', ...] },
      { title: 'Banking', editable: true, fields: ['Account', 'IFSC', ...] },
    ];
    editButton: 'Go back to step to edit (Zomato pattern)';
  };
  
  terms: {
    checkbox: 'I agree to Wyshkit Partner Terms & Conditions';
    link: '/partner-terms' (opens in new tab);
    required: true;
  };
  
  submit: {
    button: 'Submit for Approval';
    action: 'Create partner_profiles record with status="pending"';
    navigation: 'Redirect to /partner/dashboard (pending state)';
    notification: 'Email: "Your application is under review (24-48 hours)"';
  };
}
```

---

## 4. Partner Dashboard (Post-Approval)

### Dashboard States

```typescript
// State 1: Pending Approval
interface PendingState {
  access: {
    canView: ['dashboard_home', 'profile', 'support'];
    cannotView: ['catalog', 'orders', 'earnings'];
  };
  
  ui: {
    banner: {
      message: 'Your application is under review. You\'ll be notified within 24-48 hours.';
      icon: 'clock';
      color: 'yellow';
    };
    
    disabledSections: [
      { name: 'Catalog Manager', reason: 'Available after approval', icon: 'lock' },
      { name: 'Orders', reason: 'Available after approval', icon: 'lock' },
      { name: 'Earnings', reason: 'Available after approval', icon: 'lock' },
    ];
  };
}

// State 2: Approved
interface ApprovedState {
  access: {
    canView: ['dashboard_home', 'catalog', 'orders', 'earnings', 'profile', 'support'];
  };
  
  ui: {
    banner: {
      message: 'Welcome! Your account is active. Start adding products to your catalog.';
      icon: 'check_circle';
      color: 'green';
      dismissible: true;
    };
  };
}

// State 3: Rejected (rare, but handle it)
interface RejectedState {
  access: {
    canView: ['dashboard_home', 'profile'];
  };
  
  ui: {
    banner: {
      message: 'Your application was not approved. Reason: {admin_reason}. You can resubmit after fixing issues.';
      icon: 'error';
      color: 'red';
    };
    
    resubmitButton: 'Fix & Resubmit Application';
  };
}
```

---

### Dashboard Pages (Swiggy/Zomato Pattern)

#### 1. Home/Overview (First page after login)

```
┌─────────────────────────────────────────────┐
│ ┌──────┐  Welcome back, Sweet Delights!    │
│ │ Logo │  Your business is doing great 🎉  │
│ └──────┘                                    │
├─────────────────────────────────────────────┤
│ TODAY'S STATS                               │
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐  │
│ │  12   │ │  8    │ │₹24K   │ │ 4.6★  │  │
│ │Orders │ │Active │ │Revenue│ │Rating │  │
│ └───────┘ └───────┘ └───────┘ └───────┘  │
├─────────────────────────────────────────────┤
│ QUICK ACTIONS                               │
│ [+ Add Product]  [View Orders]  [Support]  │
├─────────────────────────────────────────────┤
│ PENDING ORDERS (Real-time)                  │
│ #12345 - Premium Hamper - ₹2,499 [Accept]  │
│ #12346 - Chocolate Box - ₹1,299  [Accept]  │
└─────────────────────────────────────────────┘
```

**Key Features**:
- Real-time order alerts (Supabase realtime subscriptions)
- Quick stats (today only, not historical)
- One-click actions (Zomato's 95% acceptance pattern)

---

#### 2. Catalog Manager (Like Zomato's Menu Manager)

```
┌─────────────────────────────────────────────┐
│ CATALOG MANAGER               [+ Add Item]  │
├─────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐   │
│ │ [Search items...]          [Filters] │   │
│ └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ DATA TABLE                                  │
│ ┌────┬───────────┬───────┬──────┬────────┐│
│ │Img │Name       │Price  │Stock │Actions ││
│ ├────┼───────────┼───────┼──────┼────────┤│
│ │📷  │Chocolate  │₹1,299 │ 50   │✏️ 🗑️  ││
│ │    │Box        │       │      │        ││
│ ├────┼───────────┼───────┼──────┼────────┤│
│ │📷  │Premium    │₹2,499 │ 30   │✏️ 🗑️  ││
│ │    │Hamper     │       │      │        ││
│ └────┴───────────┴───────┴──────┴────────┘│
└─────────────────────────────────────────────┘
```

**Features**:
- Drag-drop image upload (reuse from Amazon, no reshooting)
- In-line edit (click price to edit, save automatically)
- Bulk actions (select multiple, change price/stock)
- Stock toggle (mark out of stock temporarily)

---

#### 3. Orders (Real-time)

```
┌─────────────────────────────────────────────┐
│ ORDERS                                      │
│ [New]  [Preparing]  [Ready]  [Completed]   │ ← Tabs
├─────────────────────────────────────────────┤
│ NEW ORDERS (Auto-refresh every 10s)         │
│ ┌─────────────────────────────────────────┐│
│ │ #12345 - 2 mins ago                     ││
│ │ Premium Hamper x1 - ₹2,499              ││
│ │ Customer: Prateek K. | Bangalore        ││
│ │ [ACCEPT ORDER]  [REJECT]   [View Details│││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**Key Features**:
- Tabs by status (Swiggy pattern)
- Sound alert for new orders (optional)
- Countdown timer (accept within 5 minutes or auto-reject)
- Reject reasons dropdown (Out of stock, Address issue, etc.)

---

#### 4. Earnings

```
┌─────────────────────────────────────────────┐
│ EARNINGS                                    │
│ ┌───────────────┐ ┌──────────────────────┐ │
│ │ THIS WEEK     │ │ PENDING PAYOUT       │ │
│ │ ₹45,000       │ │ ₹12,000 (Oct 25)     │ │
│ └───────────────┘ └──────────────────────┘ │
├─────────────────────────────────────────────┤
│ TRANSACTION HISTORY                         │
│ Date       | Order ID | Amount | Commission││
│ Oct 19     | #12345   | ₹2,499 | -₹375 (15%││
│ Oct 18     | #12344   | ₹1,299 | -₹195      │
└─────────────────────────────────────────────┘
```

**Key Features**:
- Weekly payouts (Zomato/Swiggy standard)
- Commission transparency (show 15% deduction)
- Download invoice (PDF for GST filing)

---

## 5. Admin Console

### Admin Dashboard (Internal Tool)

```
┌─────────────────────────────────────────────┐
│ ADMIN CONSOLE                               │
│ [Partner Approvals]  [Orders]  [Analytics]  │
├─────────────────────────────────────────────┤
│ PENDING PARTNER APPROVALS (7)               │
│ ┌─────────────────────────────────────────┐│
│ │ Sweet Delights - Chocolates - Bangalore ││
│ │ Submitted: 2 hours ago                  ││
│ │ KYC Status: ✅ PAN ✅ GST ⏳ FSSAI      ││
│ │ [VIEW DETAILS]  [APPROVE]  [REJECT]     ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

**Admin Review Checklist** (per partner):
1. Business name Google search (is it real?)
2. PAN verification (IDfy green check)
3. GST verification (IDfy green check)
4. FSSAI verification (if food) - manual check expiry date
5. Bank account verification (Razorpay penny drop)
6. Address verification (Google Maps - does it exist?)

**Approval Actions**:
- **Approve**: Partner gets email "You're approved! Start adding products"
- **Reject**: Email with reason, allow resubmission
- **Request More Info**: Email asking for clarification (document unclear, etc.)

---

## 6. Certificate Collection Strategy (YOUR QUESTION)

### When to Collect FSSAI (and other certificates)?

**Best Practice** (Zomato/Swiggy approach):

```typescript
interface CertificateStrategy {
  timing: 'DURING ONBOARDING (Step 2 - KYC)';
  
  conditionalLogic: {
    step1_category: 'Ask category first',
    step2_certificates: 'Show relevant fields based on category',
  };
  
  certificateRules: {
    FSSAI: {
      required: ['Food', 'Perishables', 'Beverages', 'Health Supplements'];
      optional: ['Gift Hampers containing food'];
      notRequired: ['Tech Gifts', 'Personalized Items', 'Non-food'];
      validation: {
        format: '14-digit number',
        expiry: 'Must be > 30 days from now',
        type: 'Basic (< ₹12L revenue) or State/Central (> ₹12L)',
      };
    };
    
    DrugLicense: {
      required: ['Health Supplements', 'Ayurvedic Products'];
      validation: 'Manual admin review (no API)';
    };
    
    GSTRegistration: {
      required: 'ALL partners (mandatory for B2B)';
      reason: 'We issue invoices, need their GST for ITC';
    };
    
    ShopEstablishmentAct: {
      required: 'ALL partners with physical stores';
      optional: 'Home-based businesses';
    };
    
    MSME_Udyam: {
      required: false;
      benefit: 'If provided, show "MSME Certified" badge (trust signal)';
    };
  };
}
```

### UI Flow for Conditional Certificates

```typescript
// Step 1: Category Selection
if (category === 'Food' || category === 'Perishables') {
  // Step 2 shows:
  mandatoryFields = ['PAN', 'GST', 'FSSAI'];
  
  ui.showAlert({
    message: 'Since you deal with food items, FSSAI license is mandatory.',
    link: 'How to get FSSAI? (Guide)',
    type: 'info',
  });
  
} else if (category === 'Tech Gifts') {
  // Step 2 shows:
  mandatoryFields = ['PAN', 'GST'];
  
  ui.hideFields(['FSSAI', 'DrugLicense']);
}
```

**Why This Approach?**
- **User-Friendly**: Don't ask for FSSAI if they're selling tech gifts (irrelevant)
- **Legal Compliance**: Collect FSSAI before letting them sell food (you're liable otherwise)
- **Swiggy/Zomato Standard**: Both collect FSSAI during onboarding, not after

---

### What if Partner Doesn't Have FSSAI?

```typescript
interface FSSAIFallback {
  scenario: 'Partner wants to sell chocolates but no FSSAI';
  
  zomatoApproach: {
    action: 'Reject application with reason';
    email: 'Your application is on hold. FSSAI is mandatory for food items. Apply here: [link]';
    allowResubmit: true;
    timeframe: 'Resubmit once you have FSSAI (can take 7-60 days to get)';
  };
  
  alternativeApproach: {
    // If you want to be more lenient (NOT recommended for food)
    action: 'Approve with limited catalog';
    restriction: 'Can add non-food items only';
    upgrade: 'Once FSSAI provided, unlock food category';
    risk: 'HIGH - if partner sneaks in food items, you\'re liable';
  };
  
  recommendation: 'Use Zomato approach - FSSAI mandatory for food, no exceptions';
}
```

**Key Insight**: Zomato/Swiggy are STRICT about FSSAI because:
1. **Legal Liability**: If partner sells unsafe food, platform is liable
2. **Customer Trust**: FSSAI badge shown to customers (trust signal)
3. **Insurance**: Food delivery insurance requires FSSAI

---

## 7. Technical Implementation Summary

### Database Schema

```sql
-- Partners table (extends auth.users)
CREATE TABLE partner_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  rejection_reason TEXT,
  
  -- KYC
  pan_number TEXT,
  pan_verified BOOLEAN DEFAULT false,
  gst_number TEXT,
  gst_verified BOOLEAN DEFAULT false,
  fssai_number TEXT,              -- NULL if not food
  fssai_expiry DATE,
  
  -- Banking
  bank_account_number TEXT,       -- Encrypted
  bank_ifsc TEXT,
  bank_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE partner_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partner_profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,         -- in paise
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  images TEXT[],                  -- Array of image URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table (already exists for customers, add partner_id)
ALTER TABLE orders ADD COLUMN partner_id UUID REFERENCES partner_profiles(id);
ALTER TABLE orders ADD COLUMN partner_status TEXT DEFAULT 'pending'; -- 'pending' | 'accepted' | 'preparing' | 'ready'
```

---

### API Integrations

```typescript
// 1. IDfy for KYC (Phase 2, use manual for MVP)
const idfyConfig = {
  panVerification: {
    endpoint: 'https://eve.idfy.com/v3/tasks/sync/ind_pan',
    cost: '₹10 per verification',
    response: { status: 'success', name_on_pan: 'Sweet Delights Pvt Ltd' },
  },
  
  gstVerification: {
    endpoint: 'https://eve.idfy.com/v3/tasks/sync/ind_gst',
    cost: '₹12 per verification',
    response: { status: 'active', business_name: 'Sweet Delights' },
  },
};

// 2. Razorpay for bank verification
const razorpayBankVerification = {
  method: 'Fund Account Validation',
  endpoint: 'https://api.razorpay.com/v1/fund_accounts/validations',
  cost: '₹3 per verification',
  process: {
    1: 'Create fund account with partner bank details',
    2: 'Razorpay deposits ₹1 to verify account',
    3: 'Check if name matches (fuzzy match ~80%)',
    4: 'Return success/failure',
  },
};

// 3. Supabase Realtime for orders
const supabaseRealtime = {
  subscribe: 'orders table WHERE partner_id = current_partner',
  event: 'INSERT',
  action: 'Show notification + play sound',
  ui: 'Update "New Orders" count in real-time',
};
```

---

## 8. Build Timeline & Phases

### Phase 1: Partner Dashboard (7-10 days)

**Week 1: Core Pages**
- Day 1-2: Partner Layout (sidebar, header, routing)
- Day 3-4: Home/Overview page (stats, quick actions)
- Day 5-6: Catalog Manager (DataTable, CRUD for products)
- Day 7-8: Orders page (tabs, real-time, accept/reject)
- Day 9-10: Earnings page (transactions, download invoice)

**Deliverable**: Approved partners can manage their business

---

### Phase 2: Vendor Onboarding (5-7 days)

**Week 2: Onboarding Flow**
- Day 1-2: Signup page (Email + Password, email verification)
- Day 3: Step 1 - Business Details form
- Day 4: Step 2 - KYC Documents (conditional logic)
- Day 5: Step 3 - Banking Details
- Day 6: Step 4 - Review & Submit
- Day 7: Pending state dashboard (waiting for approval)

**Deliverable**: New vendors can complete onboarding

---

### Phase 3: Admin Console (5-7 days)

**Week 3: Admin Tools**
- Day 1-2: Admin layout + partner approvals page
- Day 3-4: Partner detail view (review KYC, approve/reject)
- Day 5: Orders monitoring (all partners)
- Day 6: Analytics dashboard (GMV, top partners)
- Day 7: Payout management (mark as paid)

**Deliverable**: Admins can approve partners & monitor platform

---

## 9. MVP vs Full Build (What to Skip for V1)

### Skip for MVP (Add in Phase 2)

1. **IDfy Integration** → Start with manual KYC review (saves ₹10-15 per partner)
2. **Bank Verification** → Trust partners initially, add Razorpay validation later
3. **2FA for Admin** → Add when you have multiple admins
4. **Analytics Dashboard** → Build when you have 50+ partners (data worth analyzing)
5. **Bulk Actions** → Catalog bulk edit, bulk order status change
6. **Partner Analytics** → Show partner their own metrics (views, conversion)

### Must Have for MVP

1. ✅ **Approval Flow** - Core to prevent bad actors
2. ✅ **Catalog Manager** - Partners need to list products
3. ✅ **Order Management** - Accept/reject orders
4. ✅ **Earnings Visibility** - Transparency (show commission)
5. ✅ **Conditional FSSAI** - Legal compliance for food

---

## 10. Risk Mitigation

### Security Risks

1. **Fake Partners**: Mitigated by KYC (PAN, GST) + admin approval
2. **Bank Account Fraud**: Mitigated by penny drop verification (Phase 2)
3. **Tax Evasion**: Mitigated by mandatory GST collection
4. **Unsafe Food**: Mitigated by FSSAI requirement for food category

### Operational Risks

1. **Too Many Pending Approvals**: Set SLA (approve within 24-48 hours)
2. **Admin Bottleneck**: Build queue, prioritize by submitted date
3. **Partner Disputes**: Build support ticket system (Phase 2)

---

## 11. Final Recommendation

### Build Order: ✅ PARTNER DASHBOARD FIRST

**Why?**
1. Approved partners can start working immediately
2. You can manually approve 5-10 test partners via SQL
3. Validate the business model (do partners actually want this?)
4. Customer UI is already done, partners need a way to list products

### Then: VENDOR ONBOARDING

Once dashboard is proven, add onboarding so new partners can self-signup.

### Finally: ADMIN CONSOLE

Build internal tools last (you can manually approve via SQL initially).

---

## 12. Questions Answered

| Your Question | Answer |
|--------------|--------|
| Build vendor onboarding or partner first? | **Partner Dashboard first**, onboarding second |
| Approval before dashboard access? | **YES**, exactly like Zomato (pending → approved → access) |
| KYC API recommendation? | **IDfy** for production, **Manual** for MVP (save costs) |
| Login different for each platform? | **YES** - Customer: Social, Partner: Email+Password, Admin: Email+2FA |
| When to collect FSSAI? | **During onboarding (Step 2)**, conditional on category |
| Need FSSAI for non-food? | **NO**, only for food/perishables (ask category first) |

---

## Ready to Build?

**Next Steps**:
1. Review this plan
2. Clarify any doubts
3. I'll create detailed implementation plan with code
4. Start building Partner Dashboard (Week 1)

Let me know if this aligns with your vision! 🚀

