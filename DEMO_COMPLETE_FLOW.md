# 🎬 Complete Flow Demonstration (Including Preview)

## 🌐 Open in Incognito Mode

**Steps:**
1. Open Chrome/Edge in incognito mode (Ctrl+Shift+N / Cmd+Shift+N)
2. Navigate to: `http://localhost:8080`
3. This ensures clean state (no cookies/cache)

---

## 🧪 Step 1: Enable Mock Mode

**What to do:**
1. Look for **⚙️ Settings icon** in **bottom-right corner**
2. Click it
3. Click **"Enable Mock Mode"**
4. Page reloads

**What you'll see:**
- ✅ **Yellow banner** at top: "🧪 MOCK MODE ENABLED - Using localStorage data (Dev Only)"
- Mock mode indicator visible

---

## 🏠 Step 2: Home Page Overview

**What you'll see:**
- **Search bar** at top
- **Banners** section (may be empty - OK)
- **Occasions** section with 6 icons:
  - 🎂 Birthday
  - 💍 Anniversary  
  - 💒 Wedding
  - 💼 Corporate
  - 🎉 Festival
  - 🙏 Thank You
- **Store listings** below
- **Bottom navigation** (4 tabs)
- **Cart bar** above bottom nav (shows total or promotions)

**Try clicking:**
- Occasion icons
- Store cards
- Scroll down to see more

---

## 🛒 Step 3: Cart (Pre-populated)

**What to do:**
1. Click **cart icon** in bottom navigation OR
2. Click the **cart bar** at bottom

**What you'll see:**
- Cart sheet opens from bottom
- **2 pre-populated items:**
  1. **Custom Birthday Cake** - ₹899 (qty: 1)
  2. **Anniversary Gift Box** - ₹1499 (qty: 2)
- Subtotal: ₹3897
- GST (18%): ₹701.46
- **Total: ₹4598.46**
- **"Proceed to Checkout"** button

**Try:**
- Update quantities (+/-)
- Remove items
- See real-time total updates

---

## ✅ Step 4: Checkout (No Login!)

**What to do:**
1. Click **"Proceed to Checkout"**
2. **No login required!** (Mock mode bypasses auth)

**What happens:**
- Address selection sheet opens automatically
- No redirect to login page

---

## 🏡 Step 5: Address Selection

**What you'll see:**
- **3 pre-populated addresses:**
  1. **Home** (Default) - 123 MG Road, Bangalore 560001
  2. **Work** - 456 Koramangala, Bangalore 560095
  3. **Other** - 789 Indiranagar, Bangalore 560038
- Radio buttons to select
- **"Business Order"** toggle
- **GSTIN** field (appears when business toggle ON)
- **"Add New Address"** button
- **"Confirm Address"** button

**Try:**
- Select different addresses
- Toggle "Business Order"
- Enter GSTIN: `27ABCDE1234F1Z5` (15 chars)
- Click "Confirm Address"

---

## 💳 Step 6: Payment Selection

**What you'll see:**
- Payment methods sheet opens
- Options:
  - 💳 **Credit/Debit Card**
  - 📱 **UPI**
  - 💵 **Cash on Delivery**
- **"Pay Now"** button

**What to do:**
1. Select payment method
2. Click **"Pay Now"**

**What happens:**
- Mock payment processes (1 second delay)
- **No real Razorpay needed!**
- Payment succeeds automatically
- Order confirmation opens

---

## 🎉 Step 7: Order Confirmation

**What you'll see:**
- Order confirmation sheet
- ✅ Success message
- **Order number:** ORD-XXXXXXXX (auto-generated)
- **Order items:**
  - Custom Birthday Cake x1
  - Anniversary Gift Box x2
- **Delivery address:** (selected address)
- **Total:** ₹4598.46
- **Estimated delivery:** (calculated date)
- **Buttons:**
  - "View Order"
  - "Track Order"
  - "Continue Shopping"

**Try clicking:**
- "View Order" → Opens order details
- "Track Order" → Opens tracking page
- "Continue Shopping" → Returns to home

---

## 📋 Step 8: View Orders List

**What to do:**
1. Click **"Orders"** tab in bottom navigation
2. OR click "View Order" from confirmation

