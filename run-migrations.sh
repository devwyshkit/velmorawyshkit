#!/bin/bash

# Wyshkit Database Migrations Runner
# Uses Docker to execute SQL migrations against Supabase

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Wyshkit Database Migrations"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Source environment variables
source .env

# Extract project ref from Supabase URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed -n 's|https://\([^.]*\)\.supabase\.co|\1|p')

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}Error: Could not extract project reference from SUPABASE_URL${NC}"
    exit 1
fi

echo -e "${YELLOW}📌 Supabase Project: $PROJECT_REF${NC}"
echo ""

# Note: For actual migration, you'll need the database password
# Get it from: Supabase Dashboard → Settings → Database → Connection string
# For now, we'll output the commands you need to run manually

echo -e "${YELLOW}ℹ️  Docker Migration Commands${NC}"
echo "Get your database password from Supabase Dashboard → Settings → Database"
echo ""
echo "Then run these commands (replace YOUR_PASSWORD):"
echo ""

# Phase 1: Core Product Enhancements
echo -e "${GREEN}# PHASE 1: Core Product Enhancements${NC}"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_BULK_PRICING_COLUMN.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_SPONSORED_FIELDS.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_SOURCING_LIMITS.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_FSSAI_FIELD.sql"
echo ""

# Phase 2: New Feature Tables
echo -e "${GREEN}# PHASE 2: New Feature Tables${NC}"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_CAMPAIGNS_TABLE.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_REVIEWS_TABLES.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_DISPUTES_TABLES.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_RETURNS_TABLES.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_BADGES_TABLES.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_REFERRALS_TABLES.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_HELP_TABLES.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_SOURCING_USAGE_TABLE.sql"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_SPONSORED_ANALYTICS_TABLE.sql"
echo ""

# Phase 3: Admin Console (Optional)
echo -e "${GREEN}# PHASE 3: Admin Console (Optional)${NC}"
echo "docker run --rm -i postgres:15 psql 'postgresql://postgres:YOUR_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres' < ADD_ADMIN_TABLES.sql"
echo ""

echo -e "${YELLOW}📝 Alternative: Use Supabase SQL Editor${NC}"
echo "1. Go to https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo "2. Open SQL Editor → New Query"
echo "3. Copy-paste each migration file content"
echo "4. Run in order as shown in MIGRATIONS_RUN_ORDER.md"
echo ""

echo -e "${GREEN}✅ Migration script ready!${NC}"
echo "Choose either Docker method (with password) or Supabase SQL Editor (easier)"

