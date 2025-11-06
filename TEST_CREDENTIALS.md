# Test User Credentials

This document contains all test user credentials for development and testing purposes.

**⚠️ WARNING: These are test credentials only. Never use in production.**

## Customer Users

### Customer 1
- **Email:** `test@wyshkit.com`
- **Password:** `TestUser123!`
- **Phone:** `+919876543210`
- **User ID:** `00000000-0000-0000-0000-000000000001`
- **Role:** Customer
- **Name:** Test User
- **Test Scenarios:**
  - Basic browsing and cart operations
  - Order placement
  - Preview workflow (full cycle)
  - Payment authorization and capture

### Customer 2
- **Email:** `priya.sharma@example.com`
- **Password:** `TestUser123!`
- **Phone:** `+919876543220`
- **User ID:** `00000000-0000-0000-0000-000000000002`
- **Role:** Customer
- **Name:** Priya Sharma
- **Test Scenarios:**
  - Multiple orders
  - Order history
  - Saved items/favorites

### Customer 3
- **Email:** `rahul.kumar@example.com`
- **Password:** `TestUser123!`
- **Phone:** `+919876543230`
- **User ID:** `00000000-0000-0000-0000-000000000003`
- **Role:** Customer
- **Name:** Rahul Kumar
- **Test Scenarios:**
  - Edge cases
  - Error scenarios
  - Payment failures

## Partner Users

### Partner 1 - Premium Gifts
- **Email:** `partner1@premiumgifts.co`
- **Password:** `TestUser123!`
- **Phone:** `+919876543211`
- **User ID:** `00000000-0000-0000-0000-000000000101`
- **Role:** Seller
- **Name:** Premium Gifts Owner
- **Store ID:** `00000000-0000-0000-0000-000000000101`
- **Store Name:** Premium Gifts
- **Test Scenarios:**
  - Product management
  - Order management
  - Preview upload
  - Dashboard analytics

### Partner 2 - Gourmet Delights
- **Email:** `partner2@gourmetdelights.in`
- **Password:** `TestUser123!`
- **Phone:** `+919876543212`
- **User ID:** `00000000-0000-0000-0000-000000000102`
- **Role:** Seller
- **Name:** Gourmet Delights Owner
- **Store ID:** `00000000-0000-0000-0000-000000000102`
- **Store Name:** Gourmet Delights
- **Test Scenarios:**
  - Multiple stores
  - Promotional offers
  - Advertising requests

## Admin Users

### Admin User
- **Email:** `admin@wyshkit.com`
- **Password:** `Admin123!`
- **Phone:** `+919876543999`
- **User ID:** `00000000-0000-0000-0000-000000000999`
- **Role:** Admin
- **Name:** Admin User
- **Test Scenarios:**
  - Store approvals
  - Product approvals
  - Order management
  - Preview monitoring
  - Promotional offers management
  - Surge pricing management
  - Advertising management
  - Location management
  - Category management
  - Notification management

## Authentication Methods

All users support:
- **Email/Password Login**
- **Phone OTP Login** (for customers)
- **Google OAuth** (if configured)

## Default Test Addresses

### Customer 1 Default Address
- **Address ID:** `00000000-0000-0000-0000-000000000010`
- **Type:** Home
- **Address:** 123 Test Street, Test Building
- **Landmark:** Near Test Mall
- **City:** Mumbai
- **State:** Maharashtra
- **Pincode:** 400001
- **Is Default:** Yes

## Creation Method (2025 Pattern)

Test users are created using **Supabase Admin API** (battle-tested 2025 pattern, same as Swiggy/Fiverr).

### Creating Test Users

1. **Set up environment variables:**
   ```bash
   # Add to .env file
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   
   Get `SUPABASE_SERVICE_ROLE_KEY` from: Supabase Dashboard → Settings → API → service_role key

2. **Run the user creation script:**
   ```bash
   npx tsx scripts/create-test-users.ts
   ```

3. **Users will be created with:**
   - Proper password hashing (Supabase Auth format)
   - Verified email and phone (ready for OTP flows)
   - Corresponding user_profiles entries
   - All metadata and roles set correctly

### Notes

1. Users are created via Supabase Admin API (not SQL inserts) - this is the correct 2025 pattern
2. All test users have verified email and phone (for testing OTP flows)
3. Passwords are hashed using Supabase's secure password hashing
4. To reset test users, run the script again (it will update existing users)
5. ⚠️ **Deprecated**: `supabase/seed/test-users.sql` uses SQL inserts which don't work with Supabase Auth. Use the Admin API script instead.

## Login URLs

- **Customer Login:** `http://localhost:8080/login`
- **Partner Login:** `http://localhost:8080/partner/login`
- **Admin Login:** `http://localhost:8080/admin/login`

## Testing Workflows

### Preview Workflow (Fiverr 2025 Pattern)
1. Login as Customer 1
2. Add customizable product to cart (requires preview)
3. Complete checkout → Payment authorized (not captured)
4. Upload design file
5. Login as Partner 1 → Upload preview
6. Login as Customer 1 → Approve preview → Payment captured
7. Production starts

### Payment Capture Testing
1. Use Customer 1 with order containing custom items
2. Verify payment is authorized but not captured
3. After preview approval, verify payment is captured
4. Check payment status in admin panel

### Error Scenarios
1. Use Customer 3 for testing payment failures
2. Test network errors
3. Test invalid data scenarios

