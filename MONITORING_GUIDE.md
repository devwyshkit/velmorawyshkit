# Application Query Monitoring Guide

**Project**: Wyshkit Finale 66  
**Database**: Supabase PostgreSQL  
**Purpose**: Monitor YOUR application's query performance (not Supabase Dashboard queries)

---

## 📊 Overview

This guide shows you how to monitor your application's **real** query performance, filtering out Supabase Dashboard internal queries that create noise in the metrics.

### What We've Set Up

✅ **Views to filter app queries** from dashboard noise  
✅ **RLS performance tracking** to measure optimization impact  
✅ **Helper functions** for quick performance summaries  
✅ **Documentation** on best practices

---

## 🔍 Quick Start: View Your App's Queries

### 1. View All Application Queries

Run this in your Supabase SQL Editor:

```sql
SELECT * FROM public.app_query_performance LIMIT 20;
```

**What you'll see**:
- Only YOUR application's queries (dashboard queries filtered out)
- Mean, min, max execution times
- Number of calls
- Cache hit rates
- Rows read

**Example Output**:
```
query                                    | rolname       | calls | mean_time_ms | cache_hit_rate
-----------------------------------------|---------------|-------|--------------|---------------
SELECT * FROM partner_products WHERE...  | authenticator | 150   | 2.45         | 98.5
SELECT * FROM cart_items WHERE user_id...| authenticator | 320   | 1.12         | 99.2
```

### 2. Check RLS Optimization Status

See which queries are using optimized RLS:

```sql
SELECT * FROM public.rls_query_performance LIMIT 20;
```

**What to look for**:
- `optimization_status = 'Optimized (SELECT wrapper)'` ✅ Good!
- `optimization_status = 'Needs optimization'` ⚠️ Needs work

### 3. Get Quick Summary

Get high-level metrics instantly:

```sql
SELECT * FROM public.get_app_query_summary();
```

**Example Output**:
```
metric                  | value
------------------------|-------
Total App Queries       | 45
Avg Query Time (ms)     | 3.25
Queries with RLS        | 32
Optimized RLS Queries   | 32
Cache Hit Rate (%)      | 98.50
```

---

## 📈 Understanding the Metrics

### Query Time Thresholds

| Time Range | Status | Action |
|------------|--------|--------|
| < 10ms     | ✅ Excellent | No action needed |
| 10-100ms   | ⚠️ Watch | Monitor, consider optimization |
| 100-1000ms | 🚨 Slow | Investigate and optimize |
| > 1000ms   | 🔥 Critical | Immediate attention required |

### Cache Hit Rate

| Rate | Status | Action |
|------|--------|--------|
| > 95% | ✅ Excellent | Optimal performance |
| 90-95% | ✅ Good | Monitor |
| 80-90% | ⚠️ Fair | Consider adding indexes |
| < 80% | 🚨 Poor | Review query patterns and indexes |

### RLS Optimization Impact

**Before Optimization** (direct `auth.uid()` call):
```sql
WHERE partner_id = auth.uid()
-- Evaluates auth.uid() for EACH row = 100 rows × 5ms = 500ms
```

**After Optimization** (SELECT wrapper):
```sql
WHERE partner_id = (SELECT auth.uid())
-- Evaluates auth.uid() ONCE = 1 × 5ms = 5ms
```

**Result**: **10-100x faster** on queries with many rows!

---

## 🎯 What Dashboard Queries Look Like (What We Filter Out)

These queries **DO NOT affect your app**:

### 1. Realtime Service
```sql
select * from realtime.list_changes($1, $2, $3, $4)
```
- **Who**: Supabase Realtime infrastructure
- **Why**: Background change detection
- **Your app**: Not affected

### 2. Dashboard Schema Queries
```sql
with records as (
  select c.oid::int8 as "id",
  case c.relkind when $1 then pg_temp.pg_get_tabledef(...)
-- source: dashboard
```
- **Who**: Supabase Studio (web UI)
- **Why**: Fetching table definitions for display
- **Your app**: Not affected

### 3. Catalog Queries
```sql
SELECT name FROM pg_timezone_names
SELECT * FROM pg_type WHERE...
```
- **Who**: PostgreSQL system
- **Why**: Internal metadata
- **Your app**: Not affected

---

## 🔧 How to Use This in Production

### Step 1: Establish Baseline

Before deploying changes, record current performance:

```sql
-- Save baseline metrics
CREATE TABLE IF NOT EXISTS monitoring.performance_baseline AS
SELECT 
  NOW() as recorded_at,
  *
FROM public.app_query_performance;
```

### Step 2: Monitor After Changes

After deploying code changes:

```sql
-- Compare to baseline
SELECT 
  current.query,
  baseline.mean_time_ms as before_ms,
  current.mean_time_ms as after_ms,
  ROUND(
    ((baseline.mean_time_ms - current.mean_time_ms) / baseline.mean_time_ms) * 100,
    2
  ) as improvement_pct
FROM public.app_query_performance current
JOIN monitoring.performance_baseline baseline 
  ON current.query = baseline.query
WHERE current.mean_time_ms != baseline.mean_time_ms
ORDER BY improvement_pct DESC;
```

