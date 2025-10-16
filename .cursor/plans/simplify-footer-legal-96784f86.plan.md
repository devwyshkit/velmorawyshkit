<!-- 96784f86-c5c3-440c-9c8b-8cb6a57249f5 ae2ba4ad-c9fa-42c2-8d82-4ae925263f7a -->
# World-Class Product Audit - Wyshkit Customer UI

## CRITICAL ISSUES IDENTIFIED

---

### 🔴 ISSUE 1: Terminology Confusion - Basket vs Cart

**Problem**: Inconsistent terminology across the entire application

**Current State**:

- ✅ File: `BasketSheet.tsx` - uses "Basket", "My Basket", "basket is empty"
- ✅ Function: `getGuestBasket()`, `setGuestBasket()` - uses "Basket"
- ❌ Navigation: `CustomerBottomNav.tsx` - label says "Cart"
- ❌ Header: `CustomerMobileHeader.tsx` - uses ShoppingBag icon for "Cart"
- ❌ Route: `/customer/cart` - URL uses "cart"
- ❌ Toast: ItemSheetContent says "Added to basket"

**Industry Research**:

- Amazon: "Cart" ✓
- Flipkart: "Cart" ✓
- Swiggy: "Cart" ✓
- Zomato: "Cart" ✓
- **Industry Standard: CART (not Basket)**

**Impact**: Confuses users, looks unprofessional, inconsistent UX

**Solution**: Pick ONE term and use it everywhere

- **Recommendation**: Use "CART" (industry standard, shorter, more universal)

**Files to Update**:

1. `BasketSheet.tsx` → Rename to `CartSheet.tsx`
2. All "Basket" references → "Cart"
3. `getGuestBasket()` → `getGuestCart()`
4. `setGuestBasket()` → `setGuestCart()`
5. All toasts/messages

---

### 🔴 ISSUE 2: Dead Links & Missing Pages

**Problem**: Navigation leads to non-existent pages

**Dead Links Found**:

1. `/customer/cart` → Placeholder "Coming Soon"
2. `/customer/wishlist` → Placeholder "Coming Soon"
3. `/customer/orders` → 404 (Profile links here)
4. `/customer/addresses` → 404 (Profile links here)
5. `/customer/settings` → 404 (Profile links here)
6. `/customer/help` → 404 (Profile links here)
7. `/customer/checkout` → Not in routes (BasketSheet navigates here)
8. `/customer/items/:id` → Not in routes (Search navigates here)

**Impact**: Broken user experience, looks unfinished

**Solution Options**:

- A) Build all missing pages (time-intensive)
- B) Remove dead links temporarily
- C) Add "Coming Soon" state to all

**Recommended**: Build critical pages (Cart, Wishlist), disable non-critical links

---

### 🔴 ISSUE 3: Incomplete User Flow

**Problem**: User flow breaks at multiple points

**Your Spec Flow**: Home → Partner → Item Sheet → Basket Sheet → Checkout Sheet → Confirmation → Track

**Current Reality**:

