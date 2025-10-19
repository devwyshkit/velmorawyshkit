# Partner Platform MVP - Final Plan with Branding/Customization

**Date**: October 19, 2025  
**Approach**: Option A (MVP), DRY, Mobile-First, Battle-Tested (Swiggy/Zomato patterns)  
**Timeline**: 2 weeks  
**Branding Strategy**: Proven gifting platform approach (NO reinvention)

---

## ✅ BRANDING/CUSTOMIZATION AUDIT

### What Customer UI Already Has ✅

**Found in codebase**:
1. ✅ `isCustomizable` field (Item interface) - marks products supporting customization
2. ✅ `add_ons` array - Greeting Card, Gift Wrapping, Express Delivery
3. ✅ Add-ons UI - Checkboxes with price calculation
4. ✅ ProofSheet.tsx - For custom order approval workflow

**This is EXACTLY Swiggy/Zomato pattern**:
- Swiggy: Add-ons (Extra cheese +₹20, No onion, etc.)
- Zomato: Customizations (Spice level, Cooking preference)
- Wyshkit: Add-ons (Greeting card, Gift wrapping, Branding)

---

### What's Missing (Partner Side) ❌

**Partners can't**:
1. ❌ Define their own add-on options (currently hardcoded in customer UI)
2. ❌ Set MOQ for custom orders (e.g., engraving needs 50+ units)
3. ❌ Mark products as "Supports Branding"
4. ❌ Set custom pricing for branding (e.g., Logo +₹200)

---

## 🎯 Branding/Customization - Swiggy/Zomato Proven Pattern

### How It Works (Food Delivery → Gifting Adaptation)

#### Swiggy/Zomato Pattern:
```
Restaurant sets: "Extra Cheese" add-on (+₹20)
Customer selects: ✅ Extra Cheese
Order sent to restaurant WITH instructions
Restaurant prepares WITH modification
Customer receives customized food
```

#### Wyshkit Pattern (SAME STRUCTURE):
```
Partner sets: "Company Logo Engraving" add-on (+₹200, MOQ: 50 units)
Customer selects: ✅ Company Logo (if qty ≥ 50)
Customer uploads: Logo file (PNG/SVG)
Order sent to partner WITH branding instructions
Partner reviews proof → Approves → Produces WITH logo
Customer receives branded product
```

**Key Insight**: It's the SAME pattern! Add-ons with conditional availability (MOQ) and proof approval for complex customizations.

---

### Partner Dashboard - Add-Ons Configuration

**Where**: ProductForm.tsx (Add/Edit Product sheet)

**UI**:
```
┌─────────────────────────────────────────┐
│ ADD PRODUCT                             │
├─────────────────────────────────────────┤
│ Name: [Premium Corporate Hamper]        │
│ Price: [₹2,499]                         │
│ Stock: [100]                            │
│                                         │
│ ☑ Supports Customization                │ ← Toggle
│                                         │
│ ADD-ONS (Optional)                      │ ← Accordion
│ ┌─────────────────────────────────────┐│
│ │ Add-on 1:                           ││
│ │ Name: [Company Logo Engraving]      ││
│ │ Price: [+₹200]                      ││
│ │ MOQ: [50] units                     ││ ← Min quantity for this add-on
│ │ Proof Required: ✅                   ││ ← Customer uploads logo before production
│ │ [Remove]                            ││
│ ┌─────────────────────────────────────┐│
│ │ Add-on 2:                           ││
│ │ Name: [Gift Wrapping]               ││
│ │ Price: [+₹149]                      ││
│ │ MOQ: [1] unit                       ││
│ │ Proof Required: ☐                   ││
│ │ [Remove]                            ││
│ └─────────────────────────────────────┘│
│ [+ Add Another Add-on] (max 5)         │
├─────────────────────────────────────────┤
│ [Save Product]                          │
└─────────────────────────────────────────┘
```

