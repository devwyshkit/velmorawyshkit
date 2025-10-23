# Swiggy/Zomato Implementation Guide

## Overview

This guide explains how to use the newly implemented Swiggy/Zomato-style pricing, delivery fee, and add-ons system in your product pages, cart, and checkout flows.

## 🎯 Key Battle-Tested Patterns Implemented

### 1. Auto-Updating Price (Swiggy/Zomato)
Price automatically updates when quantity changes - NO tier list shown to customer.

### 2. Progressive Disclosure (Swiggy)
"Add ₹200 more for FREE delivery!" banner encourages cart growth.

### 3. Conditional Feature Unlock (Zomato/Food Delivery)
Add-ons appear/disappear based on order quantity (MOQ).

### 4. Clear Price Display (Amazon/Flipkart)
Large, bold current price with strikethrough base price and discount badge.

---

## 📦 Component Usage Guide

### 1. Tiered Pricing Display

```tsx
import { TieredPricingDisplay, QuantityPriceSelector } from '@/components/customer/TieredPricingDisplay';

// Basic usage - shows current price with auto-update
<TieredPricingDisplay
  quantity={quantity}
  tiers={product.tieredPricing}
  showSavings={true}
  showNextTierHint={true}
/>

// With quantity selector (full Swiggy pattern)
<QuantityPriceSelector
  quantity={quantity}
  onQuantityChange={setQuantity}
  tiers={product.tieredPricing}
  min={1}
  max={9999}
/>
```

**What it does:**
- Shows current price in large, bold text
- Displays strikethrough base price if discount applies
- Shows discount badge (e.g., "15% OFF")
- Shows "Add X more to unlock Y% discount" message
- NO tier list visible - price just updates live

**Example Output:**
```
₹4,200  ₹5,000  [15% OFF]
per item • Total: ₹2,52,000

🟢 You save ₹48,000 on this order!

↓ Add 40 more items to unlock 20% discount!
```

---

### 2. Delivery Fee Banner

```tsx
import { DeliveryFeeBanner, CompactDeliveryFee, InlineDeliveryMessage } from '@/components/customer/DeliveryFeeBanner';

// Full banner with progress bar (for cart page)
<DeliveryFeeBanner
  cartSubtotal={cartSubtotal} // in paise
  freeThreshold={500000} // ₹5000
  showProgress={true}
/>

// Compact version (for cart summary)
<CompactDeliveryFee
  cartSubtotal={cartSubtotal}
  freeThreshold={500000}
/>

// Inline message (for product page)
<InlineDeliveryMessage
  cartSubtotal={itemsSubtotal}
  freeThreshold={500000}
/>
```

**What it does:**
- Calculates delivery fee based on 4 tiers:
  - ₹0-999: ₹80
  - ₹1000-2499: ₹50
  - ₹2500-4999: ₹30
  - ₹5000+: FREE
- Shows "Add ₹X more for FREE delivery!" message
- Progress bar showing distance to free delivery
- Green success state when free delivery achieved

**Example Output:**
```
🚚 Add ₹200 more for FREE delivery!
[==================    ] 80%
₹4,800                 Free at ₹5,000
```

---

### 3. Add-ons Selector

```tsx
import { AddOnsSelector, calculateAddOnsTotal } from '@/components/customer/AddOnsSelector';

// Full selector with conditional unlock
<AddOnsSelector
  addOns={product.addOns}
  quantity={quantity}
  selectedAddOnIds={selectedAddOnIds}
  onSelectionChange={setSelectedAddOnIds}
/>

// Calculate total (for cart summary)
const addOnsCalc = calculateAddOnsTotal(
  selectedAddOnIds,
  product.addOns,
  quantity
);
```

**What it does:**
- Shows **standard add-ons** (always visible)
- Shows **bulk add-ons** only when quantity >= MOQ
- Displays "✅ Corporate Customization Now Available!" when unlocked
- Shows lock icon + "Add X more items to unlock" for locked add-ons
- Calculates total add-on cost automatically

