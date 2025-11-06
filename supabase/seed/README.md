# Supabase Seed Data

This directory contains seed data for development and testing.

## Setup

1. Apply all migrations first (from `supabase/migrations/`)
2. Run seed files in order:
   ```bash
   # Via Supabase CLI
   supabase db reset  # This applies migrations AND seeds
   
   # Or manually via SQL Editor:
   # 1. Run test-users.sql
   # 2. Run test-stores-items.sql
   ```

## Test User

- **Email**: `test@wyshkit.com`
- **Password**: `TestUser123!`
- **Role**: `customer`

## Test Data

- 2 test stores (Premium Gifts Co, Gourmet Delights)
- 5 test items with various customizations
- 1 test address for the test user

## Usage

These seed files populate the database with realistic test data that matches the production schema. All UUIDs are consistent for easy testing.

## Notes

- Seed data uses deterministic UUIDs (all zeros with specific endings)
- Test user ID: `00000000-0000-0000-0000-000000000001`
- Test stores start with: `00000000-0000-0000-0000-0000000001XX`
- Test items start with: `00000000-0000-0000-0000-0000000002XX` and `00000000-0000-0000-0000-0000000003XX`