**Database Schema**:
```typescript
// products.add_ons - JSONB array
type AddOn = {
  id: string;
  name: string;
  price: number;
  moq: number;              // Minimum order quantity (1 for greeting card, 50 for engraving)
  requiresProof: boolean;   // If true, customer must upload files
  description?: string;     // "Upload your company logo (PNG/SVG, max 5MB)"
};

// Example:
products.add_ons = [
  { id: '1', name: 'Company Logo Engraving', price: 200, moq: 50, requiresProof: true, description: 'Upload logo PNG/SVG' },
  { id: '2', name: 'Gift Wrapping', price: 149, moq: 1, requiresProof: false },
  { id: '3', name: 'Greeting Card', price: 99, moq: 1, requiresProof: false }
];
```

**Customer UI Integration**:
```typescript
// ItemSheet.tsx - Show add-ons conditionally
{item.add_ons?.map(addOn => (
  <div key={addOn.id}>
    <Checkbox
      id={addOn.id}
      checked={selectedAddOns.includes(addOn.id)}
      onCheckedChange={() => toggleAddOn(addOn.id)}
      disabled={quantity < addOn.moq}  // ← Disable if MOQ not met
    />
    <Label htmlFor={addOn.id}>
      {addOn.name} (+₹{addOn.price})
      {quantity < addOn.moq && (
        <span className="text-xs text-muted-foreground"> (Min {addOn.moq} units)</span>
      )}
    </Label>
    
    {/* If proof required and selected, show upload */}
    {addOn.requiresProof && selectedAddOns.includes(addOn.id) && (
      <div className="mt-2">
        <Label>Upload {addOn.description || 'your design'}</Label>
        <Input type="file" accept=".png,.svg,.jpg" />
      </div>
    )}
  </div>
))}
```

**This is PROVEN**: Swiggy uses same conditional logic for add-ons (e.g., "Extra topping" only for pizza)

---

## 🏗 FINAL MVP BUILD PLAN (2 Weeks)

### Week 1: Partner Dashboard (5 Pages + Branding)

#### Day 1: Layout + Auth
**Files**:
- `partner/Login.tsx` - Email+Password only
- `partner/Signup.tsx` - Email+Password only
- `components/partner/PartnerLayout.tsx` - Sidebar + BottomNav
- `components/shared/MobileBottomNav.tsx` - **DRY** extracted component

**Reuse**: Form, Input, Button (100% from customer)

---

#### Day 2: Dashboard Home
**Files**:
- `partner/Home.tsx` - Stats + Quick Actions
- `components/shared/StatsCard.tsx` - **DRY** metrics component

**Stats to Show**:
- Today's orders
- This week's revenue
- Your rating
- Active products

**Reuse**: Card, Badge (100%)

---

#### Day 3-4: Products Page **+ Branding/Add-ons** ✅

**Files**:
- `partner/Products.tsx` - DataTable list
- `partner/ProductForm.tsx` - Add/Edit sheet **WITH ADD-ONS CONFIG**
- `components/shared/ImageUploader.tsx` - **DRY** upload component

**ProductForm Features** (Swiggy/Zomato proven):
1. Basic fields: Name, Description, Price, Stock, Images
2. **Customization Toggle**: ☑ Supports Customization
3. **Add-ons Configuration** (NEW!):
   - Dynamic add-on list (max 5)
   - Each add-on has:
     - Name (e.g., "Logo Engraving")
     - Price (+₹200)
     - MOQ (50 units)
     - Requires Proof (✅/☐)
   - [+ Add Another] button
   - Example add-ons:
     - Greeting Card (+₹99, MOQ: 1, No proof)
     - Gift Wrapping (+₹149, MOQ: 1, No proof)
     - Company Logo (+₹200, MOQ: 50, Requires proof)
     - Custom Message Embossing (+₹150, MOQ: 20, Requires proof)

**Database**:
```sql
-- Add to products table
ALTER TABLE partner_products ADD COLUMN add_ons JSONB DEFAULT '[]';
ALTER TABLE partner_products ADD COLUMN is_customizable BOOLEAN DEFAULT false;
```

**Reuse**: DataTable (100%), Sheet (100%), Form components (100%)

**This is BATTLE-TESTED**: Zomato uses same UI for restaurant add-ons configuration

---

#### Day 5: Orders Page
**Files**:
- `partner/Orders.tsx` - Real-time list with tabs
- `partner/OrderDetail.tsx` - Order sheet WITH proof approval

