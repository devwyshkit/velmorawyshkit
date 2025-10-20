# Database Migrations - Complete Run Order

**Last Updated:** October 20, 2025  
**Total Migrations:** 13 (all features complete)

---

## Prerequisites

- ✅ Supabase project set up
- ✅ SQL Editor access  
- ✅ Admin privileges
- ✅ Partner Portal and Customer UI deployed

---

## Migration Order (Run in Exact Sequence)

### PHASE 1: Core Partner Product Enhancements (4 migrations)

These add columns to existing `partner_products` and `partner_profiles` tables.

**Migration 1:** `ADD_BULK_PRICING_COLUMN.sql`  
**Feature:** #1 - Bulk Pricing UI  
**Purpose:** Adds `bulk_pricing` JSONB column for multi-tier pricing  
**Table:** partner_products  

**Migration 2:** `ADD_SPONSORED_FIELDS.sql`  
**Feature:** #5 - Sponsored Listings  
**Purpose:** Adds `sponsored`, `sponsored_start_date`, `sponsored_end_date`, `sponsored_fee_percent` columns  
**Table:** partner_products  

**Migration 3:** `ADD_SOURCING_LIMITS.sql`  
**Feature:** #11 - Sourcing Limits  
**Purpose:** Adds `sourcing_limit_monthly`, `sourcing_limit_enabled` columns  
**Table:** partner_products  

**Migration 4:** `ADD_FSSAI_FIELD.sql`  
**Feature:** Partner Onboarding  
**Purpose:** Adds `fssai_certificate` column (conditional KYC for food vendors)  
**Table:** partner_profiles  

---

### PHASE 2: New Feature Tables (9 migrations)

These create brand new tables. Can run in any order within this phase.

**Migration 5:** `ADD_CAMPAIGNS_TABLE.sql`  
**Feature:** #4 - Campaign Management  
**Creates:** campaigns, campaign_analytics  
**Purpose:** Promotional campaigns with featured placement  

**Migration 6:** `ADD_REVIEWS_TABLES.sql`  
**Feature:** #9 - Reviews Management  
**Creates:** reviews, review_responses, review_flags  
**Purpose:** Customer reviews with partner responses  

**Migration 7:** `ADD_DISPUTES_TABLES.sql`  
**Feature:** #2 - Dispute Resolution  
**Creates:** disputes, dispute_messages  
**Purpose:** Customer complaints with chat workflow  

**Migration 8:** `ADD_RETURNS_TABLES.sql`  
**Feature:** #3 - Returns & Refunds  
**Creates:** returns, return_events  
**Purpose:** Return requests with pickup/QC workflow  

**Migration 9:** `ADD_BADGES_TABLES.sql`  
**Feature:** #6 - Loyalty Badges  
**Creates:** badge_definitions, partner_badges  
**Includes:** 7 pre-seeded badge types  

**Migration 10:** `ADD_REFERRALS_TABLES.sql`  
**Feature:** #7 - Referral Program  
**Creates:** referral_codes, partner_referrals  
**Includes:** generate_referral_code() function  

**Migration 11:** `ADD_HELP_TABLES.sql`  
**Feature:** #12 - Help Center  
**Creates:** help_articles, support_tickets, ticket_messages  
**Includes:** 3 pre-seeded help articles  

**Migration 12:** `ADD_SOURCING_USAGE_TABLE.sql`  
**Feature:** #11 - Sourcing Limits (usage tracking)  
**Creates:** sourcing_usage  
**Includes:** reset_monthly_sourcing_limits() function  

**Migration 13:** `ADD_SPONSORED_ANALYTICS_TABLE.sql`  
**Feature:** #5 - Sponsored Listings (analytics)  
**Creates:** sponsored_analytics  
**Includes:** charge_daily_sponsored_fees() function  

---

### PHASE 3: Admin Console (Optional)

**Migration 14:** `ADD_ADMIN_TABLES.sql`  
**Feature:** Admin Console  
**Creates:** admin_users, admin_sessions, admin_audit_logs, partner_approvals, payouts, payout_transactions  
**Purpose:** Internal admin console (Week 1 Days 1-2 complete)  

---

## Quick Copy-Paste Script for Supabase

Run each migration separately in Supabase SQL Editor:

```sql
-- STEP 1: Open Supabase Dashboard → SQL Editor → New Query
-- STEP 2: Copy content of ADD_BULK_PRICING_COLUMN.sql → Run
-- STEP 3: Copy content of ADD_SPONSORED_FIELDS.sql → Run
-- ... continue for all 13 migrations
```

Or use CLI (if configured):
```bash
# From project root
supabase migration up
```

---

## Verification Queries

### After ALL Migrations:

**Count tables created:**
```sql
SELECT COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'campaigns', 'campaign_analytics',
  'reviews', 'review_responses', 'review_flags',
  'disputes', 'dispute_messages',
  'returns', 'return_events',
  'badge_definitions', 'partner_badges',
  'referral_codes', 'partner_referrals',
  'help_articles', 'support_tickets', 'ticket_messages',
  'sourcing_usage', 'sponsored_analytics'
);
-- Expected: 18 tables
```

**Verify badge definitions:**
```sql
SELECT type, name, icon, color 
FROM badge_definitions 
ORDER BY type;
-- Expected: 7 rows
```

**Verify help articles:**
```sql
SELECT title, category 
FROM help_articles 
WHERE published = TRUE;
-- Expected: 3 rows
```

**Check partner_products columns:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'partner_products'
AND column_name IN (
  'bulk_pricing', 'sponsored', 'sponsored_start_date',
  'sourcing_limit_monthly', 'sourcing_limit_enabled', 'add_ons'
)
ORDER BY column_name;
-- Expected: 6 rows
```

---

## Feature Activation Status

After running all migrations:

- ✅ **Feature #1:** Bulk Pricing - 100% functional
- ✅ **Feature #2:** Dispute Resolution - 100% functional
- ✅ **Feature #3:** Returns & Refunds - 100% functional
- ✅ **Feature #4:** Campaign Management - 100% functional
- ✅ **Feature #5:** Sponsored Listings - 90% (needs cron job)
- ✅ **Feature #6:** Loyalty Badges - 90% (needs cron job)
- ✅ **Feature #7:** Referral Program - 90% (needs trigger)
- ✅ **Feature #8:** Bulk Operations - 100% functional
- ✅ **Feature #9:** Reviews Management - 100% functional
- ✅ **Feature #10:** Stock Alerts - 100% functional
- ✅ **Feature #11:** Sourcing Limits - 90% (needs cron job)
- ✅ **Feature #12:** Help Center - 100% functional

---

## Troubleshooting

**"PGRST116: The result contains 0 rows"**  
→ Table exists but empty, add test data

**"permission denied for table X"**  
→ RLS policies active, check auth.uid() matches partner_id

**"column already exists"**  
→ Migration already run, safe to skip

**"relation does not exist"**  
→ Run Phase 1 before Phase 2

---

**MIGRATION STATUS: ALL 13 READY TO RUN** 🚀

Run these in Supabase to activate all features!
