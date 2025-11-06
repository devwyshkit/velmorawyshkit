# 🧪 Complete Mock Flow Guide

## Quick Start

1. **Start the dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open browser**: Navigate to `http://localhost:8080`

3. **Enable Mock Mode**:
   - Look for the ⚙️ **Settings icon** in the **bottom-right corner**
   - Click it to open the mock mode panel
   - Click **"Enable Mock Mode"**
   - Page reloads
   - You'll see a **yellow banner** at the top: "🧪 MOCK MODE ENABLED"

---

## Complete User Journey

### 🏠 Step 1: Home Page

**What you'll see:**
- **Yellow banner** at top (if mock mode enabled)
- **Banners** section (may be empty - that's okay)
- **Occasions** section with 6 icons:
  - 🎂 Birthday
  - 💍 Anniversary
  - 💒 Wedding
  - 💼 Corporate
  - 🎉 Festival
  - 🙏 Thank You
- **Store listings** below
- **Bottom navigation** with 4 tabs:
  - 🏠 Home (active)
  - 🔍 Search
  - 📦 Orders
  - 👤 Profile
- **Cart bar** above bottom nav (shows cart total or promotions)

**Try it:**
- Scroll down to see more content
- Click on an occasion icon
- Click on a store

---

### 🛒 Step 2: Add to Cart

**What you'll see:**
- Cart is **pre-populated** with 2 items:
  - Custom Birthday Cake (₹899)
  - Anniversary Gift Box (₹1499, quantity: 2)
- Cart count badge shows **3** (total items)

**To add more items:**
1. Browse products/stores
2. Click on any item
3. Product sheet opens from bottom
4. Click **"Add to Cart"**
5. Notification appears: "Added to cart"
6. Cart count updates

**Try it:**
- Click the cart icon in bottom nav
- Cart sheet opens showing all items

---

### 📦 Step 3: View Cart

**What you'll see:**
- Cart sheet slides up from bottom
- Shows:
  - Store name (if available)
  - All cart items with:
    - Product image
    - Product name
    - Price
    - Quantity controls (+/-)
    - Remove button
  - Subtotal
  - GST (18%)
  - Total
  - **"Proceed to Checkout"** button

**Try it:**
- Update item quantities
- Remove an item
- See cart total update in real-time

---

### ✅ Step 4: Checkout (No Login Required!)

**What happens:**
1. Click **"Proceed to Checkout"**
2. **No login required** in mock mode! 🎉
3. Address selection sheet opens automatically

---

### 🏡 Step 5: Select Address

**What you'll see:**
- Address selection sheet with **3 pre-populated addresses**:
  1. **Home** (Default) - 123 MG Road, Bangalore
  2. **Work** - 456 Koramangala, Bangalore
  3. **Other** - 789 Indiranagar, Bangalore
- Radio buttons to select address
- **"Business Order"** toggle
- **GSTIN** field (if business order enabled)
- **"Add New Address"** option
- **"Confirm Address"** button

**Try it:**
- Select different addresses
- Toggle business order
- Add GSTIN (15 characters)
- Click "Confirm Address"

---

### 💳 Step 6: Payment

**What you'll see:**
- Payment methods sheet opens
- Options:
  - 💳 Credit/Debit Card
  - 📱 UPI
  - 💵 Cash on Delivery
- **"Pay Now"** button

**What happens:**
1. Select payment method
2. Click **"Pay Now"**
3. **Mock payment processes instantly** (1 second delay)
4. **No real Razorpay needed!**
5. Payment succeeds automatically

---

### 🎉 Step 7: Order Confirmation

**What you'll see:**
- Order confirmation sheet opens
- Shows:
  - ✅ Success message
  - Order number (e.g., ORD-12345678)
  - Order items list
  - Delivery address
  - Total amount
  - Estimated delivery date
  - **"View Order"** button
  - **"Track Order"** button
  - **"Continue Shopping"** button

**Try it:**
- Click "View Order" → Opens order details
- Click "Track Order" → Opens tracking page
- Click "Continue Shopping" → Returns to home

---

### 📋 Step 8: View Orders

**What you'll see:**
- Orders page with **3 pre-populated orders**:
  1. **Delivered** (7 days ago) - ₹899
     - Custom Birthday Cake
     - Status: ✓ Delivered
  2. **In Production** (2 days ago) - ₹1499
     - Anniversary Gift Box
     - Status: 🚗 In Transit
  3. **Preview Pending** (Just now) - ₹2999
     - Custom Wedding Gift
     - Status: ⏰ Preview Pending

**Try it:**
- Click on any order to see details
- Click "Track Order" on any order
- Click "Reorder" on delivered orders

---

### 🗺️ Step 9: Track Order

**What you'll see:**
- Order tracking page with:
  - Order timeline:
    - ✅ Ordered
    - ✅ Confirmed
    - 🔄 In Production (current)
    - ⏳ Out for Delivery
    - ⏳ Delivered
  - Order items with images
  - Delivery address
  - ETA estimate
  - Action buttons:
    - Upload Files (for preview_pending)
    - View Preview (for preview_ready)
    - Contact Support

**Try it:**
- For preview_pending orders: Click "Upload Files"
- For in_production orders: See progress timeline
- For delivered orders: See complete timeline

---

## 🔄 Cross-Tab Testing

**Try this:**
1. Open the app in **two browser tabs**
2. Add item to cart in Tab 1
3. Watch cart update in **Tab 2 automatically** ✨
4. Remove item in Tab 2
5. See it disappear in Tab 1

---

## 🧹 Reset Mock Data

**To clear all mock data:**
1. Click the ⚙️ Settings icon
2. Click **"Clear All Mock Data"**
3. Page reloads
4. All cart, orders, and addresses are cleared
5. Fresh start! 🎉

---

## 🎯 Key Features Demonstrated

✅ **Complete E-commerce Flow**
- Browse → Cart → Checkout → Payment → Confirmation → Track

✅ **No Backend Required**
- All data in localStorage
- No Supabase calls
- No authentication needed
- No real payment gateway

✅ **Realistic UX**
- Loading states (1-2s delays)
- Smooth transitions
- Optimistic updates
- Error handling

✅ **Production-Safe**
- Only works in development
- Automatically disabled in production builds

✅ **Developer-Friendly**
- Easy toggle on/off
- Visual indicator
- Data reset option
- Pre-populated test data

---

## 🐛 Troubleshooting

**Mock mode not working?**
- Check yellow banner at top (should be visible)
- Check browser console for errors
- Verify localStorage is enabled
- Try clearing browser cache

**Cart not showing?**
- Enable mock mode first
- Cart is pre-populated automatically
- Check browser console for errors

**Orders not showing?**
- Orders are pre-populated when you view Orders page
- Make sure you're logged in (mock user is auto-logged in)

**Payment not working?**
- In mock mode, payment always succeeds
- No real Razorpay needed
- Check console for any errors

---

## 📝 Notes

- **Mock mode** only works in development (`npm run dev`)
- **Production builds** (`npm run build`) automatically disable mock mode
- **Data persists** across page refreshes
- **Cross-tab sync** works automatically
- **All screens** are accessible without authentication

---

**Enjoy testing! 🚀**