1. ✅ Home → Partner ✓
2. ✅ Partner → Item Sheet ✓
3. ❌ Item Sheet → Opens BasketSheet? NO (just toasts)
4. ❌ BasketSheet → How to open? NO trigger button
5. ❌ BasketSheet → Checkout Sheet? NO (navigates to `/customer/checkout` which doesn't exist)
6. ✅ Confirmation ✓
7. ✅ Track ✓
8. ✅ Profile ✓

**Missing**:

- Cart/Basket page (full screen alternative to sheet)
- Checkout page/sheet routing
- Way to open BasketSheet from anywhere
- Floating cart indicator with item count

**Impact**: Users can add items but can't see cart or checkout

---

### 🔴 ISSUE 4: Button States & Non-Working Interactions

**Problem**: Several buttons don't do anything

**Non-Working Buttons**:

1. Location button in header (line 41-47 CustomerMobileHeader) → `onClick={() => {}}` (empty)
2. ShoppingBag icon in header → Goes to `/customer/cart` (placeholder page)
3. Heart icon in header → Goes to `/customer/wishlist` (placeholder page)
4. Bottom nav Cart → Goes to placeholder
5. Bottom nav Wishlist → Goes to placeholder

**Impact**: User clicks expecting action, nothing happens

---

### 🔴 ISSUE 5: Missing Components from Spec

**Your Spec Requirements Not Implemented**:

1. **Smart Filters** (Command chips):

   - Spec: Command chips with gap-2
   - Current: Not implemented anywhere
   - Location: Should be on Home and Partner pages

2. **Floating Cart Badge**:

   - Spec: Cart icon should show item count
   - Current: Plain icon, no badge
   - Location: Header and bottom nav

3. **Guest Mode Login Prompt**:

   - Spec: Overlay sheet prompting login when guest tries checkout
   - Current: Just navigates to /login with toast
   - Impact: Jarring experience

4. **Error States**:

   - Spec: Snackbar for "Out of stock"
   - Current: No error handling
   - Impact: Silent failures

---

### ⚠️ ISSUE 6: Route Inconsistencies

**Problem**: Routes don't match component expectations

**Route Gaps**:

```typescript
// App.tsx defines:
/customer/cart → Placeholder
/customer/wishlist → Placeholder
/customer/confirmation → ✓
/customer/track/:orderId? → ✓
/customer/profile → ✓

// Missing routes used by components:
/customer/checkout → Used by BasketSheet
/customer/items/:id → Used by Search
/customer/orders → Used by Profile
/customer/addresses → Used by Profile
/customer/settings → Used by Profile
/customer/help → Used by Profile
```

**Impact**: 404 errors when users navigate

---

### ⚠️ ISSUE 7: Accessibility Issues

**Problems Found**:

1. **Location button** has no aria-label (CustomerMobileHeader:41)
2. **Cart count badge** missing (no screen reader info)
3. **Sheet grabbers** are decorative divs (not interactive, no keyboard support)
4. **Search input** in header missing autocomplete attributes
5. **Dark mode toggle** in Profile missing aria-live for state change

---

### ⚠️ ISSUE 8: Data Flow Issues

**Problems**:

1. **BasketSheet loads mock data even when authenticated** (lines 56-72):
   ```typescript
   } else {
     // Load from Supabase
     // Implementation would go here
     const mockItems: BasketItem[] = [  // ← Still using mocks!
   ```

2. **CheckoutSheet** doesn't exist as route but BasketSheet navigates to it

3. **Guest basket** saves to localStorage but authenticated users use mocks

4. **No real Supabase queries** anywhere (all mock data)

---

## 📋 RECOMMENDED ACTION PLAN

### Phase 1: Fix Terminology (High Priority - 30 mins)

1. Rename `BasketSheet.tsx` → `CartSheet.tsx`
2. Rename all "Basket" → "Cart" across codebase
3. Update localStorage keys: `guestBasket` → `guestCart`
4. Update all functions: `getGuestBasket()` → `getGuestCart()`

### Phase 2: Fix Navigation (High Priority - 1 hour)

1. Create actual Cart page (`/customer/cart`) - full screen alternative
2. Create actual Wishlist page (`/customer/wishlist`)
3. Add CheckoutSheet to proper route or make it a page
4. Remove dead links from Profile (Orders, Addresses, Settings, Help) → "Coming Soon" states
5. Add floating cart button with badge to open CartSheet

### Phase 3: Complete User Flow (Medium Priority - 2 hours)

1. Add "View Cart" button after adding item
2. Add CartSheet open trigger (floating button or header icon click)
3. Fix Checkout flow (sheet or page)
4. Add item count badges on cart icons
5. Implement proper guest→login prompt overlay

### Phase 4: Polish (Low Priority - 1 hour)

1. Add accessibility attributes
2. Add loading states
3. Add error states
4. Fix non-working buttons (location picker, etc.)
5. Add Smart Filters (if time)

---

## 🎯 WORLD-CLASS STANDARDS CHECKLIST

Based on Swiggy/Zomato/Amazon patterns:

✅ **Terminology**:

- [ ] Use "Cart" consistently (not "Basket")
- [ ] Use "Orders" not "Order History"
- [ ] Use "Account" or "Profile" (pick one)

✅ **Navigation**:

- [ ] No dead links
- [ ] All nav items functional
- [ ] Proper back navigation
- [ ] Consistent routing

✅ **User Flow**:

- [ ] Add to cart → View cart → Checkout (seamless)
- [ ] Guest mode → Login prompt at right time
- [ ] Error handling at every step
- [ ] Loading states

✅ **Visual Feedback**:

- [ ] Cart badge shows count
- [ ] Toast on every action
- [ ] Disabled states for unavailable features
- [ ] Loading spinners

✅ **Accessibility**:

- [ ] All interactive elements have labels
- [ ] Keyboard navigation works
- [ ] Screen reader support
- [ ] Color contrast WCAG AA

---

## DECISION REQUIRED

**Before proceeding, choose:**

1. **Terminology**: Cart or Basket?

   - a) Cart (recommended - industry standard)
   - b) Basket (current mixed usage)

2. **Missing Pages Priority**:

   - a) Build Cart + Wishlist + Checkout only
   - b) Build all pages from spec
   - c) Add "Coming Soon" states, build later

3. **Checkout Implementation**:

   - a) Bottom sheet (mobile-first, your spec)
   - b) Full page (traditional)
   - c) Both (sheet on mobile, page on desktop)

**My Recommendation**: 1a, 2a, 3a (world-class mobile-first approach)

### To-dos

- [ ] Setup customer UI infrastructure (theme, utilities, integrations)
- [ ] Create shared components (ItemCard, Stepper, BottomSheet wrapper)
- [ ] Build Login & Signup pages with Supabase auth and guest mode
- [ ] Build Home page (discovery with carousel, occasions, partners)
- [ ] Build Partner page (browse items)
- [ ] Build Item Sheet (bottom sheet with details/add)
- [ ] Build Basket Sheet (review cart)
- [ ] Build Checkout Sheet (payment flow)
- [ ] Build Confirmation, Proof Sheet, Track, and Profile pages
- [ ] Add bottom navigation and compliance footer