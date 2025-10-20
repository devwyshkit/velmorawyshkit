#!/bin/bash
# SQL Validation Script using Docker postgres:15-alpine

echo "🐳 Starting PostgreSQL Docker validation..."
echo ""

# Step 1: Start a temporary postgres container
echo "1️⃣ Starting temporary postgres container..."
docker run --name temp-postgres-validator -d \
  -e POSTGRES_PASSWORD=test123 \
  postgres:15-alpine

# Wait for postgres to be ready
echo "2️⃣ Waiting for PostgreSQL to start (10 seconds)..."
sleep 10

# Step 2: Copy SQL file into container
echo "3️⃣ Copying SQL file into container..."
docker cp ALL_MIGRATIONS_AND_DATA.sql temp-postgres-validator:/tmp/

# Step 3: Run the SQL file and capture output
echo "4️⃣ Running SQL validation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec temp-postgres-validator \
  psql -U postgres -f /tmp/ALL_MIGRATIONS_AND_DATA.sql 2>&1

VALIDATION_EXIT_CODE=$?

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 4: Clean up
echo "5️⃣ Cleaning up container..."
docker stop temp-postgres-validator > /dev/null 2>&1
docker rm temp-postgres-validator > /dev/null 2>&1

# Step 5: Report results
echo ""
if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    echo "✅ SQL VALIDATION PASSED!"
    echo "   All migrations and test data executed successfully."
    echo "   Ready for Supabase deployment!"
else
    echo "❌ SQL VALIDATION FAILED!"
    echo "   Check the error messages above."
    echo "   Fix the errors and run this script again."
fi

echo ""
exit $VALIDATION_EXIT_CODE