**Example Output:**

**When quantity = 10:**
```
✨ Make It Special

Available for all orders
☑ Premium Gift Wrapping  +₹1,000 (₹100/item)
☐ Personalized Message   +₹500 (₹50/item)

🔒 Corporate Customization
   Company Branding
   Add 40 more items to unlock this option
```

**When quantity = 60:**
```
✨ Make It Special

Available for all orders
☑ Premium Gift Wrapping  +₹6,000

✅ Corporate Customization Now Available!
Corporate Customization  [Available for 50+ items]
☑ Company Branding  +₹12,000 (₹200/item)
   📸 Preview before production
   📤 Logo/design upload required
   
Add-ons Total (2 selected)  ₹18,000
```

---

## 🔧 Utility Functions

### Tiered Pricing

```tsx
import { calculateTieredPrice, formatPrice, getNextTierInfo } from '@/lib/pricing/tieredPricing';

// Calculate price for quantity
const calc = calculateTieredPrice(quantity, tiers);
// Returns: { pricePerItem, subtotal, discountPercent, appliedTier, savings }

// Format price in Indian rupees
const formatted = formatPrice(500000); // "₹5,000"

// Get next tier info
const next = getNextTierInfo(quantity, tiers);
// Returns: { hasNextTier, nextTier, quantityNeeded, message }
```

### Delivery Fee

```tsx
import { calculateDeliveryFee, createDeliveryBannerMessage } from '@/lib/pricing/deliveryFee';

// Calculate delivery fee
const delivery = calculateDeliveryFee(cartSubtotal, config, freeThreshold, distanceKm);
// Returns: { fee, isFree, amountNeededForFree, message }

// Create banner message
const banner = createDeliveryBannerMessage(cartSubtotal, delivery);
// Returns: { type: 'info' | 'success', message, icon }
```

### Commission (Admin/Backend Only)

```tsx
import { calculateCommission, getEffectiveCommissionRate } from '@/lib/pricing/commission';

// Calculate commission for an order
const comm = calculateCommission(
  orderValue, // in paise
  orderQuantity,
  vendorId,
  categoryId,
  commissionRules,
  vendorOverrides
);
// Returns: { commission_amount, commission_percent, vendor_payout, applied_rule_id, rule_name }
```

---

## 🎨 Complete Product Detail Page Example

```tsx
import { useState } from 'react';
import { QuantityPriceSelector } from '@/components/customer/TieredPricingDisplay';
import { AddOnsSelector } from '@/components/customer/AddOnsSelector';
import { InlineDeliveryMessage } from '@/components/customer/DeliveryFeeBanner';

function ProductDetail({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
  
  const pricingCalc = useMemo(() => 
    calculateTieredPrice(quantity, product.tieredPricing),
    [quantity, product.tieredPricing]
  );
  
  const addOnsCalc = useMemo(() =>
    calculateAddOnsTotal(selectedAddOnIds, product.addOns, quantity),
    [selectedAddOnIds, product.addOns, quantity]
  );
  
  const subtotal = pricingCalc.subtotal + addOnsCalc.totalAddOnCost;
  
  return (
    <div className="space-y-8">
      {/* Product Info */}
      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
      </div>
      
      {/* What's Included */}
      <div>
        <h3>What's Included:</h3>
        <ul>
          {product.whatsIncluded.map((item) => (
            <li key={item}>✓ {item}</li>
          ))}
        </ul>
      </div>
      
      {/* Quantity & Price (SWIGGY PATTERN) */}
      <QuantityPriceSelector
        quantity={quantity}
        onQuantityChange={setQuantity}
        tiers={product.tieredPricing}
        min={1}
        max={product.stock}
      />
      
      {/* Delivery Info */}
      <InlineDeliveryMessage
        cartSubtotal={subtotal}
        freeThreshold={500000}
      />
      
      {/* Add-ons (ZOMATO PATTERN) */}
      <AddOnsSelector
        addOns={product.addOns}
        quantity={quantity}
        selectedAddOnIds={selectedAddOnIds}
        onSelectionChange={setSelectedAddOnIds}
      />
      
      {/* Price Summary */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Items ({quantity})</span>
          <span>{formatPrice(pricingCalc.subtotal)}</span>
        </div>
        {addOnsCalc.totalAddOnCost > 0 && (
          <div className="flex justify-between">
            <span>Add-ons</span>
            <span>{formatPrice(addOnsCalc.totalAddOnCost)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>
      
      {/* CTA */}
      <button onClick={handleAddToCart}>
        Add to Cart
      </button>
    </div>
  );
}
```

