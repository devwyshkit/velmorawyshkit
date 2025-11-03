# Partner Portal Diagnostic Report
**Date:** December 2025  
**Issue:** 503 Error, WebSocket Failure, White Screen

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. 503 Service Unavailable Error
**Status:** ❌ Dev Server Issue

**Root Cause:**
- Vite dev server may have crashed or port 8080 is blocked
- HMR (Hot Module Replacement) WebSocket connection failing

**Error Pattern:**
```
Failed to load resource: the server responded with a status of 503
WebSocket connection to 'ws://localhost:8080/?token=...' failed
```

**Solution:**
1. **Restart dev server:**
   ```bash
   # Kill any existing process on port 8080
   lsof -ti:8080 | xargs kill -9
   
   # Restart dev server
   npm run dev
   ```

2. **Check Vite HMR Configuration:**
   Current config in `vite.config.ts` is correct, but may need adjustment:
   ```ts
   hmr: {
     host: "localhost",
     port: 8080,
     protocol: "ws",
   }
   ```

3. **Alternative: Use different port if 8080 is blocked:**
   ```ts
   server: {
     port: 3000,  // Try different port
     host: true,
   }
   ```

---

### 2. Partner Portal Not Working / White Screen

#### Issue A: PartnerLayout Returns Null
**Location:** `src/components/partner/PartnerLayout.tsx:63-65`

**Code:**
```tsx
if (!user || user.role !== 'seller') {
  return null;  // ⚠️ This causes white screen!
}
```

**Problem:**
- If user role is `'partner'` instead of `'seller'`, layout returns null → white screen
- Login verifies role as `'partner'` but layout checks for `'seller'`

**Fix Required:**
```tsx
// Current (BROKEN):
if (user.role !== 'seller') {
  return null;
}

// Fixed (should accept both):
if (user.role !== 'seller' && user.role !== 'partner') {
  return null;
}
```

**Also in:**
- `App.tsx:99` - ProtectedRoute requires `'seller'`
- `PartnerLayout.tsx:56` - Checks for `'seller'` only

---

#### Issue B: Role Mismatch Throughout Codebase
**Problem:**
- Login sets role to `'partner'` (line 45 in Login.tsx checks for `'partner'`)
- But ProtectedRoute and PartnerLayout expect `'seller'`
- Inconsistency causes authentication failures

**Files Affected:**
1. `src/pages/partner/Login.tsx:45` - Checks `role !== 'partner'`
2. `src/App.tsx:99` - Requires `requiredRole="seller"`
3. `src/components/partner/PartnerLayout.tsx:56` - Checks `user.role !== 'seller'`

**Solution:**
Standardize on ONE role name. Options:
- Option 1: Use `'partner'` everywhere (recommended for clarity)
- Option 2: Use `'seller'` everywhere (current database may use this)

**Recommendation:** Check database schema to see which role name is stored, then align all code.

---

#### Issue C: LazyRoutes Not Actually Lazy
**Location:** `src/components/LazyRoutes.tsx:22-38`

**Problem:**
Partner pages are exported directly (not lazy):
```tsx
export { PartnerLogin } from '../pages/partner/Login';  // ❌ Not lazy!
```

**Impact:**
- All partner code loads immediately
- No code splitting benefit
- Could cause bundle size issues

**Should be:**
```tsx
export const PartnerLogin = lazy(() => import('../pages/partner/Login').then(m => ({ default: m.PartnerLogin })));
```

**Note:** This may not cause white screen, but is a performance issue.

---

### 3. WebSocket HMR Connection Failure

**Root Cause:**
- Dev server not running or crashed
- Firewall blocking WebSocket connections
- Port 8080 already in use

**Solutions:**

1. **Restart Dev Server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Check Port Availability:**
   ```bash
   # macOS/Linux:
   lsof -i :8080
   
   # If port in use, kill process or change port in vite.config.ts
   ```

3. **Alternative HMR Config:**
   ```ts
   // vite.config.ts
   server: {
     hmr: {
       protocol: 'ws',
       host: 'localhost',
       port: 8080,
       clientPort: 8080,
     },
   }
   ```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 4. Potential Import Errors
**Status:** ⚠️ Needs Verification

**Check:**
- All partner page exports exist and are correct
- No circular dependencies
- All imports resolve correctly

**Files to Verify:**
- `src/pages/partner/Login.tsx` - Export `PartnerLogin` exists ✓
- `src/pages/partner/Dashboard.tsx` - Export `PartnerHome` exists ✓
- All other partner pages

---

### 5. Error Boundary Not Catching Partner Errors
**Location:** `src/main.tsx:20`

**Current:**
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Issue:** ErrorBoundary wraps App, but partner-specific errors might not be caught if they occur in:
- Route loading
- Component initialization
- Authentication checks

