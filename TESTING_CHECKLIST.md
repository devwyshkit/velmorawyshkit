# 🧪 Wyshkit Testing Checklist

## ✅ Completed Verification
- [x] Code builds successfully
- [x] No linter errors
- [x] Database table consistency (all use `store_items`)
- [x] Personalizations format consistency
- [x] Dark mode removed from partner/admin
- [x] Animations removed

---

## 🎯 Priority 1: Core Partner Portal Workflows

### 1. Partner Login Flow
- [ ] **Test Store ID + Mobile OTP:**
  - Enter valid Store ID (e.g., "gift-masters")
  - Enter valid mobile number
  - Verify OTP is sent
  - Enter correct OTP
  - Verify redirect to `/partner/dashboard`

- [ ] **Test Google OAuth:**
  - Click "Continue with Google"
  - Complete Google authentication
  - Verify redirect to `/partner/dashboard`
  - Verify role is 'seller' or 'partner'

- [ ] **Test Error Cases:**
  - Invalid Store ID (should show error)
  - Invalid mobile number (should show validation error)
  - Wrong OTP (should show error)
  - Store ID that doesn't belong to user (should fail after OTP)

### 2. Product Creation Flow
- [ ] **Create Simple Product:**
  - Navigate to `/partner/dashboard/products/create`
  - Fill basic fields (name, description, price, category)
  - Upload images
  - Set stock quantity
  - Submit
  - Verify product appears in products list with `status: 'pending'`

- [ ] **Create Customizable Product:**
  - Enable "Allow Customization"
  - Add personalization option:
    - Label: "Company Logo"
    - Price: ₹200
    - Instructions: "Upload PNG/SVG"
    - ✅ Check "Requires file upload & preview"
  - Submit
  - Verify `personalizations` array is saved correctly
  - Verify `requiresPreview: true` is set

- [ ] **Test Made-to-Order:**
  - Enable "Made-to-Order"
  - Verify stock quantity field is hidden/disabled
  - Submit
  - Verify `stock_quantity: null` in database

### 3. Products List & Management
- [ ] **View Products:**
  - Navigate to `/partner/dashboard/products`
  - Verify products load from `store_items` table
  - Verify products show correct status (Approved/Pending/Rejected)
  - Verify personalizations are displayed correctly

- [ ] **Delete Product:**
  - Click delete on a product
  - Confirm deletion
  - Verify product is removed from list
  - Verify deletion uses `store_items` table with `store_id` check

### 4. Orders Management
- [ ] **View Orders:**
  - Navigate to `/partner/dashboard/orders`
  - Verify orders load correctly
  - Click on order to open bottom sheet (mobile) or side panel (desktop)

- [ ] **Proof Approval (Fiverr Pattern):**
  - Find order with `requiresPreview: true` personalization
  - Verify "Proof Approval" section is visible
  - Upload/approve proof
  - Verify status updates correctly

---

## 🎯 Priority 2: Admin Panel Workflows

### 1. Admin Login
- [ ] **Email/Password Login:**
  - Navigate to `/admin/login`
  - Enter admin credentials
  - Verify redirect to `/admin/dashboard`
  - Verify no dark mode classes

### 2. Product Approvals
- [ ] **View Pending Products:**
  - Navigate to `/admin/product-approvals`
  - Verify products with `status: 'pending'` from `store_items` load correctly
  - Verify partner name is displayed (from `stores → partner_profiles`)

- [ ] **Approve Single Product:**
  - Click "Approve" on a pending product
  - Verify `store_items.status` updates to `'approved'`
  - Verify product disappears from pending list
  - Verify product appears in partner's approved products list

- [ ] **Bulk Approve:**
  - Select multiple products
  - Click "Bulk Approve"
  - Verify all selected products get `status: 'approved'`
  - Verify toast notification shows correct count

- [ ] **Reject Product:**
  - Click "Reject" on a product
  - Enter rejection reason
  - Verify `store_items.status` updates to `'rejected'`
  - Verify `rejection_reason` is saved

---

## 🎯 Priority 3: Customer UI Integration

### 1. Product Display
- [ ] **View Product with Personalizations:**
  - Navigate to a product created by partner
  - Verify product loads from `store_items` where `status: 'approved'`
  - Verify personalizations section shows:
    - Label (e.g., "Company Logo")
    - Price (+₹200)
    - Instructions (if provided)
    - Checkbox to select

- [ ] **Test requiresPreview Flag:**
  - Select personalization with `requiresPreview: true`
  - Verify "File upload required after payment" notice appears
  - Verify no dark mode classes in notice

### 2. Cart & Checkout
- [ ] **Add to Cart with Personalizations:**
  - Add product with personalization to cart
  - Verify personalization is included in cart item
  - Verify price calculation includes personalization

### 3. Preview Workflow (Fiverr Pattern)
- [ ] **Order with Preview Required:**
  - Create order with product that has `requiresPreview: true`
  - Complete payment
  - Verify order shows "Preview Pending" status
  - Upload design files
  - Partner receives notification
  - Partner approves/rejects preview
  - Customer sees approval status

---

## 🎯 Priority 4: Database Verification

### 1. Table Structure
- [ ] **Verify store_items schema:**
  - `id`, `store_id`, `name`, `description`, `price`, `status`, `personalizations` (JSONB)
  - `personalizations` array contains: `{ id, label, price, instructions?, requiresPreview? }`
  - `status` values: `'pending'`, `'approved'`, `'rejected'`, `'changes_requested'`

