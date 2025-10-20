# Docker SQL Validation Guide

## Current Issue
Docker Hub is returning `503 Service Unavailable` when trying to pull postgres:15 image.

## Solution Options

### Option 1: Wait for Docker Hub (Not Recommended)
Docker Hub appears to be having intermittent issues. This is not under our control.

### Option 2: Use Alternative Registry (Recommended)
Pull postgres image from GitHub Container Registry or Quay.io instead.

### Option 3: Use Local PostgreSQL (If Available)
Install PostgreSQL locally and use psql directly.

---

## Step-by-Step: Get Docker Working

### 1. Check Docker Status
```bash
# Verify Docker is running
docker info

# If Docker is not running, start Docker Desktop app
# On Mac: Open Docker Desktop from Applications
```

### 2. Try Alternative Registry - GitHub Container Registry
```bash
# Pull postgres from GitHub Container Registry
docker pull ghcr.io/baosystems/postgres:15

# Tag it as postgres:15 for compatibility
docker tag ghcr.io/baosystems/postgres:15 postgres:15
```

### 3. Try Alternative Registry - Quay.io
```bash
# Pull postgres from Quay.io
docker pull quay.io/enterprisedb/postgresql:15

# Tag it
docker tag quay.io/enterprisedb/postgresql:15 postgres:15
```

### 4. Check Existing Images
```bash
# See if you already have a postgres image
docker images | grep postgres

# If you have ANY postgres image (even postgres:14 or postgres:16), use it!
docker images
```

---

## Validate SQL with Docker (Once Image is Available)

### Method 1: Syntax Check Only (Fast)
```bash
# Create a test database and run SQL
docker run --rm \
  -v $(pwd):/sql \
  postgres:15 \
  bash -c "psql --version && echo 'Docker working!'"
```

### Method 2: Full SQL Validation
```bash
# Start postgres container
docker run --name temp-postgres -d \
  -e POSTGRES_PASSWORD=test123 \
  postgres:15

# Wait for postgres to start
sleep 5

# Copy SQL file into container
docker cp ALL_MIGRATIONS_AND_DATA.sql temp-postgres:/tmp/

# Run the SQL file
docker exec temp-postgres \
  psql -U postgres -f /tmp/ALL_MIGRATIONS_AND_DATA.sql

# Clean up
docker stop temp-postgres
docker rm temp-postgres
```

### Method 3: Interactive Validation (Most Detailed)
```bash
# Start postgres with port exposed
docker run --name postgres-validator -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=test123 \
  postgres:15

# Wait for startup
sleep 5

# Connect and run SQL
docker exec -i postgres-validator \
  psql -U postgres < ALL_MIGRATIONS_AND_DATA.sql

# Check for errors in output

# Clean up when done
docker stop postgres-validator
docker rm postgres-validator
```

---

## Alternative: Install PostgreSQL Locally

### macOS (via Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Validate SQL
psql --version
psql -U $(whoami) -d postgres -f ALL_MIGRATIONS_AND_DATA.sql
```

### Using Postgres.app (macOS - Easiest)
1. Download from: https://postgresapp.com/
2. Install and open Postgres.app
3. Click "Initialize" to create a server
4. Use psql from terminal:
```bash
# Postgres.app adds psql to PATH automatically
psql --version

# Run validation
psql -f ALL_MIGRATIONS_AND_DATA.sql
```

---

## Quick Fix: Just Run in Supabase
Since Docker Hub is down and we need to move forward:

1. **Accept the risk**: Run directly in Supabase SQL Editor
2. **Monitor errors**: Fix them as they appear
3. **Iterate quickly**: Each error reveals the next issue

**Supabase SQL Editor:**
- URL: https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb/editor
- Copy-paste: `ALL_MIGRATIONS_AND_DATA.sql`
- Click: "Run"
- Report errors immediately

---

## What I Recommend RIGHT NOW

**Given Docker Hub is down, let's use this workflow:**

### Step 1: Try Local Postgres
```bash
# Check if psql exists
which psql

# If it exists, use it!
psql --version
```

### Step 2: If No Local Postgres - Use Supabase Directly
Just run the SQL in Supabase and fix errors iteratively (fastest path forward)

### Step 3: For Future - Install Postgres.app
Download from https://postgresapp.com/ for reliable local testing

---

## Commands for You to Run Now

**Run these in your terminal:**

```bash
# 1. Check Docker status
docker info

# 2. Check for existing postgres images
docker images | grep postgres

# 3. Check if psql is available
which psql
psql --version

# 4. If Docker is working but no postgres image, try alternative registry
docker pull ghcr.io/baosystems/postgres:15
```

**After running these, tell me:**
1. Is Docker running? (output of `docker info`)
2. Do you have any postgres images? (output of `docker images | grep postgres`)
3. Is psql available? (output of `which psql`)

Based on your answers, I'll give you the exact next steps!