**Order Detail Features**:
- Customer info, items, total
- **If custom order**: Show "Proof Approval" section
  - Customer uploaded logo/design
  - Preview images
  - [Approve Proof] [Request Changes] buttons
- Accept/Reject buttons
- Status updates (Preparing → Ready → Shipped)

**Reuse**: DataTable, Sheet, Tabs (100%)

---

#### Day 6: Earnings + Profile
**Files**:
- `partner/Earnings.tsx` - Transactions table
- `partner/Profile.tsx` - Edit business details

**Reuse**: DataTable, Form (100%)

---

### Week 2: Onboarding + Admin + Customer UI Updates

#### Day 8-10: Onboarding (3 Days)

**4-Step Wizard**:
1. Business Details (name, category, address)
2. KYC Documents (**Conditional FSSAI** ✅)
   - If category = Food → FSSAI mandatory
   - If category = Tech → FSSAI hidden
3. Banking (account, IFSC)
4. Review & Submit

**Manual KYC**: Admin reviews documents (no IDfy for MVP)

**Reuse**: Form, Input, Button, Alert (100%)

---

#### Day 11-12: Admin Console (2 Days)

**Files**:
- `admin/PartnerApprovals.tsx` - Approval queue
- `admin/ApprovalDetail.tsx` - Review KYC sheet

**Features**:
- DataTable with pending partners
- Review documents (PAN, GST, FSSAI)
- [Approve] [Reject with reason] buttons

**Reuse**: DataTable, Sheet (100%)

---

#### Day 13: Customer UI Updates (1 Day)

**Changes** (2 hours):
1. Filter only `approved` partners (3 files)
2. Show add-ons from partner configuration (dynamic, not hardcoded)
3. Enforce MOQ for add-ons (disable if qty < moq)
4. Upload proof for add-ons that require it

---

## 🎨 BRANDING COMPARISON: Swiggy/Zomato vs Wyshkit

### Swiggy/Zomato (Food Delivery)

```typescript
// Restaurant configures add-ons
restaurant.addOns = [
  { name: 'Extra Cheese', price: 20, moq: 1 },
  { name: 'No Onion', price: 0, moq: 1 },
  { name: 'Extra Spicy', price: 0, moq: 1 }
];

// Customer selects add-ons
order.customizations = ['Extra Cheese', 'No Onion'];

// Restaurant receives order WITH instructions
// No proof needed (simple modifications)
```

---

### Wyshkit (Gifting Platform) - SAME PATTERN ✅

```typescript
// Partner configures add-ons
product.add_ons = [
  { name: 'Greeting Card', price: 99, moq: 1, requiresProof: false },
  { name: 'Gift Wrapping', price: 149, moq: 1, requiresProof: false },
  { name: 'Company Logo Engraving', price: 200, moq: 50, requiresProof: true },
  { name: 'Custom Gift Message', price: 50, moq: 1, requiresProof: false }
];

// Customer selects add-ons (if qty meets MOQ)
if (quantity >= 50) {
  order.customizations = ['Company Logo'];
  order.proofFiles = ['logo.png']; // Upload for partner review
}

// Partner receives order WITH branding instructions
// Reviews proof → Approves → Produces
```

