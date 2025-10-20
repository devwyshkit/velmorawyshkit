# Database Migrations Run Order

**Run these migrations in Supabase SQL Editor in the following order:**

## Product Features (Run First)
1. `ADD_BULK_PRICING_COLUMN.sql` - Adds bulk_pricing JSONB column
2. `ADD_SPONSORED_FIELDS.sql` - Adds sponsored listing columns + analytics table
3. `ADD_SOURCING_LIMITS.sql` - Adds sourcing limits + usage tracking
4. `ADD_FSSAI_FIELD.sql` - Adds FSSAI certificate fields (conditional)
5. `ADD_STOCK_ALERTS_COLUMNS.sql` - Adds stock alert thresholds

## Partner Features
6. `ADD_REVIEWS_TABLES.sql` - Reviews, responses, flags tables
7. `ADD_CAMPAIGNS_TABLES.sql` - Campaigns + analytics tables
8. `ADD_BADGES_SPONSORED_TABLES.sql` - Badges + definitions (may overlap with #2, check)
9. `ADD_REFERRALS_TABLES.sql` - Referral codes + tracking
10. `ADD_DISPUTES_TABLES.sql` - Disputes + messages tables
11. `ADD_RETURNS_TABLES.sql` - Returns + events tables
12. `ADD_HELP_TABLES.sql` - Help articles + support tickets

## Verification After All Migrations

```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'partner_products',
  'sponsored_analytics',
  'sourcing_usage',
  'reviews',
  'review_responses',
  'review_flags',
  'campaigns',
  'campaign_analytics',
  'partner_badges',
  'badge_definitions',
  'partner_referrals',
  'referral_codes',
  'disputes',
  'dispute_messages',
  'returns',
  'return_events',
  'help_articles',
  'support_tickets',
  'ticket_messages'
)
ORDER BY table_name;

-- Verify partner_products has all new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'partner_products'
AND column_name IN (
  'bulk_pricing',
  'sponsored',
  'sponsored_start_date',
  'sponsored_end_date',
  'sourcing_available',
  'sourcing_limit_monthly',
  'stock_alert_threshold'
)
ORDER BY column_name;
```

## Expected Results

- **19 tables** should exist after all migrations
- **7 new columns** in partner_products table
- Zero errors during migration execution

## Troubleshooting

**If migration fails:**
1. Check if table already exists (may skip with IF NOT EXISTS)
2. Check for conflicting column names
3. Ensure COMPLETE_PLATFORM_REBUILD.sql was run first
4. Check Supabase logs for specific errors

**If columns missing:**
- Re-run the specific migration
- Check spelling in column_name

**To reset and start fresh:**
```sql
-- WARNING: This deletes all data!
DROP TABLE IF EXISTS 
  sourcing_usage, sponsored_analytics,
  review_flags, review_responses, reviews,
  campaign_analytics, campaigns,
  partner_badges, badge_definitions,
  partner_referrals, referral_codes,
  dispute_messages, disputes,
  return_events, returns,
  ticket_messages, support_tickets, help_articles
CASCADE;

-- Then re-run migrations 1-12
```

