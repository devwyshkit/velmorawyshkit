# Wyshkit Customer UI - User Acceptance Testing Checklist

**Version**: 1.0.0  
**Date**: October 19, 2025  
**Staging URL**: [To be filled after deployment]  
**Test Duration**: 2-3 hours (comprehensive)

---

## Overview

This checklist ensures the customer UI is ready for production by testing all critical user flows, fixed issues, and edge cases. Complete all sections before go-live.

### Testing Approach
- ✅ **Manual Testing**: All scenarios tested by human QA
- 📱 **Device Testing**: Mobile (iPhone/Android), tablet, desktop
- 🌐 **Browser Testing**: Chrome, Safari, Firefox, Edge
- 🔍 **Accessibility Testing**: Screen reader, keyboard navigation

---

## Pre-Test Setup

### Tester Information
- **Tester Name**: _______________
- **Test Date**: _______________
- **Browser**: _______________
- **Device**: _______________
- **Screen Size**: _______________

### Test Environment
- [ ] Staging URL accessible
- [ ] Test account created (if needed)
- [ ] Browser developer tools open (for console errors)
- [ ] Lighthouse extension installed (for performance)

---

## Section 1: Core Navigation & Pages

### 1.1 Homepage (`/customer/home`)

**Test Steps**:
1. Navigate to staging URL
2. Wait for page to fully load
3. Scroll through entire page

