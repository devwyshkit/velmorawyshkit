# 🔧 Troubleshooting Guide

## Issue: "Not Working" - Common Fixes

### 1. Mock Mode Toggle Not Visible

**Problem:** Can't see the ⚙️ settings icon

**Solutions:**
- ✅ Check you're in **development mode** (`npm run dev`)
- ✅ Mock mode toggle only shows in dev, not production
- ✅ Check browser console for errors
- ✅ Try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

**Verify:**
```javascript
// In browser console:
localStorage.getItem('wyshkit_mock_mode')
// Should return 'true' if enabled
```

---

### 2. Build Errors

**Problem:** `ensureDataVersion is not exported`

**Fixed:** ✅ Already fixed in `mock-data-validator.ts`

**If you see build errors:**
```bash
npm run build
# Should show: ✓ built successfully
```

---

### 3. Cart Not Showing Items

**Problem:** Cart is empty

**Solutions:**
- ✅ Enable mock mode first
- ✅ Cart is pre-populated automatically
- ✅ Check localStorage:
  ```javascript
  localStorage.getItem('wyshkit_mock_cart')
  // Should return array with items
  ```
- ✅ Try clearing and refreshing:
  ```javascript
  localStorage.clear()
  location.reload()
  ```

---

### 4. Orders Page Empty

**Problem:** No orders showing

**Solutions:**
- ✅ Enable mock mode
- ✅ Orders are pre-populated when you visit Orders page
- ✅ Check you're logged in (mock user auto-logged in mock mode)
- ✅ Check localStorage:
  ```javascript
  localStorage.getItem('wyshkit_mock_orders')
  // Should return array with 3 orders
  ```

---

### 5. Preview Not Working

**Problem:** Preview pending order not showing upload button

**Solutions:**
- ✅ Find order with status "preview_pending"
- ✅ Order #ORD-11223344 should have this status
- ✅ Click "Track Order" on that order
- ✅ Should see "Upload Files" button
- ✅ Check order has `preview_status: 'pending'` in order_items

**Verify:**
```javascript
const orders = JSON.parse(localStorage.getItem('wyshkit_mock_orders') || '[]')
const previewOrder = orders.find(o => o.status === 'preview_pending')
console.log(previewOrder)
// Should show order with preview_pending status
```

---

### 6. Payment Not Working

**Problem:** Payment fails or doesn't process

**Solutions:**
- ✅ In mock mode, payment always succeeds
- ✅ No real Razorpay needed
- ✅ Check console for errors
- ✅ Verify `isMockPaymentMode()` returns true:
  ```javascript
  // Check in console
  import.meta.env.DEV // Should be true
  localStorage.getItem('wyshkit_mock_mode') // Should be 'true'
  ```

---

### 7. Addresses Not Showing

**Problem:** Address selection sheet is empty

**Solutions:**
- ✅ Addresses are pre-populated when sheet opens
- ✅ Check localStorage:
  ```javascript
  localStorage.getItem('wyshkit_mock_addresses')
  // Should return array with 3 addresses
  ```
- ✅ Try refreshing the address sheet

---

### 8. Cross-Tab Sync Not Working

**Problem:** Changes in one tab don't reflect in another

**Solutions:**
- ✅ Both tabs must have mock mode enabled
- ✅ StorageEvent only fires for cross-tab changes
- ✅ Same-tab changes use CustomEvent
- ✅ Check both tabs have same localStorage data

---

### 9. Data Not Persisting

**Problem:** Data lost on page refresh

**Solutions:**
- ✅ Check localStorage is enabled
- ✅ Some browsers block localStorage in certain modes
- ✅ Try in normal (non-incognito) mode first
- ✅ Check browser console for quota errors
- ✅ Verify localStorage is writable:
  ```javascript
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
    console.log('localStorage works')
  } catch (e) {
    console.error('localStorage blocked:', e)
  }
  ```

---

### 10. Yellow Banner Not Showing

**Problem:** Mock mode enabled but no banner

**Solutions:**
- ✅ Check `MockModeToggle` component is in App.tsx
- ✅ Verify `isMockModeEnabled()` returns true
- ✅ Check browser console for React errors
- ✅ Verify component is rendering:
  ```javascript
  // In React DevTools, look for MockModeToggle component
  ```

---

## Quick Diagnostic Commands

**Check mock mode status:**
```javascript
// In browser console
const isDev = import.meta.env.DEV
const mockMode = localStorage.getItem('wyshkit_mock_mode')
console.log('Dev mode:', isDev, 'Mock mode:', mockMode)
```

**Check all mock data:**
```javascript
console.log('Cart:', localStorage.getItem('wyshkit_mock_cart'))
console.log('Orders:', localStorage.getItem('wyshkit_mock_orders'))
console.log('Addresses:', localStorage.getItem('wyshkit_mock_addresses'))
```

**Clear all mock data:**
```javascript
localStorage.removeItem('wyshkit_mock_mode')
localStorage.removeItem('wyshkit_mock_cart')
localStorage.removeItem('wyshkit_mock_orders')
localStorage.removeItem('wyshkit_mock_addresses')
location.reload()
```

**Force enable mock mode:**
```javascript
localStorage.setItem('wyshkit_mock_mode', 'true')
location.reload()
```

---

## Still Not Working?

1. **Check browser console** for errors (F12 → Console)
2. **Check network tab** for failed requests
3. **Try in normal browser** (not incognito) first
4. **Clear browser cache** completely
5. **Restart dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```
6. **Check if port 8080 is available**:
   ```bash
   lsof -ti:8080
   # Should show process ID
   ```

---

## Expected Behavior

When everything works:

✅ **Yellow banner** at top: "🧪 MOCK MODE ENABLED"
✅ **Settings icon** visible in bottom-right
✅ **Cart** has 2 items pre-populated
✅ **Orders page** shows 3 orders
✅ **Preview pending** order visible
✅ **No authentication** required
✅ **Payment** succeeds instantly
✅ **Data persists** across refreshes

---

**Need more help?** Check the browser console for specific error messages!