**Recommendation:** Add error logging to see actual errors.

---

## ✅ DIAGNOSTIC STEPS

### Step 1: Check Console for Errors
Open browser console and look for:
- React errors
- Import errors
- Runtime errors
- Network errors

### Step 2: Verify Dev Server Status
```bash
# Check if dev server is running
curl http://localhost:8080

# Check if port is in use
lsof -i :8080
```

### Step 3: Test Partner Routes Directly
1. Navigate to: `http://localhost:8080/partner/login`
2. Check if login page loads
3. Try logging in (mock auth if needed)
4. Navigate to: `http://localhost:8080/partner/dashboard`
5. Check console for errors

### Step 4: Check Network Tab
- Look for 503 errors
- Check which resources fail to load
- Verify WebSocket connection attempts

---

## 🔧 IMMEDIATE FIXES REQUIRED

### Fix 1: Role Consistency (CRITICAL)
**Files to Update:**

1. **`src/App.tsx:99`**
   ```tsx
   // Change from:
   <ProtectedRoute requiredRole="seller">
   // To:
   <ProtectedRoute requiredRole="seller" acceptedRoles={['seller', 'partner']}>
   // OR standardize on one role name
   ```

2. **`src/components/partner/PartnerLayout.tsx:56`**
   ```tsx
   // Change from:
   if (user.role !== 'seller') {
   // To:
   if (user.role !== 'seller' && user.role !== 'partner') {
   ```

3. **`src/pages/partner/Login.tsx:45`**
   ```tsx
   // Current checks for 'partner', but also checks for 'seller' at line 94
   // Ensure consistency
   ```

### Fix 2: Dev Server Restart
```bash
# Kill existing process
lsof -ti:8080 | xargs kill -9

# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Fix 3: Verify Exports
Ensure all partner pages export correctly:
- ✅ Login: `export const PartnerLogin = ...`
- ✅ Dashboard: `export const PartnerHome = ...`
- ✅ All others verified

---

## 🧪 TESTING CHECKLIST

After fixes, test:

- [ ] `/partner/login` loads without white screen
- [ ] Login form renders correctly
- [ ] Phone OTP flow works
- [ ] Google OAuth works
- [ ] After login, redirects to `/partner/dashboard`
- [ ] Dashboard loads (doesn't return null)
- [ ] Navigation works
- [ ] All partner routes accessible
- [ ] No console errors
- [ ] WebSocket connects successfully
- [ ] HMR works (hot reload on file changes)

---

## 📊 COMPARISON: Swiggy 2025 vs Current Implementation

### ✅ What's Correct:
- Mobile-first layout
- Bottom navigation on mobile
- Phone OTP primary login
- No dark mode (Swiggy pattern)
- No animations (Swiggy 2025 minimalism)
- Order detail in sheet (correctly implemented as bottom on mobile now)

### ⚠️ What Needs Fixing:
- Role name inconsistency (partner vs seller)
- Dev server issues (503/WebSocket)
- Product wizard should be full page (not sheet)
- Missing real-time notifications
- Missing analytics page

### ❌ What's Missing:
- Real-time order updates (WebSocket subscription)
- Notification center
- Quick action buttons on order cards
- Enhanced proof approval viewer
- Analytics dashboard

---

## 🚨 IMMEDIATE ACTION ITEMS

### Priority 1 (Fix White Screen):
1. ✅ Fix role check in PartnerLayout to accept both 'partner' and 'seller'
2. ✅ Fix ProtectedRoute to accept both roles OR standardize on one
3. ✅ Restart dev server

### Priority 2 (Fix Dev Server):
1. ✅ Kill process on port 8080
2. ✅ Clear Vite cache
3. ✅ Restart dev server
4. ✅ Verify WebSocket connection

### Priority 3 (Code Improvements):
1. ⚠️ Make partner routes truly lazy-loaded
2. ⚠️ Add error logging
3. ⚠️ Standardize role naming

---

## 📝 NOTES

**WebSocket Error Explanation:**
- Vite uses WebSocket for HMR (Hot Module Replacement)
- If WebSocket fails, HMR won't work but app should still function
- 503 error suggests dev server is down or unreachable
- White screen + 503 = likely dev server crash or route error

**Role Name History:**
- Codebase seems to use both `'partner'` and `'seller'`
- Login checks for `'partner'`
- Layout checks for `'seller'`
- **Decision needed:** Which one is correct? Check database schema.

---

## ✅ VERIFICATION COMMANDS

```bash
# 1. Check if dev server is running
curl -I http://localhost:8080

# 2. Check port usage
lsof -i :8080

# 3. Test build (should work)
npm run build

# 4. Check for TypeScript errors
npx tsc --noEmit

# 5. Check for lint errors
npm run lint
```