### Step 3: Set Up Alerts

Create a function to check for slow queries:

```sql
CREATE OR REPLACE FUNCTION public.check_slow_queries()
RETURNS TABLE (
  alert_level TEXT,
  query TEXT,
  mean_time_ms NUMERIC,
  calls BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN mean_time_ms > 1000 THEN '🔥 CRITICAL'
      WHEN mean_time_ms > 100 THEN '🚨 SLOW'
      WHEN mean_time_ms > 10 THEN '⚠️ WATCH'
      ELSE '✅ OK'
    END as alert_level,
    query,
    mean_time_ms,
    calls
  FROM public.app_query_performance
  WHERE mean_time_ms > 10
  ORDER BY mean_time_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- Run check
SELECT * FROM public.check_slow_queries();
```

---

## 🛠️ Troubleshooting Common Issues

### Issue 1: High Query Times

**Symptoms**:
- Queries > 100ms consistently
- High `rows_read` count

**Solutions**:
1. Check if index exists on filtered columns
2. Verify RLS policies use optimized patterns
3. Look for N+1 query problems in code

**Example Fix**:
```sql
-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'your_slow_table';

-- Add missing index if needed
CREATE INDEX IF NOT EXISTS idx_table_column 
ON public.your_slow_table(column_name);
```

### Issue 2: Low Cache Hit Rate

**Symptoms**:
- Cache hit rate < 90%
- Slow query times

**Solutions**:
1. Increase shared_buffers (Supabase plan dependent)
2. Review query patterns for full table scans
3. Add strategic indexes

### Issue 3: RLS Queries Not Optimized

**Symptoms**:
- `optimization_status = 'Needs optimization'`
- Slow queries with `auth.uid()` calls

**Solution**:
```sql
-- Find unoptimized policies
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE qual LIKE '%auth.uid()%'
  AND qual NOT LIKE '%(SELECT auth.uid())%';

-- Fix by wrapping auth.uid() with SELECT
ALTER POLICY policy_name ON table_name
USING (column = (SELECT auth.uid()));
```

---

## 📱 Application-Level Monitoring

### Add Query Timing to Your Code

**TypeScript/JavaScript Example**:

```typescript
// src/lib/query-tracker.ts
export const trackQuery = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    
    // Log slow queries
    if (duration > 100) {
      console.warn(`⚠️ Slow query: ${queryName} took ${duration.toFixed(2)}ms`);
    }
    
    // Optional: Send to analytics
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('Query Performance', {
        query: queryName,
        duration,
        timestamp: new Date().toISOString()
      });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

// Usage in your components
import { trackQuery } from '@/lib/query-tracker';

const fetchProducts = async () => {
  return trackQuery('fetch-partner-products', async () => {
    const { data, error } = await supabase
      .from('partner_products')
      .select('*')
      .eq('partner_id', partnerId);
    
    if (error) throw error;
    return data;
  });
};
```

---

## 📊 Regular Monitoring Checklist

### Daily Checks
- [ ] Run `SELECT * FROM public.get_app_query_summary()`
- [ ] Check for queries > 100ms
- [ ] Review cache hit rates

### Weekly Checks
- [ ] Analyze slow query trends
- [ ] Check for new unoptimized RLS policies
- [ ] Review index usage

### Monthly Checks
- [ ] Compare performance to baseline
- [ ] Remove unused indexes
- [ ] Update query optimization strategies

---

## 🎓 Best Practices

### DO ✅
- Monitor YOUR application queries, not dashboard queries
- Use `(SELECT auth.uid())` in ALL RLS policies
- Add indexes on frequently queried columns
- Track query performance in your application code
- Set up alerts for slow queries

### DON'T ❌
- Worry about dashboard query performance
- Use `user_metadata` in RLS policies (security risk)
- Create functions without explicit `search_path`
- Ignore cache hit rates < 90%
- Skip performance testing before deployment

---

## 🚀 Next Steps

1. **Implement Application Tracking**: Add the query tracker to your codebase
2. **Establish Baseline**: Record current performance metrics
3. **Set Up Alerts**: Create functions to notify on slow queries
4. **Regular Reviews**: Schedule weekly performance reviews
5. **Continuous Optimization**: Iterate based on real usage patterns

---

## 📞 Support

**View Monitoring Views**:
```sql
SELECT * FROM public.app_query_performance;
SELECT * FROM public.rls_query_performance;
SELECT * FROM public.get_app_query_summary();
```

**Supabase Dashboard**:
- Logs → Postgres Logs
- Filter by `authenticator` role
- Look for YOUR table names

**Documentation**:
- Supabase Database Linter: https://supabase.com/docs/guides/database/database-linter
- PostgreSQL Performance: https://www.postgresql.org/docs/current/monitoring-stats.html

---

**Last Updated**: October 24, 2025  
**Status**: ✅ Active Monitoring Enabled

