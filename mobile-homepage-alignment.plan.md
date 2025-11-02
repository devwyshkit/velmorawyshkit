# Swiggy & Fiverr 2025 Comprehensive Audit - Implementation Plan

## Critical Issues Found

### 1. Account Page - ANTI-PATTERN ❌
**Current:** Full page navigation (`/profile`)  
**Expected (Swiggy 2025):** Bottom sheet/modal  
**Impact:** Breaks user flow, navigates away from context  
**Fix Required:** Convert Profile page to AccountSheet bottom sheet component

### 2. Preview Notification - INCOMPLETE ⚠️
**Current:** Toast notification only when user is on Track page  
**Expected (Fiverr 2025):** Persistent notification badge/banner visible across all pages  
**Impact:** User misses preview if not actively on track page  
**Fix Required:** Add persistent preview ready notification banner/badge

### 3. Login Flow Breaking Checkout - NEEDS TESTING ⏳
**Issue:** User reports checkout not working after login  
**Fix Required:** Test full checkout flow after authentication, fix any breaking issues

## Implementation Tasks

### Task 1: Convert Account Page to Bottom Sheet
- Create `AccountSheet.tsx` component (similar to CartSheet)
- Update CustomerMobileHeader to open AccountSheet instead of navigating
- Update CustomerBottomNav to open AccountSheet on Account icon click
- Keep Profile page for deep links, but make header/bottom nav use sheet
- Ensure sheet can be dismissed with back button

### Task 2: Add Persistent Preview Notification
- Create `PreviewNotificationBanner.tsx` component
- Show banner when user has orders with `preview_status === 'preview_ready'`
- Banner should be persistent across all pages (like Fiverr 2025)
- Clicking banner should navigate to preview approval
- Add real-time subscription to check for preview ready status globally
- Show notification badge count if multiple previews ready

### Task 3: Test & Fix Login Flow
- Test login functionality
- Test full checkout flow after login
- Verify address selection works
- Verify payment selection works
- Verify order confirmation modal appears
- Fix any breaking issues found

## Swiggy 2025 Pattern Compliance

### Must Fix
- [ ] Account opens as bottom sheet (not full page)
- [ ] All navigation modals work correctly
- [ ] Checkout flow works after login

### Fiverr 2025 Pattern Compliance

### Must Fix
- [ ] Preview ready notification visible across all pages
- [ ] Notification persists until user acts on it
- [ ] Notification badge shows count of ready previews
- [ ] Click notification navigates to preview approval
