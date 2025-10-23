# Wyshkit Platform Testing Checklist

## Swiggy/Zomato Pattern Validation

### 1. Price Display Behavior
- [ ] Price auto-updates when quantity changes (no page reload)
- [ ] Only current price shown prominently (like Swiggy)
- [ ] Pricing tiers available in collapsible section
- [ ] Discount percentage shown when applicable
- [ ] Savings message displayed correctly
- [ ] Next tier upsell message works ("Add X more items to save...")

### 2. Delivery Fee Messaging
- [ ] Swiggy-style "Add ₹X more for FREE delivery" message
- [ ] FREE delivery badge shown when threshold met
- [ ] Delivery fee updates based on cart value
- [ ] Threshold alerts work correctly
- [ ] Distance-based surcharge calculated properly

### 3. Mobile-First Design (320px, 390px, 768px, 1024px+)
- [ ] All text readable without zooming (min 14px)
- [ ] Buttons touch-friendly (min 44px height)
- [ ] No horizontal scrolling on any screen
- [ ] Fixed bottom navigation doesn't overlap content
- [ ] Images responsive and properly sized
- [ ] Forms fully accessible on mobile

## Customer Flow Testing

### Browse → Product Details
- [ ] Product cards display correctly
- [ ] Images load properly
- [ ] Ratings and reviews visible
- [ ] Category filtering works
- [ ] Search functionality works
- [ ] Mobile: All cards stack correctly

### Product Details → Add to Cart
- [ ] Quantity selector works smoothly
- [ ] Price updates automatically on quantity change
- [ ] Add-ons appear/disappear based on MOQ
- [ ] MOQ validation works correctly
- [ ] "Add to Cart" button always visible (mobile)
- [ ] Product images in gallery work

### Cart → Checkout
- [ ] Cart items display correctly
- [ ] Quantity modification works
- [ ] Item removal works
- [ ] Total price calculated correctly
- [ ] Delivery fee shows correctly
- [ ] FREE delivery message appears when applicable
- [ ] Mobile: Fixed checkout button works

### Checkout → Payment
- [ ] Address input works (Google Places autocomplete)
- [ ] GSTIN field optional and functional
- [ ] Payment method selection works
- [ ] 100% advance payment enforced
- [ ] Refund policy displayed clearly
- [ ] Mobile: All form fields accessible

### Payment → Confirmation
- [ ] Razorpay integration works
- [ ] Payment success shows confirmation
- [ ] Order ID generated
- [ ] Confirmation email triggered
- [ ] Order tracking link works

## Partner Flow Testing

### Product Creation (Swiggy Pattern)
- [ ] Listing type selection works (Individual/Hamper/Service)
- [ ] Multi-step form navigation smooth
- [ ] Tiered pricing setup works
- [ ] Add-on configuration with MOQ works
- [ ] Delivery time tiers configurable
- [ ] Customization settings work
- [ ] Preview requirement toggle works
- [ ] Mobile: All steps accessible

### Order Management
- [ ] New orders appear in real-time
- [ ] Order status updates work
- [ ] Preview upload workflow functions
- [ ] Order acceptance/rejection works
- [ ] Mobile: Order cards readable

### B2B Procurement (Wyshkit Supply)
- [ ] Supply tab accessible from partner dashboard
- [ ] Wholesale products display correctly
- [ ] MOQ validation works
- [ ] B2B cart functions properly
- [ ] Bulk order placement works
- [ ] Invoice generation works
- [ ] Mobile: All features accessible

## Admin Flow Testing

### Commission Management
- [ ] Global commission rules work
- [ ] Vendor-specific rates can be set
- [ ] Category-based rules work
- [ ] Volume-based tiers function
- [ ] Real-time updates apply to new orders
- [ ] Commission calculator works

### Fee Management
- [ ] Delivery fee structure configurable
- [ ] Free delivery threshold adjustable
- [ ] Platform fee can be enabled/disabled
- [ ] Changes apply immediately
- [ ] Mobile: Admin panel accessible

### Vendor Management
- [ ] Vendor approval workflow works
- [ ] Custom commission assignment works
- [ ] Vendor suspension works
- [ ] Performance metrics display correctly

## UI/UX Validation

### Visual Consistency
- [ ] Spacing consistent (4px, 8px, 16px, 24px grid)
- [ ] Colors match design system
- [ ] Font sizes appropriate (min 14px body)
- [ ] Button styles consistent
- [ ] Icons sized appropriately
- [ ] Loading states visible