**What you'll see:**
- Orders page with **3 pre-populated orders:**
  
  1. **Delivered** (7 days ago)
     - Order #ORD-12345678
     - Custom Birthday Cake
     - ₹899
     - Status: ✓ Delivered
     - "Reorder" button
  
  2. **In Production** (2 days ago)
     - Order #ORD-87654321
     - Anniversary Gift Box x2
     - ₹1499
     - Status: 🚗 In Transit
     - "Track Order" button
  
  3. **Preview Pending** (Just created)
     - Order #ORD-11223344 (or your new order)
     - Custom Wedding Gift
     - ₹2999
     - Status: ⏰ Preview Pending
     - "Upload Files" button

**Try:**
- Click any order to see details
- Click "Track Order" on in-production order
- Click "Reorder" on delivered order

---

## 🗺️ Step 9: Track Order - Standard Flow

**What to do:**
1. Click on **"In Production"** order
2. Click **"Track Order"**

**What you'll see:**
- Order tracking page
- **Timeline:**
  - ✅ Ordered (completed)
  - ✅ Confirmed (completed)
  - 🔄 **In Production** (current - highlighted)
  - ⏳ Out for Delivery (upcoming)
  - ⏳ Delivered (upcoming)
- **Order items** with images
- **Delivery address**
- **ETA estimate:** "X days"
- **Delivery partner tracking** (if available)
- **Action buttons:**
  - Contact Support
  - View Order Details

**Try:**
- Scroll to see full timeline
- Click "View Order Details"
- Click "Contact Support"

---

## 🎨 Step 10: Preview Pending Flow (IMPORTANT!)

**What to do:**
1. Go to Orders page
2. Find order with **"⏰ Preview Pending"** status
3. Click on it
4. Click **"Upload Files"** or **"Track Order"**

**What you'll see:**
- Tracking page with **preview pending status**
- **Timeline shows:**
  - ✅ Ordered
  - ✅ Confirmed
  - ⏰ **Preview Pending** (current - highlighted in orange)
  - ⏳ Preview Ready (upcoming)
  - ⏳ In Production (upcoming)
  - ⏳ Out for Delivery (upcoming)
  - ⏳ Delivered (upcoming)

**Preview Actions Available:**
1. **"Upload Files"** button
   - Opens file upload sheet
   - Drag & drop or click to upload
   - Supported: Images, PDFs, Text files
   - Upload customization files (logos, text, images)

2. **Preview Status:**
   - Shows "Pending" until files uploaded
   - Changes to "Ready" after upload
   - Then to "Approved" after review

**Try:**
- Click "Upload Files"
- Upload a test image/file
- See preview status update
- Wait for "Preview Ready" notification

---

## 📤 Step 11: File Upload & Preview

**What to do:**
1. On Preview Pending order, click **"Upload Files"**
2. File upload sheet opens

**What you'll see:**
- Upload zone with:
  - Drag & drop area
  - "Choose Files" button
  - Supported formats listed
  - File size limits
- List of uploaded files (if any)
- **"Submit for Preview"** button

**Try:**
- Drag and drop a file
- OR click "Choose Files"
- Select an image/file
- See upload progress
- Click "Submit for Preview"

**What happens:**
- Files uploaded to mock storage
- Order status changes to "Preview Ready"
- Preview notification appears
- You can view preview

---

## 👁️ Step 12: View Preview

**What to do:**
1. After upload, order status changes to **"Preview Ready"**
2. Click **"View Preview"** button
3. OR click preview notification banner

**What you'll see:**
- Preview approval sheet opens
- **Preview image/video:**
  - Shows how product will look
  - With your customizations applied
- **Preview details:**
  - Order items
  - Customizations applied
  - Preview status
- **Action buttons:**
  - ✅ **"Approve Preview"** (green)
  - 🔄 **"Request Changes"** (orange)
  - ❌ **"Reject"** (red)

**Try:**
- Click "Approve Preview"
- Order moves to "In Production"
- OR click "Request Changes"
- Add revision notes
- Upload new files

---

## 🔄 Step 13: Preview Approval Flow

**After approving preview:**

**What happens:**
- Order status changes to **"Preview Approved"**
- Timeline updates:
  - ✅ Ordered
  - ✅ Confirmed
  - ✅ Preview Approved
  - 🔄 **In Production** (current)
  - ⏳ Out for Delivery
  - ⏳ Delivered

**What you'll see:**
- Status badge changes
- Production starts
- ETA updates
- Can track production progress

