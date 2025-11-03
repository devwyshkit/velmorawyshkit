# Wyshkit Routes Documentation

## Customer Routes (Root Level - Swiggy 2025 Pattern)

### Public Routes
- `/` - Home (discovery, partners, occasions)
- `/login` - Customer login (phone OTP or email)
- `/signup` - Customer signup
- `/search` - Search partners and items
- `/catalog/:storeId` - Partner catalog (all items from a partner)
- `/help` - Help center (public)

### Protected Routes (Require Authentication)
- `/favorites` - Saved/favorited items
- `/orders` - Order history
- `/order/:id/track` - Order tracking page
- `/order/:orderId/preview` - Preview approval page (for customizable items)
- `/account/addresses` - Address book
- `/account/addresses/add` - Add new address

### Legacy Redirects (Backward Compatibility)
- `/customer/home` → `/`
- `/customer/search` → `/search`
- `/customer/login` → `/login`
- `/customer/signup` → `/signup`
- `/customer/favorites` → `/favorites`
- `/customer/saved` → `/favorites`
- `/customer/checkout` → `/` (checkout is modal-based, not a route)
- `/customer/profile` → `/` (AccountSheet replaces Profile page)
- `/customer/wishlist` → `/favorites`
- `/saved` → `/favorites`
- `/favourites` → `/favorites`
- `/profile` → `/` (AccountSheet replaces Profile page)

---

## Partner Routes (Business Dashboard)

### Public
- `/partner/login` - Partner login
- `/partner/signup` - Partner signup
- `/partner/verify-email` - Email verification
- `/partner/onboarding` - Partner onboarding

### Protected Dashboard Routes
All routes under `/partner/dashboard/*`:
- `/partner/dashboard` - Dashboard home
- `/partner/dashboard/products` - Product management
- `/partner/dashboard/orders` - Order management
- `/partner/dashboard/earnings` - Earnings & analytics
- `/partner/dashboard/reviews` - Review management
- `/partner/dashboard/campaigns` - Campaign manager
- `/partner/dashboard/referrals` - Referral program
- `/partner/dashboard/badges` - Badge system
- `/partner/dashboard/disputes` - Dispute resolution
- `/partner/dashboard/returns` - Returns management
- `/partner/dashboard/help` - Help center
- `/partner/dashboard/profile` - Partner profile

---

## Admin Routes (Internal Console)

### Public
- `/admin/login` - Admin login

### Protected Dashboard Routes
All routes under `/admin/dashboard/*`:
- `/admin/dashboard` - Admin dashboard
- `/admin/dashboard/partners` - Partner management
- `/admin/dashboard/product-approvals` - Product approval queue
- `/admin/dashboard/orders` - All orders
- `/admin/dashboard/disputes` - Dispute management
- `/admin/dashboard/payouts` - Payout management
- `/admin/dashboard/analytics` - Platform analytics
- `/admin/dashboard/content` - Content management
- `/admin/dashboard/settings` - Platform settings
- `/admin/dashboard/users` - User management
- `/admin/dashboard/audit` - Audit logs
- `/admin/dashboard/commission` - Commission management
- `/admin/dashboard/fees` - Fee management

### Legacy Redirect
- `/admin/partner-approvals` → `/admin/dashboard/partners`

---

## Utility Routes

- `/unauthorized` - Access denied page
- `*` - 404 Not Found page

---

## Route Naming Convention

- **Customer Routes**: Root level (`/`, `/search`, `/login`)
- **Partner Routes**: `/partner/*` prefix
- **Admin Routes**: `/admin/*` prefix
- **Account Routes**: `/account/*` prefix (addresses, etc.)

---

## Notes

1. **Checkout is Modal-Based**: No `/checkout` route - handled by `CheckoutCoordinator` modal
2. **Account is Bottom Sheet**: No `/profile` route - handled by `AccountSheet` bottom sheet
3. **Order Confirmation**: No separate route - handled by `OrderConfirmationSheet` modal
4. **All Customer Routes Use**: `RouteMap` helper from `src/routes.ts`

---

## Testing Routes

Use test user: `test@wyshkit.com` / `TestUser123!`

1. Public routes work without auth
2. Protected routes redirect to `/login` if not authenticated
3. Legacy redirects work for backward compatibility
4. 404 page shows for unknown routes