**Differences from Food**:
1. **MOQ**: Gifting has minimum quantities for branding (food doesn't)
2. **Proof Approval**: Gifting needs visual confirmation (food doesn't)
3. **Lead Time**: Custom orders take longer (food is real-time)

**Same Pattern**: Add-ons configured by vendor, selected by customer, passed to fulfillment ✅

---

## 🔧 What I'll Build (MVP with Branding)

### Phase 1: Core Dashboard (Week 1)

**Day 1**: Auth (Login, Signup)  
**Day 2**: Dashboard Home (Stats)  
**Day 3-4**: Products Page **WITH ADD-ONS BUILDER** ✅  
**Day 5**: Orders Page **WITH PROOF APPROVAL** ✅  
**Day 6**: Earnings + Profile  

---

### Day 3-4 Detail: Products with Add-ons (PROVEN PATTERN)

**ProductForm.tsx** - Add/Edit Product Sheet:

```typescript
// Section 1: Basic Info
<FormField name="name" label="Product Name" />
<FormField name="description" label="Description" />
<FormField name="price" label="Retail Price" />
<FormField name="stock" label="Stock Quantity" />
<ImageUploader multiple max={5} />  // Reuse from shared

// Section 2: Customization (Accordion)
<Accordion>
  <AccordionItem value="customization">
    <AccordionTrigger>🎨 Customization & Add-ons</AccordionTrigger>
    <AccordionContent>
      <Switch
        checked={isCustomizable}
        onCheckedChange={setIsCustomizable}
        label="Supports Customization"
      />
      
      {isCustomizable && (
        <>
          <Label>Add-on Options (Like Swiggy's "Extra Cheese")</Label>
          {addOns.map((addon, index) => (
            <Card key={index} className="p-4">
              <Input
                placeholder="Add-on name (e.g., Logo Engraving)"
                value={addon.name}
                onChange={(e) => updateAddOn(index, 'name', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Price (+₹)"
                value={addon.price}
                onChange={(e) => updateAddOn(index, 'price', Number(e.target.value))}
              />
              <Input
                type="number"
                placeholder="Min quantity required"
                value={addon.moq}
                onChange={(e) => updateAddOn(index, 'moq', Number(e.target.value))}
              />
              <Checkbox
                checked={addon.requiresProof}
                onCheckedChange={(checked) => updateAddOn(index, 'requiresProof', checked)}
                label="Requires customer to upload design/logo"
              />
              <Button variant="ghost" size="sm" onClick={() => removeAddOn(index)}>
                Remove
              </Button>
            </Card>
          ))}
          
          <Button onClick={addNewAddOn} disabled={addOns.length >= 5}>
            + Add Another Add-on
          </Button>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Like Swiggy's "Extra Cheese", add-ons let customers personalize their order.
              Set MOQ for bulk customization (e.g., 50 units for logo engraving).
            </AlertDescription>
          </Alert>
        </>
      )}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Schema** (Saved to products.add_ons JSONB):
```json
{
  "add_ons": [
    {
      "id": "addon-1",
      "name": "Company Logo Engraving",
      "price": 200,
      "moq": 50,
      "requiresProof": true,
      "description": "Upload your logo (PNG/SVG, max 5MB)"
    },
    {
      "id": "addon-2",
      "name": "Gift Wrapping",
      "price": 149,
      "moq": 1,
      "requiresProof": false
    }
  ],
  "is_customizable": true
}
```

**This is Swiggy/Zomato EXACT pattern**: Restaurant sets add-ons, customer picks, order fulfills with customization.

---

### Day 5 Detail: Orders with Proof Approval

**OrderDetail.tsx** - Order Detail Sheet:

```typescript
// If order has custom add-ons with proof required:
{order.items.some(item => item.addOns?.some(a => a.requiresProof)) && (
  <Card>
    <CardHeader>
      <CardTitle>🎨 Proof Approval Required</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">
        Customer uploaded logo/design files for review.
      </p>
      
      {/* Show customer uploads */}
      <Carousel>
        {order.proofFiles.map(file => (
          <CarouselItem key={file}>
            <img src={file} alt="Customer upload" className="w-full h-auto" />
          </CarouselItem>
        ))}
      </Carousel>
      
      {/* Approval actions */}
      <div className="flex gap-2 mt-4">
        <Button onClick={() => approveProof(order.id)}>
          ✅ Approve & Start Production
        </Button>
        <Button variant="outline" onClick={() => requestChanges(order.id)}>
          ✏️ Request Changes
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

**Workflow** (Swiggy/Zomato proven):
1. Customer places order WITH add-ons
2. If add-on requires proof → Customer uploads files
3. Partner reviews proof in Orders page
4. Partner approves → Production starts
5. Partner ships → Customer receives

**This is PROVEN in**: Zomato Gold (custom cake messages), Swiggy Genie (package photos)

---

## 📋 COMPLETE MVP FEATURE LIST

### Core Features (Must Have):
1. ✅ Partner Authentication (Email+Password)
2. ✅ Dashboard Home (Stats, Quick Actions)
3. ✅ Products CRUD **WITH ADD-ONS BUILDER** ✅ (Swiggy pattern)
4. ✅ Orders Management **WITH PROOF APPROVAL** ✅ (Zomato pattern)
5. ✅ Earnings View (Transactions, Commission)
6. ✅ Profile Edit (Business details)
7. ✅ Onboarding (4 steps, conditional FSSAI)
8. ✅ Admin Approvals (Review KYC, Approve/Reject)
9. ✅ Customer UI Updates (Filter approved, dynamic add-ons)

### Branding/Customization (Included in MVP):
10. ✅ Add-ons configuration in ProductForm
11. ✅ MOQ enforcement in customer UI
12. ✅ Proof upload for complex customization
13. ✅ Proof approval workflow in OrderDetail

**No Reinvention**: Using exact Swiggy/Zomato add-ons pattern ✅  
**No Over-engineering**: Simple JSONB field, proven UI ✅  
**Battle-tested**: Food delivery add-ons → Gifting add-ons (same logic) ✅

---

## 🚀 TIMELINE (With Branding Included)

**Week 1**:
- Day 1: Auth (4 hours)
- Day 2: Dashboard Home (6 hours)
- Day 3: Products List (6 hours)
- Day 4: ProductForm **+ Add-ons Builder** (8 hours) ← **Branding feature**
- Day 5: Orders **+ Proof Approval** (8 hours) ← **Branding feature**
- Day 6: Earnings + Profile (6 hours)

**Week 2**:
- Day 8-10: Onboarding (conditional FSSAI)
- Day 11-12: Admin approvals
- Day 13: Customer UI updates (dynamic add-ons)

**Total**: **10 days = 2 weeks** (branding included, no extra time!)

---

## ✅ FINAL VALIDATION

### Your Requirements Checklist:

- [x] **Branding/Customization like Swiggy/Zomato** ✅
  - Add-ons configuration (partner side)
  - MOQ enforcement (customer side)
  - Proof approval (order workflow)
  
- [x] **No Unnecessary Reinvention** ✅
  - Using exact Swiggy add-ons pattern
  - Proof approval like Zomato custom cakes
  - JSONB for flexibility (battle-tested)

- [x] **No Over-engineering** ✅
  - Simple JSONB field (not separate tables)
  - Reusing customer UI components (DRY)
  - Manual KYC for MVP (not IDfy)

- [x] **Proven, Battle-Tested** ✅
  - Swiggy: 10 years of add-ons UI
  - Zomato: 15 years of customization
  - Wyshkit: Same pattern, gifting context

---

## 📊 COMPARISON: Branding in Different Platforms

| Platform | Customization Type | MOQ | Proof | Example |
|----------|-------------------|-----|-------|---------|
| **Swiggy** | Food add-ons | No | No | Extra cheese, No onion |
| **Zomato** | Cooking preferences | No | No | Spice level, Jain food |
| **Zomato Gold** | Custom cakes | Yes (1kg+) | Yes | Cake message, photo print |
| **Wyshkit** | Gifting add-ons | Yes (1-50) | Yes (for logos) | Engraving, Gift wrap |

**Pattern**: Wyshkit follows **Zomato Gold** (premium customization) not basic Swiggy (simple add-ons) ✅

---

## 🎯 READY TO BUILD?

**What I'll Build** (2 weeks, branding included):

**Week 1**: Partner Dashboard
1. Auth (Login/Signup)
2. Dashboard Home (Stats)
3. Products CRUD **+ Add-ons Configuration** (Swiggy pattern)
4. Orders Management **+ Proof Approval** (Zomato Gold pattern)
5. Earnings & Profile

**Week 2**: Onboarding + Admin
6. 4-step onboarding (**conditional FSSAI**)
7. Admin approvals (manual KYC review)
8. Customer UI updates (dynamic add-ons, MOQ enforcement)

**Branding Features Included**:
- ✅ Partner sets add-ons (name, price, MOQ, proof required)
- ✅ Customer sees add-ons (conditional on MOQ)
- ✅ Customer uploads proof (logo, design)
- ✅ Partner reviews & approves proof
- ✅ Production starts after approval

**No Reinvention**: Using proven Swiggy/Zomato patterns ✅  
**No Over-engineering**: Simple, focused, battle-tested ✅

---

**Confirm to proceed with this plan?** 🚀

