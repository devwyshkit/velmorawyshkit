#!/bin/bash

# Wyshkit Supabase Migration Script
# Applies all 13 cleanup migrations using Docker + PostgreSQL

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Wyshkit Supabase Migration Runner (Docker)           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Project configuration
PROJECT_REF="usiwuxudinfxttvrcczb"
SUPABASE_URL="https://usiwuxudinfxttvrcczb.supabase.co"

echo -e "${YELLOW}Project:${NC} $SUPABASE_URL"
echo -e "${YELLOW}Project Ref:${NC} $PROJECT_REF"
echo ""

# Get database password
echo -e "${YELLOW}To get your database password:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo "2. Copy the password from 'Database password' section"
echo ""
read -sp "Enter database password: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Error: Database password is required${NC}"
    exit 1
fi

# Test Docker
echo ""
echo -e "${BLUE}Checking Docker...${NC}"
if ! docker --version > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not installed or not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is available${NC}"

# Test database connection
echo ""
echo -e "${BLUE}Testing database connection...${NC}"
if docker run --rm postgres:15 psql "postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo -e "${RED}Please check your password and try again${NC}"
    exit 1
fi

# List of migrations
MIGRATIONS=(
    "001_FIX_RLS_AUTH_PERFORMANCE.sql"
    "002_CONSOLIDATE_RLS_POLICIES.sql"
    "003_ADD_MISSING_FK_INDEXES.sql"
    "004_REMOVE_UNUSED_INDEXES.sql"
    "005_FIX_SECURITY_DEFINER_VIEWS.sql"
    "006_ENABLE_RLS_ON_PUBLIC_TABLES.sql"
    "007_FIX_USER_METADATA_IN_RLS.sql"
    "008_FIX_FUNCTION_SEARCH_PATH.sql"
    "009_ADD_MISSING_RLS_POLICIES.sql"
    "010_FIX_REMAINING_RLS_PERFORMANCE.sql"
    "011_CONSOLIDATE_DUPLICATE_POLICIES.sql"
    "012_VERIFY_FK_INDEXES.sql"
    "013_VERIFY_UNUSED_INDEXES_REMOVED.sql"
)

# Apply migrations
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Applying ${#MIGRATIONS[@]} migrations...                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for MIGRATION in "${MIGRATIONS[@]}"; do
    FILE_PATH="supabase/migrations/$MIGRATION"
    
    if [ ! -f "$FILE_PATH" ]; then
        echo -e "${RED}✗ SKIP: $MIGRATION (file not found)${NC}"
        SKIP_COUNT=$((SKIP_COUNT + 1))
        continue
    fi
    
    echo -e "${YELLOW}► Applying: $MIGRATION${NC}"
    
    if docker run --rm -i postgres:15 psql "postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres" < "$FILE_PATH" > /tmp/migration_output.log 2>&1; then
        echo -e "${GREEN}  ✓ SUCCESS${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}  ✗ FAILED${NC}"
        echo -e "${RED}  Error output:${NC}"
        tail -5 /tmp/migration_output.log | sed 's/^/  /'
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Small delay to avoid rate limiting
    sleep 0.5
done

# Summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Migration Summary                                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}✗ Failed: $FAIL_COUNT${NC}"
echo -e "${YELLOW}⊘ Skipped: $SKIP_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Some migrations failed. This may be normal if:${NC}"
    echo "  • The migration was already applied"
    echo "  • The object already exists"
    echo "  • The table/view doesn't exist (safe to ignore)"
    echo ""
fi

# Next steps
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Next Steps                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "1. Verify results in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/database"
echo ""
echo "2. Check the Linter tab to see if issues are resolved"
echo "   Expected: ~19 issues remaining (down from 54)"
echo ""
echo "3. Expected improvements:"
echo "   ✓ 0 security_definer_view errors"
echo "   ✓ 0 rls_disabled_in_public errors"
echo "   ✓ 0 function_search_path_mutable warnings"
echo "   ⚠ ~18 rls_references_user_metadata errors (JWT checks)"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✨ All migrations completed successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some migrations failed. Please review the errors above.${NC}"
    exit 1
fi