### 2. Data Consistency
- [ ] **Verify Product Creation:**
  ```sql
  SELECT * FROM store_items 
  WHERE store_id = 'test-store-id' 
  ORDER BY created_at DESC LIMIT 1;
  ```
  - Verify `personalizations` JSON matches form input
  - Verify `status = 'pending'`
  - Verify `requiresPreview` boolean in personalizations

- [ ] **Verify Admin Approval:**
  ```sql
  SELECT status, approved_by, approved_at 
  FROM store_items 
  WHERE id = 'approved-product-id';
  ```
  - Verify `status = 'approved'`
  - Verify `approved_by` is admin user ID
  - Verify `approved_at` timestamp exists

### 3. Query Performance
- [ ] **Test Partner Products List:**
  - Load `/partner/dashboard/products`
  - Check network tab for query time
  - Verify query filters by `store_id` correctly

- [ ] **Test Admin Pending List:**
  - Load `/admin/product-approvals`
  - Verify query uses `status IN ('pending', 'changes_requested')`
  - Verify join to `stores` and `partner_profiles` works

---

## 🎯 Priority 5: UI/UX Verification

### 1. Mobile Responsiveness
- [ ] **Partner Portal Mobile:**
  - Test on mobile viewport (< 768px)
  - Verify bottom navigation appears
  - Verify order details open as bottom sheet
  - Verify product creation form is mobile-friendly

- [ ] **Admin Panel Desktop:**
  - Test on desktop viewport (> 768px)
  - Verify sidebar navigation
  - Verify product approvals table layout

### 2. Visual Consistency
- [ ] **No Dark Mode:**
  - Check partner portal: No `dark:` classes
  - Check admin panel: No `dark:` classes
  - Verify light theme only

- [ ] **No Animations:**
  - Verify no `animate-` classes
  - Verify no `Loader2` spinning animations
  - Verify only simple text loading states

### 3. Swiggy 2025 Patterns
- [ ] **Login Pattern:**
  - Store ID field first (not email)
  - Mobile OTP as primary method
  - Google OAuth as secondary

- [ ] **Product Creation:**
  - Single-page form (not wizard)
  - Simple, vendor-defined fields
  - No unnecessary complexity

---

## 🎯 Priority 6: Edge Cases & Error Handling

### 1. Error Scenarios
- [ ] **Network Errors:**
  - Disconnect network during product creation
  - Verify error message appears
  - Verify form state is preserved

- [ ] **Validation Errors:**
  - Submit product form with missing required fields
  - Verify field-level error messages
  - Verify form doesn't submit

- [ ] **Permission Errors:**
  - Try to access admin panel as partner
  - Verify redirect to `/unauthorized`
  - Verify correct role-based access

### 2. Data Edge Cases
- [ ] **Empty States:**
  - Partner with no products
  - Admin with no pending approvals
  - Verify appropriate empty state messages

- [ ] **Large Data:**
  - Product with 10+ personalizations
  - Verify form handles gracefully
  - Verify UI doesn't break

---

## 🎯 Priority 7: Integration Testing

### 1. End-to-End Workflow
- [ ] **Complete Product Lifecycle:**
  1. Partner creates product → `store_items` with `status: 'pending'`
  2. Admin approves → `status: 'approved'`
  3. Customer views product → Shows in search/catalog
  4. Customer adds to cart → Personalizations included
  5. Customer orders → Order created
  6. Partner sees order → Can approve proof (if `requiresPreview: true`)

### 2. Multi-User Scenarios
- [ ] **Concurrent Approvals:**
  - Two admins approve different products simultaneously
  - Verify no race conditions
  - Verify correct approval tracking

---

## 📊 Testing Tools & Commands

### Run Dev Server
```bash
npm run dev
```

### Run Build
```bash
npm run build
```

### Check Linter
```bash
npm run lint  # If configured
```

### Database Queries (Supabase)
```sql
-- Check pending products
SELECT id, name, status, store_id 
FROM store_items 
WHERE status = 'pending';

-- Check personalizations structure
SELECT id, name, personalizations 
FROM store_items 
WHERE personalizations IS NOT NULL 
LIMIT 1;

-- Verify admin approvals
SELECT id, name, status, approved_by, approved_at 
FROM store_items 
WHERE status = 'approved' 
ORDER BY approved_at DESC 
LIMIT 10;
```

---

## 🚀 Quick Test Checklist (15 min)

If short on time, test these critical paths:

1. ✅ Partner login (Store ID + OTP)
2. ✅ Create product with personalization (`requiresPreview: true`)
3. ✅ Admin approves product
4. ✅ Product appears in customer UI
5. ✅ Customer can select personalization
6. ✅ Order workflow (if time permits)

---

## 📝 Test Results Template

```
Date: __________
Tester: __________

✅ Passed:
- 

❌ Failed:
- 

⚠️ Issues Found:
- 

🔧 Notes:
- 
```

---

## 🎯 Next Steps After Testing

1. **Fix Critical Bugs:** Any blocking issues found
2. **Performance Optimization:** If queries are slow
3. **UI Refinements:** Based on testing feedback
4. **Documentation:** Update API docs if needed
5. **Production Readiness:** Final checks before deploy