**Verification**:
- [ ] Page loads within 3 seconds
- [ ] Wyshkit logo displays in header
- [ ] Location shows "Bangalore" (or user's location)
- [ ] Hero carousel auto-plays (3 slides)
- [ ] All 8 occasion cards visible (Birthday, Anniversary, etc.)
- [ ] Price filters visible (Under ₹500, etc.)
- [ ] 6 partner cards display with images, ratings, categories
- [ ] Bottom navigation visible on mobile (<768px)
- [ ] Footer displays company info, contact, social links
- [ ] No console errors

**Screenshot**: 📸 Take screenshot of full homepage

---

### 1.2 Search Page (`/customer/search`)

**Test Steps**:
1. Click search icon in header
2. Type "chocolate" in search box
3. Wait for results

**Verification**:
- [ ] Search page loads
- [ ] Search input auto-focuses
- [ ] "Trending" searches visible initially
- [ ] Debounced search works (results after 300ms)
- [ ] Results show items + partners
- [ ] Partner cards hide price (no ₹0)
- [ ] Item cards show correct prices
- [ ] Clicking result navigates correctly
- [ ] Back button returns to previous page

**Screenshot**: 📸 Search results for "chocolate"

---

### 1.3 Partner Page (`/customer/partners/:id`)

**Test Steps**:
1. From homepage, click any partner card
2. Scroll through partner page

**Verification**:
- [ ] Partner page loads within 2 seconds
- [ ] Partner hero image/info displays
- [ ] Rating and delivery time visible
- [ ] "Menu" section shows items in grid
- [ ] Item cards have images, names, prices, ratings
- [ ] Clicking item opens item sheet
- [ ] "About" section shows description
- [ ] "Location" section shows address/map (if available)
- [ ] No layout shifts during load

**Screenshot**: 📸 Partner page view

---

### 1.4 Item Details Sheet (`/customer/items/:id`)

**Test Steps**:
1. From partner page, click any item
2. View item sheet (bottom drawer on mobile)

**Verification**:
- [ ] Sheet slides up smoothly (mobile)
- [ ] Item image carousel works (swipe/arrows)
- [ ] Price displays correctly (₹1,299 format)
- [ ] Rating and count visible (e.g., ★ 4.8 (234))
- [ ] Description readable (3-4 lines)
- [ ] Quantity stepper works (-/+)
- [ ] Add to Cart button prominent
- [ ] Customization options visible (if any)
- [ ] Specifications accordion expands
- [ ] Back/X button closes sheet

**Screenshot**: 📸 Item sheet open

---

### 1.5 Cart Page (`/customer/cart`)

**Test Steps**:
1. Add 2-3 items to cart
2. Navigate to cart page
3. Modify quantities

**Verification**:
- [ ] Cart badge shows count (header icon)
- [ ] Cart page lists all added items
- [ ] Each item shows image, name, price, quantity
- [ ] Quantity can be updated
- [ ] Remove item works
- [ ] Subtotal calculates correctly
- [ ] Tax (18% GST) calculates correctly
- [ ] "Proceed to Checkout" button visible
- [ ] Empty cart shows "No items" message

**Screenshot**: 📸 Cart with multiple items

---

### 1.6 Checkout Page (`/customer/checkout`)

**Test Steps**:
1. From cart, click "Proceed to Checkout"
2. Fill delivery form
3. Select payment method

**Verification**:
- [ ] Checkout page loads
- [ ] Order summary visible (items, subtotal, tax, total)
- [ ] Delivery address form present
- [ ] Form validation works (required fields)
- [ ] Payment method selection (COD/Online)
- [ ] "Place Order" button enabled after form complete
- [ ] Back button returns to cart

**Screenshot**: 📸 Checkout form

---

## Section 2: Critical Fixes Verification

### 2.1 Issue #1: Occasion Cards → 404 ✅ FIXED

**Test Steps**:
1. Go to homepage
2. Click "Birthday" occasion card
3. Verify URL and page load

**Verification**:
- [ ] **Before Fix**: Navigated to `/customer/occasions/1` (404)
- [ ] **After Fix**: Navigates to `/customer/search?occasion=birthday`
- [ ] Search page loads with "birthday" in search box
- [ ] Results show birthday-related items/partners
- [ ] No 404 error

**Repeat for all 8 occasion cards**:
- [ ] Birthday → `/customer/search?occasion=birthday`
- [ ] Anniversary → `/customer/search?occasion=anniversary`
- [ ] Wedding → `/customer/search?occasion=wedding`
- [ ] Corporate → `/customer/search?occasion=corporate`
- [ ] Festival → `/customer/search?occasion=festival`
- [ ] Graduation → `/customer/search?occasion=graduation`
- [ ] Baby Shower → `/customer/search?occasion=baby shower`
- [ ] Farewell → `/customer/search?occasion=farewell`

**Screenshot**: 📸 Occasion card click → Search page

---

### 2.2 Issue #2: Price Filters Visual Only ✅ FIXED

**Test Steps**:
1. Go to homepage
2. Note visible partners (should be 6)
3. Click "Under ₹500" filter
4. Observe changes

**Verification**:
- [ ] **Before Fix**: Filter showed active state, no filtering
- [ ] **After Fix**: Partners filtered by category
- [ ] "Under ₹500": Shows only Chocolates, Food & Beverage (2 partners)
- [ ] "₹500-₹1000": Shows Personalized, Chocolates
- [ ] "₹1000-₹2500": Shows Tech Gifts, Gourmet
- [ ] "Above ₹2500": Shows Premium, Tech Gifts
- [ ] Active filter badge shows "Active: Under ₹500"
- [ ] "Clear all" button appears and works

**Test all 4 price filters**:
- [ ] Under ₹500 → 2 partners (Sweet Delights, Gourmet Treats)
- [ ] ₹500-₹1000 → Personalized + Chocolates partners
- [ ] ₹1000-₹2500 → Tech Gifts + Gourmet partners
- [ ] Above ₹2500 → Premium + Tech Gifts partners

**Screenshot**: 📸 Price filter active + filtered results

---

### 2.3 Issue #3: "View All" → 404 ✅ FIXED

**Test Steps**:
1. Go to homepage
2. Scroll to "Partners near you" section
3. Click "View All" button

**Verification**:
- [ ] **Before Fix**: Navigated to `/customer/partners` (404)
- [ ] **After Fix**: Navigates to `/customer/search?view=partners`
- [ ] Search page loads successfully
- [ ] No 404 error
- [ ] Search input present (can type to filter)

**Screenshot**: 📸 "View All" → Search page

---

### 2.4 Issue #4: Partner Shows ₹0 ✅ FIXED

**Test Steps**:
1. Go to search page
2. Search "chocolate"
3. Check partner cards in results

**Verification**:
- [ ] **Before Fix**: Partner "Sweet Delights" showed "₹0"
- [ ] **After Fix**: Partners show NO price (only rating)
- [ ] Item cards show correct prices (₹2,499, ₹1,299, etc.)
- [ ] Partner cards show only: image, name, description, rating
- [ ] No ₹0 displayed anywhere

**Screenshot**: 📸 Search results with partner (no price shown)

---

## Section 3: Responsive Design

### 3.1 Mobile (375px - 767px)

**Test Device**: iPhone 13 Pro / Android equivalent

**Verification**:
- [ ] Bottom navigation visible (5 tabs)
- [ ] Header compact (logo + location + icons)
- [ ] Hero carousel full-width swipe
- [ ] Occasion cards horizontal scroll
- [ ] Partner grid 2 columns
- [ ] Item sheet slides from bottom
- [ ] Tap targets ≥48px (buttons, links)
- [ ] Text readable without zoom (≥16px)
- [ ] No horizontal scroll
- [ ] Footer stacks vertically

**Screenshot**: 📸 Mobile homepage

---

### 3.2 Tablet (768px - 1023px)

**Test Device**: iPad / Android tablet

**Verification**:
- [ ] Bottom nav hidden, top nav visible
- [ ] Hero carousel 50% width
- [ ] Partner grid 3 columns
- [ ] Item sheet slides from right
- [ ] Filters visible in horizontal scroll
- [ ] Footer 2-column layout

**Screenshot**: 📸 Tablet homepage

---

### 3.3 Desktop (1024px+)

**Test Device**: Laptop/Desktop browser

**Verification**:
- [ ] Max width 1280px (centered)
- [ ] Full navigation in header
- [ ] Hero carousel 33% width
- [ ] Partner grid 4 columns
- [ ] Item details in modal/sheet (right side)
- [ ] Footer 4-column layout
- [ ] Hover states work (cards, buttons)

**Screenshot**: 📸 Desktop homepage

---

## Section 4: User Flows

### 4.1 Browse → Add to Cart → Checkout

**Scenario**: User discovers item, adds to cart, proceeds to checkout

**Steps**:
1. Land on homepage
2. Click "Birthday" occasion
3. Click first item in search results
4. Adjust quantity to 2
5. Click "Add to Cart"
6. View cart badge (should show "2")
7. Click cart icon
8. Verify items in cart
9. Click "Proceed to Checkout"
10. Fill delivery address
11. Select payment method
12. Review order summary

**Verification**:
- [ ] All steps complete without errors
- [ ] Cart badge updates correctly
- [ ] Quantity persists across pages
- [ ] Totals calculate correctly
- [ ] Checkout form validates

**Time to Complete**: _____ minutes (should be <5 minutes)

---

### 4.2 Search → Filter → Item Details → Cart

**Scenario**: User searches, filters, views item, adds to cart

**Steps**:
1. Click search icon
2. Type "chocolate"
3. Apply "Under ₹500" filter (if available)
4. Click an item
5. View specifications
6. Add to cart
7. Continue shopping (close sheet)
8. Add another item
9. Go to cart

**Verification**:
- [ ] Search returns relevant results
- [ ] Filters work (if applicable in search)
- [ ] Item details complete
- [ ] Cart shows both items
- [ ] No duplicate entries

**Time to Complete**: _____ minutes

---

### 4.3 Partner Page → Multiple Items → Cart

**Scenario**: User browses a partner's full catalog

**Steps**:
1. From homepage, click a partner
2. Browse partner menu
3. Add 3 different items
4. Modify quantities
5. Go to cart
6. Update quantities in cart
7. Remove one item

**Verification**:
- [ ] Partner page shows all items
- [ ] Multiple adds work
- [ ] Cart accumulates correctly
- [ ] Quantity updates reflect in total
- [ ] Remove item works

**Time to Complete**: _____ minutes

---

## Section 5: Performance & Accessibility

### 5.1 Performance (Lighthouse)

**Test Steps**:
1. Open Chrome DevTools
2. Run Lighthouse audit (Mobile)
3. Record scores

**Performance Metrics**:
- [ ] Performance: ≥80 (Target: 90+)
- [ ] Accessibility: ≥90 (Target: 95+)
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

**Core Web Vitals**:
- [ ] LCP (Largest Contentful Paint): <2.5s
- [ ] FID (First Input Delay): <100ms
- [ ] CLS (Cumulative Layout Shift): <0.1

**Screenshot**: 📸 Lighthouse report

---

### 5.2 Accessibility

**Test Steps**:
1. Navigate with keyboard only (Tab key)
2. Use screen reader (if available)

**Verification**:
- [ ] All interactive elements focusable
- [ ] Focus indicators visible (outline)
- [ ] Tab order logical (top to bottom, left to right)
- [ ] Enter/Space triggers buttons
- [ ] Escape closes modals/sheets
- [ ] Images have alt text
- [ ] Buttons have aria-labels
- [ ] Color contrast ≥4.5:1 (text on background)

---

## Section 6: Edge Cases & Error Handling

### 6.1 Empty States

**Verification**:
- [ ] Empty cart shows "No items" message
- [ ] Empty search shows "No results" + suggestions
- [ ] Empty wishlist (if implemented) shows message

---

### 6.2 Network Errors

**Test Steps**:
1. Disconnect internet (airplane mode)
2. Try navigating

**Verification**:
- [ ] Graceful error message (not white screen)
- [ ] Retry button available
- [ ] Cached data shows (if PWA enabled)

---

### 6.3 Slow Network (3G)

**Test Steps**:
1. In Chrome DevTools, throttle to "Slow 3G"
2. Navigate through site

**Verification**:
- [ ] Loading spinners show during waits
- [ ] Images load progressively
- [ ] No timeouts or crashes
- [ ] Site usable (even if slow)

---

### 6.4 Very Long Content

**Test Steps**:
1. Add item with very long name/description
2. View in cart

**Verification**:
- [ ] Text truncates gracefully (ellipsis)
- [ ] No layout breaks
- [ ] Tooltips show full text on hover (if applicable)

---

### 6.5 Large Cart (10+ items)

**Test Steps**:
1. Add 12 items to cart
2. View cart page

**Verification**:
- [ ] All items visible (scrollable)
- [ ] Total calculates correctly
- [ ] Performance acceptable
- [ ] No UI glitches

---

## Section 7: Browser Compatibility

### 7.1 Chrome (Latest)
- [ ] All tests pass

### 7.2 Safari (Latest)
- [ ] All tests pass
- [ ] Swipe gestures work (carousel, sheets)
- [ ] Date pickers work (iOS specific)

### 7.3 Firefox (Latest)
- [ ] All tests pass

### 7.4 Edge (Latest)
- [ ] All tests pass

---

## Section 8: Security & Privacy

### 8.1 HTTPS

**Verification**:
- [ ] Staging URL uses HTTPS (lock icon in browser)
- [ ] No mixed content warnings
- [ ] Certificates valid

---

### 8.2 Data Privacy

**Verification**:
- [ ] No sensitive data in console logs
- [ ] No API keys exposed in source
- [ ] Local storage used appropriately (no passwords)

---

## Section 9: Final Sign-Off

### 9.1 Critical Issues
- [ ] No **critical** bugs found (blockers)
- [ ] All **high-priority** issues resolved
- [ ] Medium/low issues documented (can be fixed post-launch)

### 9.2 User Experience
- [ ] Site is intuitive (no confusion)
- [ ] Actions are clear (button labels obvious)
- [ ] Feedback is immediate (loading states, success messages)
- [ ] No broken links or 404s

### 9.3 Business Requirements
- [ ] All requested features implemented
- [ ] Design matches mockups (if applicable)
- [ ] Branding consistent (Wyshkit logo, colors)

---

## Test Results Summary

### Pass/Fail Counts
- **Total Tests**: _____ 
- **Passed**: _____
- **Failed**: _____
- **Blocked**: _____

### Critical Bugs Found
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Recommendations
- [ ] **Go-Live**: All critical tests passed, ready for production
- [ ] **Fix & Retest**: Critical issues found, fix before launch
- [ ] **Major Refactor Needed**: Significant issues, reconsider approach

---

## Tester Sign-Off

**Name**: _______________  
**Role**: _______________  
**Date**: _______________  
**Signature**: _______________

---

**Next Steps After UAT**:
1. Document any bugs found
2. Prioritize fixes (critical → high → medium → low)
3. Retest after fixes
4. Schedule production deployment
5. Prepare rollback plan

---

**UAT Completion Status**: ⬜ In Progress | ⬜ Complete | ⬜ Failed  
**Estimated Retest Date** (if needed): _______________

