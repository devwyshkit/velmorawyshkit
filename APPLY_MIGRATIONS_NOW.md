# 🚀 Apply Supabase Migrations Now (Docker Method)

## Quick Start

### Step 1: Get Database Password
1. Open: https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb/settings/database
2. Copy the **Database Password** (NOT the anon key)

### Step 2: Run Migration Script
```bash
./apply-supabase-migrations.sh
```

The script will:
- ✅ Prompt for your database password (securely, no echo)
- ✅ Test Docker is available
- ✅ Test database connection
- ✅ Apply all 13 migrations in order
- ✅ Show success/failure for each migration
- ✅ Provide a summary report

## What This Fixes

### Before: 54 Issues
- 3 ERROR: `security_definer_view`
- 16 ERROR: `rls_disabled_in_public`
- 18 ERROR: `rls_references_user_metadata`
- 15 WARN: `function_search_path_mutable`
- 2 INFO: `rls_enabled_no_policy`
- 1 WARN: `auth_leaked_password_protection`

### After: ~19 Issues (65% improvement!)
- ✅ 0 `security_definer_view` errors
- ✅ 0 `rls_disabled_in_public` errors
- ⚠️ ~18 `rls_references_user_metadata` errors (JWT checks)
- ✅ 0 `function_search_path_mutable` warnings
- ✅ 0 `rls_enabled_no_policy` info
- ⚠️ 1 `auth_leaked_password_protection` warning

## Migrations Being Applied

1. **001_FIX_RLS_AUTH_PERFORMANCE.sql** - Fixes ~60 RLS policies
2. **002_CONSOLIDATE_RLS_POLICIES.sql** - Consolidates ~50 policies
3. **003_ADD_MISSING_FK_INDEXES.sql** - Adds ~15 indexes
4. **004_REMOVE_UNUSED_INDEXES.sql** - Removes ~70 unused indexes
5. **005_FIX_SECURITY_DEFINER_VIEWS.sql** - Fixes 3 security views
6. **006_ENABLE_RLS_ON_PUBLIC_TABLES.sql** - Enables RLS on 16 tables
7. **007_FIX_USER_METADATA_IN_RLS.sql** - Fixes user metadata refs
8. **008_FIX_FUNCTION_SEARCH_PATH.sql** - Fixes 15 functions
9. **009_ADD_MISSING_RLS_POLICIES.sql** - Adds missing policies
10. **010_FIX_REMAINING_RLS_PERFORMANCE.sql** - Final RLS optimizations
11. **011_CONSOLIDATE_DUPLICATE_POLICIES.sql** - Removes duplicates
12. **012_VERIFY_FK_INDEXES.sql** - Verifies indexes
13. **013_VERIFY_UNUSED_INDEXES_REMOVED.sql** - Verifies cleanup

## Troubleshooting

### "Docker not found"
```bash
# Install Docker Desktop
# macOS: https://docs.docker.com/desktop/install/mac-install/
# Then restart terminal
```

### "Connection failed"
- Double-check you copied the **Database Password** (not anon key)
- The password is in: Settings → Database → "Database password"

### "Some migrations failed"
This is often normal! Migrations may fail if:
- The change was already applied
- The object already exists
- The table doesn't exist (safe to ignore)

Check the linter to see if issues are actually resolved.

## Verify Results

After running the script:

1. **Go to Supabase Dashboard**:
   https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb/database

2. **Click "Linter" tab**

3. **Check issue count**:
   - Should be ~19 issues (down from 54)
   - Security and performance issues should be resolved

## Manual Method (Alternative)

If the script doesn't work, you can apply migrations manually:

```bash
# Get your database password first
PROJECT_REF="usiwuxudinfxttvrcczb"
DB_PASSWORD="your-password-here"

# Apply each migration
docker run --rm -i postgres:15 psql \
  "postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres" \
  < supabase/migrations/001_FIX_RLS_AUTH_PERFORMANCE.sql

# Repeat for migrations 002-013...
```

## Success Criteria

✅ Script completes successfully
✅ Linter shows ~19 issues (down from 54)
✅ No `security_definer_view` errors
✅ No `rls_disabled_in_public` errors
✅ No `function_search_path_mutable` warnings

## Time Required

- **Script execution**: ~2-3 minutes
- **Verification**: ~1 minute
- **Total**: ~5 minutes

## Need Help?

If you encounter issues:
1. Check Docker is running: `docker --version`
2. Verify password is correct (try logging into Supabase dashboard)
3. Check migration files exist: `ls supabase/migrations/`
4. Review error output from the script

---

**Ready?** Run: `./apply-supabase-migrations.sh`