---

## 🗄️ Database Setup

Run the migration:

```bash
# Apply the migration
psql -h your-db-host -U postgres -d your-database -f supabase/migrations/SWIGGY_ZOMATO_REBUILD.sql
```

This creates:
- Updated `partner_products` table with tiered pricing columns
- `delivery_fee_config` table with 4 default tiers
- `commission_rules` table with default 18% rate
- `vendor_commission_overrides` table
- `brands`, `supply_products`, `supply_orders` tables (B2B)
- `order_previews` table (customization workflow)
- Helper SQL functions

---

## 📊 Default Configuration

### Delivery Fee Tiers
```
₹0 - ₹999:      ₹80
₹1,000 - ₹2,499: ₹50
₹2,500 - ₹4,999: ₹30
₹5,000+:        FREE
```

### Commission Rates
```
Default:         18%
Bulk (50+):      15%
Super Bulk (200+): 12%
```

### Sample Pricing Tiers (for partners)
```
1-9 items:    Base price (0% off)
10-49 items:  7% off
50-99 items:  13% off
100+ items:   20% off
```

---

## 🎯 Next Steps

1. **Integrate into Product Detail Page**
   - Replace existing price display with `QuantityPriceSelector`
   - Add `AddOnsSelector` component
   - Add `InlineDeliveryMessage`

2. **Update Cart Page**
   - Add `DeliveryFeeBanner` at top
   - Use `CompactPricingDisplay` for cart items
   - Use `CompactDeliveryFee` in summary

3. **Update Checkout**
   - Show delivery fee breakdown
   - Show add-ons in order summary
   - Show customization warnings if applicable

4. **Partner Dashboard**
   - Create product form wizard with tiered pricing builder
   - Add add-ons configuration
   - Show preview of how pricing appears to customers

5. **Admin Panel**
   - Commission management interface
   - Delivery fee configuration
   - Vendor commission overrides

---

## 💡 Pro Tips

1. **Always use paise (not rupees)** in calculations to avoid floating point errors
2. **Use `formatPrice()` for display** - handles Indian number formatting
3. **Test tier transitions** - ensure price updates smoothly when quantity changes
4. **Validate MOQ** - bulk add-ons should only appear when quantity >= minimumOrder
5. **Show preview requirement** - clearly indicate when preview is needed for customization
6. **Enforce refund policy** - customized orders cannot be refunded after approval

---

## 🐛 Common Issues

**Q: Price not updating when quantity changes?**
A: Make sure you're using `useMemo` to recalculate `calculateTieredPrice()` when quantity changes.

**Q: Add-ons not unlocking?**
A: Check that `addon.type === 'bulk'` and `quantity >= addon.minimumOrder`.

**Q: Delivery fee banner not showing?**
A: Verify `cartSubtotal` is in paise (not rupees). ₹5000 = 500000 paise.

**Q: Commission calculation incorrect?**
A: Check rule priority. Vendor override > Volume > Vendor-specific > Category > Default.

---

## 📚 References

- Swiggy/Zomato: Delivery fee progressive disclosure
- Amazon/Flipkart: Tiered pricing and bulk discounts
- Food delivery apps: Add-on conditional unlock pattern
- E-commerce: Clear price display with savings

**All patterns are battle-tested from production applications!** 🚀