### Accessibility
- [ ] All form inputs have labels
- [ ] Color contrast ratios pass WCAG AA
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Error messages clear and helpful
- [ ] Screen reader friendly

### Overflow/Overlap Issues
- [ ] Long product names don't overflow
- [ ] Large quantities display correctly
- [ ] Cart with many items scrolls properly
- [ ] Modal dialogs don't overlap
- [ ] Fixed elements position correctly
- [ ] Z-index layers correct

## Cross-Browser Testing

### Chrome (Desktop + Mobile)
- [ ] All features work
- [ ] Animations smooth
- [ ] Payment gateway loads
- [ ] Forms submit correctly
- [ ] Mobile view perfect

### Safari (Desktop + Mobile)
- [ ] All features work
- [ ] Sticky positioning works
- [ ] Payment gateway loads
- [ ] Date pickers work
- [ ] iOS specific: Bottom nav doesn't hide

### Firefox (Desktop + Mobile)
- [ ] All features work
- [ ] Animations smooth
- [ ] Payment gateway loads
- [ ] Forms submit correctly
- [ ] Mobile view perfect

## Edge Cases Testing

### Product Listing
- [ ] Very long product names (100+ characters)
- [ ] Products with no images
- [ ] Products with 10+ add-ons
- [ ] Products with extreme pricing (₹1 vs ₹1,00,000)
- [ ] Products out of stock
- [ ] Made-to-order products

### Cart & Checkout
- [ ] Empty cart state
- [ ] Cart with 50+ items
- [ ] Cart value exactly at free delivery threshold
- [ ] Invalid GSTIN input
- [ ] Multiple products from different vendors
- [ ] Customized + non-customized mix

### Orders
- [ ] Order with 1000+ quantity
- [ ] Order requiring preview approval
- [ ] Cancelled orders
- [ ] Failed payment orders
- [ ] Refund requests

## Performance Testing

### Load Times
- [ ] Homepage loads in < 2s
- [ ] Product page loads in < 1s
- [ ] Cart page loads in < 1s
- [ ] Checkout loads in < 2s
- [ ] Partner dashboard loads in < 2s

### Optimization
- [ ] Images lazy load
- [ ] Code splitting working
- [ ] Bundle size < 500KB (gzipped)
- [ ] No unnecessary re-renders
- [ ] Smooth animations (60fps)

## Integration Testing

### Supabase
- [ ] User authentication works
- [ ] Data fetching works
- [ ] Real-time updates work
- [ ] File uploads work
- [ ] RLS policies enforced

### Razorpay
- [ ] Payment initiation works
- [ ] Payment success handling works
- [ ] Payment failure handling works
- [ ] Webhook processing works
- [ ] Refund processing works

### Google Places API
- [ ] Address autocomplete works
- [ ] Location suggestions accurate
- [ ] Address parsing correct
- [ ] Fallback for API failure

### Zoho (Documentation Ready)
- [ ] Integration endpoints documented
- [ ] API authentication flow documented
- [ ] Error handling documented
- [ ] Webhook configuration documented

## Random Spot Testing (10 Screens)

1. **Customer Home**: Check featured products, search, filters
2. **Product Details (Mobile)**: Verify quantity selector, add-ons
3. **Cart**: Check calculations, delivery fee
4. **Checkout**: Test payment flow, GSTIN
5. **Partner Products**: Test tiered pricing setup
6. **Partner Supply**: Test B2B procurement
7. **Partner Orders**: Check order management
8. **Admin Commission**: Test rate updates
9. **Admin Fee Management**: Test delivery fee config
10. **Order Confirmation**: Verify all details correct

## Swiggy/Zomato Comparison

### Price Display
- [ ] Matches Swiggy's single price display
- [ ] Auto-updates like Swiggy
- [ ] Discount badges similar to Zomato

### Delivery Fee
- [ ] "Add ₹X more" messaging like Swiggy
- [ ] FREE delivery celebration like Zomato
- [ ] Threshold logic similar

### Mobile UX
- [ ] Fixed bottom CTA like Swiggy
- [ ] Card-based layout like Zomato
- [ ] Smooth scrolling like food apps
- [ ] Information hierarchy similar

### Checkout Flow
- [ ] Address input like Swiggy
- [ ] Payment selection like Zomato
- [ ] Order summary like food apps
- [ ] Progress indicators similar

## Sign-off Checklist

- [ ] All critical flows tested
- [ ] All browsers validated
- [ ] All mobile breakpoints checked
- [ ] No console errors
- [ ] No linting errors
- [ ] Performance benchmarks met
- [ ] Accessibility standards met
- [ ] Ready for production deployment
