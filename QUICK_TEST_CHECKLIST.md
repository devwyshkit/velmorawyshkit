# ✅ Quick Test Checklist - Complete Flow

## 🌐 Setup (Incognito Mode)
- [ ] Open browser in incognito (Cmd+Shift+N / Ctrl+Shift+N)
- [ ] Navigate to: `http://localhost:8080`
- [ ] Enable Mock Mode (⚙️ icon bottom-right)
- [ ] Verify yellow banner appears at top

---

## 🛒 Cart & Checkout Flow
- [ ] Cart shows 2 pre-populated items
- [ ] Can update quantities
- [ ] Can remove items
- [ ] Click "Proceed to Checkout"
- [ ] **No login required** ✅
- [ ] Address sheet opens with 3 addresses
- [ ] Can select address
- [ ] Can toggle business order
- [ ] Payment sheet opens
- [ ] Select payment method
- [ ] Click "Pay Now"
- [ ] **Mock payment succeeds instantly** ✅
- [ ] Order confirmation shows

---

## 📦 Orders Page
- [ ] Navigate to Orders tab
- [ ] See 3 pre-populated orders:
  - [ ] Delivered order (7 days ago)
  - [ ] In Production order (2 days ago)
  - [ ] Preview Pending order (just created)
- [ ] Click on any order
- [ ] Order details open

---

## 🎨 Preview Flow (KEY FEATURE!)
- [ ] Find order with "⏰ Preview Pending" status
- [ ] Click "Track Order" on preview_pending order
- [ ] Timeline shows "Preview Pending" as current step
- [ ] See "Upload Files" button
- [ ] Click "Upload Files"
- [ ] File upload sheet opens
- [ ] Can drag/drop or select files
- [ ] Upload a test file
- [ ] Preview status updates
- [ ] See "Preview Ready" notification
- [ ] Click "View Preview"
- [ ] Preview approval sheet opens
- [ ] Can approve or request changes

---

## 🗺️ Order Tracking
- [ ] Click "Track Order" on any order
- [ ] Timeline displays correctly
- [ ] Current step highlighted
- [ ] ETA estimate shown
- [ ] Order items visible
- [ ] Delivery address shown
- [ ] Action buttons work

---

## 📤 File Upload
- [ ] Upload zone accessible
- [ ] Can drag and drop files
- [ ] Can select files via button
- [ ] Upload progress shows
- [ ] Files appear in list after upload
- [ ] Can remove uploaded files
- [ ] "Submit for Preview" works

---

## ⭐ Rating & Review
- [ ] Go to delivered order
- [ ] Click "Rate & Review"
- [ ] Rating sheet opens
- [ ] Can select stars (1-5)
- [ ] Can write review text
- [ ] Can upload photos
- [ ] Submit review works

---

## 🔄 Reorder
- [ ] On delivered order, click "Reorder"
- [ ] Quick reorder sheet opens
- [ ] Previous items shown
- [ ] Can modify quantities
- [ ] "Add to Cart" works
- [ ] Items added to cart

---

## 🔍 Search
- [ ] Click Search tab
- [ ] Search input works
- [ ] Can type search query
- [ ] Suggestions appear
- [ ] Search results show

---

## 👤 Profile
- [ ] Click Profile tab
- [ ] Mock user info displayed
- [ ] Can view addresses
- [ ] Can view saved items
- [ ] Settings accessible

---

## 🔄 Cross-Tab Sync
- [ ] Open app in 2 tabs
- [ ] Add item to cart in Tab 1
- [ ] Cart updates in Tab 2 automatically ✅
- [ ] Remove item in Tab 2
- [ ] Item disappears in Tab 1 ✅

---

## 🧹 Data Persistence
- [ ] Add items to cart
- [ ] Refresh page
- [ ] Cart items persist ✅
- [ ] Create order
- [ ] Refresh page
- [ ] Order persists ✅

---

## 🎯 Key Validations

✅ **No Authentication Required**
- Can checkout without login
- Can view orders without login
- Can track orders without login

✅ **Mock Payment Works**
- Payment processes instantly
- No real Razorpay needed
- Payment always succeeds

✅ **Preview Functionality**
- Preview pending orders visible
- File upload works
- Preview approval workflow works
- Status transitions correctly

✅ **Data Persists**
- Cart persists across refreshes
- Orders persist across refreshes
- Addresses persist across refreshes

✅ **Cross-Tab Sync**
- Changes sync across tabs
- Real-time updates work

---

## 🐛 If Something Doesn't Work

1. **Check console** for errors
2. **Verify mock mode** is enabled (yellow banner)
3. **Hard refresh** (Ctrl+Shift+R / Cmd+Shift+R)
4. **Check localStorage** in DevTools:
   - Should see: `wyshkit_mock_mode: "true"`
   - Should see: `wyshkit_mock_cart: [...]`
   - Should see: `wyshkit_mock_orders: [...]`
   - Should see: `wyshkit_mock_addresses: [...]`

---

**All checks passing? You've successfully tested the complete flow! 🎉**