---

## 📦 Step 14: Delivered Order Details

**What to do:**
1. Go to Orders page
2. Click on **"Delivered"** order

**What you'll see:**
- Order details sheet
- **Complete timeline:**
  - ✅ Ordered
  - ✅ Confirmed
  - ✅ In Production
  - ✅ Out for Delivery
  - ✅ **Delivered** (all completed)
- **Delivery date:** "Delivered on [date]"
- **Order items** with images
- **Delivery address**
- **Payment details**
- **Action buttons:**
  - ⭐ **"Rate & Review"**
  - 🔄 **"Reorder"**
  - 📄 **"Download Invoice"**
  - 💬 **"Help & Support"**

**Try:**
- Click "Rate & Review"
- Rate order (1-5 stars)
- Write review
- Submit review

---

## ⭐ Step 15: Rating & Review

**What to do:**
1. On delivered order, click **"Rate & Review"**
2. Rating sheet opens

**What you'll see:**
- **Star rating** (1-5 stars)
- **Review text** field
- **Photos upload** (optional)
- **"Submit Review"** button

**Try:**
- Select star rating
- Write review text
- Upload photos (optional)
- Click "Submit Review"
- Review submitted successfully

---

## 🔄 Step 16: Reorder Flow

**What to do:**
1. On delivered order, click **"Reorder"**
2. Quick reorder sheet opens

**What you'll see:**
- **Order items** from previous order
- **Quantity** controls
- **Add/remove items**
- **"Add to Cart"** button

**What happens:**
- Items added to cart
- Cart sheet opens
- Can proceed to checkout immediately

---

## 🔍 Step 17: Search Functionality

**What to do:**
1. Click **"Search"** tab in bottom nav
2. OR use search bar at top

**What you'll see:**
- Search page
- Search input field
- Recent searches (if any)
- Popular searches
- Search suggestions

**Try:**
- Type "birthday"
- See suggestions
- Select a suggestion
- See search results

---

## 👤 Step 18: Profile Page

**What to do:**
1. Click **"Profile"** tab in bottom nav

**What you'll see:**
- Profile page
- **Mock user info:**
  - Name: Test User
  - Email: test@wyshkit.com
  - Phone: +919876543210
- **Options:**
  - Addresses (3 pre-populated)
  - Saved Items
  - Orders
  - Help & Support
  - Settings

**Try:**
- Click "Addresses" → See all addresses
- Click "Saved Items" → See favorites
- Click "Settings" → App settings

---

## 🎯 Complete Flow Summary

### Standard Order Flow:
```
Home → Browse → Cart → Checkout → Address → Payment → 
Confirmation → Orders → Track → Delivered → Review
```

### Custom Order Flow (with Preview):
```
Home → Cart → Checkout → Address → Payment → 
Confirmation → Orders → Preview Pending → Upload Files → 
Preview Ready → Approve Preview → In Production → 
Delivered → Review
```

---

## 🧹 Testing in Incognito

**Benefits:**
- ✅ Clean state (no cookies/cache)
- ✅ Fresh localStorage
- ✅ No extensions interfering
- ✅ True test of app initialization

**What to expect:**
- Mock mode toggle works
- Pre-populated data loads fresh
- All features work normally
- Data persists during session

---

## 📝 Key Features to Test

✅ **Mock Mode Toggle**
- Enable/disable works
- Banner appears/disappears
- Data persists

✅ **Cart Operations**
- Add items
- Update quantities
- Remove items
- Real-time updates

✅ **Checkout Flow**
- No authentication required
- Address selection
- Payment processing
- Order creation

✅ **Preview Functionality**
- Upload files
- View preview
- Approve/reject
- Status updates

✅ **Order Tracking**
- Timeline visualization
- Status updates
- ETA estimates
- Delivery tracking

✅ **Cross-Tab Sync**
- Open two tabs
- Update cart in one
- See update in other

---

## 🐛 Troubleshooting

**Mock mode not showing?**
- Check console for errors
- Verify dev server running
- Try hard refresh (Ctrl+Shift+R)

**Preview not working?**
- Check order has preview_pending status
- Verify file upload works
- Check console for errors

**Data not persisting?**
- Check localStorage enabled
- Verify mock mode enabled
- Try in normal (non-incognito) mode first

---

**Enjoy testing the complete flow! 🚀**




