# Clear Browser Cache and Service Worker - Complete Fix

## Critical Issue

The browser is loading a **cached/stale version** of JavaScript modules that reference the old function name `getMockOrdersByCustomer` instead of `getOrdersByCustomer`.

## Root Cause

1. **Service Worker Cache**: Service worker is caching old JavaScript files
2. **Browser Module Cache**: Browser has cached old modules with timestamp `?t=1762346598144`
3. **Port Mismatch**: Browser on port 8081 but server on 8080 (proxy/port forwarding)

## Complete Fix Steps

### Step 1: Unregister Service Worker (CRITICAL)

**Open Browser Console** (F12) and run:

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
  console.log('✅ Service workers unregistered');
});

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  console.log('✅ All caches cleared');
});
```

### Step 2: Clear Browser Cache Completely

#### Chrome/Edge:
1. Press `F12` to open DevTools
2. Right-click the **refresh button** (next to address bar)
3. Select **"Empty Cache and Hard Reload"**
4. OR: Go to Settings → Privacy → Clear browsing data → Cached images and files → Clear

#### Firefox:
1. Press `F12` to open DevTools
2. Go to Network tab
3. Check "Disable cache"
4. Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

#### Safari:
1. Develop menu → Empty Caches
2. Or: `Cmd+Option+E` then `Cmd+R`

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Hard Refresh Browser

After restarting dev server:
- **Mac**: `Cmd + Shift + R` or `Cmd + Option + R`
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`

### Step 5: Verify Fix

1. Open browser console (F12)
2. Check for errors - should see **NO** `getMockOrdersByCustomer` errors
3. App should load without import errors
4. WebSocket errors may still appear (non-critical - HMR issue only)

## Alternative: Use Incognito/Private Window

If issues persist:
1. Open browser in **Incognito/Private mode**
2. Navigate to `http://localhost:8080`
3. This bypasses all caches and service workers

## What Was Fixed

1. ✅ **Service Worker**: Updated cache version to force invalidation
2. ✅ **Service Worker**: Added code to skip caching Vite dev modules
3. ✅ **Development Mode**: Service worker now auto-unregisters in dev
4. ✅ **Vite HMR**: Fixed port configuration to handle port mismatches
5. ✅ **Cache Headers**: Added no-cache headers to prevent aggressive caching
6. ✅ **HTML Meta Tags**: Added cache-busting meta tags

## If Still Not Working

1. **Close ALL browser tabs** with the app
2. **Completely close the browser**
3. **Restart browser**
4. **Clear browser data completely** (Settings → Clear browsing data → All time)
5. **Restart dev server**
6. **Open in incognito window**

## Technical Details

- **Error**: `getMockOrdersByCustomer` not found
- **Cause**: Cached module with timestamp `?t=1762346598144`
- **Solution**: Service worker unregistration + cache clearing + hard refresh



