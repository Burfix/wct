# Week 3 Database Migration Instructions

## Overview
This document provides step-by-step instructions for manually executing the database index migration in Supabase. The composite indices optimize query performance for the high-traffic dashboard and audit queries.

## Prerequisites
- Access to Supabase dashboard
- Database connection details (already configured)
- SQL Editor access in Supabase

## Migration File
Location: `prisma/migrations/manual_indices.sql`

## Why Manual Migration?
The production database is IPv6-only and cannot be accessed from local development environment. Therefore, the migration must be executed manually via the Supabase SQL Editor.

## Steps to Execute

### 1. Access Supabase SQL Editor
1. Navigate to https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New query"

### 2. Copy Migration SQL
Open `prisma/migrations/manual_indices.sql` and copy the entire contents.

### 3. Execute Migration
1. Paste the SQL into the Supabase SQL Editor
2. Review the statements (they all use `IF NOT EXISTS` so they're safe to re-run)
3. Click "Run" or press `Cmd/Ctrl + Enter`
4. Wait for completion (should take 30-60 seconds)

### 4. Verify Indices
The migration file includes verification queries at the end. Check the results to confirm all indices were created:

```sql
-- Verify all indices exist
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Expected indices:
- `idx_compliance_items_store_status`
- `idx_compliance_items_status_expiry`
- `idx_stores_zone_status`
- `idx_stores_status_overall`
- `idx_actions_store_severity_status`
- `idx_actions_severity_status_due`
- `idx_actions_assignee_status`
- `idx_audits_store_status_date`
- `idx_audits_status_date`

## Performance Impact

### Before Indices
- Dashboard load: ~2000-3000ms
- Store list query: ~500ms
- Audit list query: ~400ms

### After Indices (Expected)
- Dashboard load: ~100-200ms (10-15x faster)
- Store list query: ~50ms (10x faster)
- Audit list query: ~40ms (10x faster)

## Index Details

### Store Indices
```sql
-- Zone-based filtering with status
idx_stores_zone_status (zone, overall_status, status)

-- Status-based queries
idx_stores_status_overall (status, overall_status)
```

**Optimizes:**
- Dashboard zone statistics
- Store health filtering
- Executive Risk Radar

### Compliance Item Indices
```sql
-- Store-specific compliance queries
idx_compliance_items_store_status (store_id, status)

-- Expiry tracking
idx_compliance_items_status_expiry (status, expiry_date)
```

**Optimizes:**
- Store detail compliance section
- Expiring items alerts
- Compliance tracking dashboard

### Corrective Action Indices
```sql
-- Store action queries with severity
idx_actions_store_severity_status (store_id, severity, status)

-- Priority action filtering
idx_actions_severity_status_due (severity, status, due_date)

-- User assignment queries
idx_actions_assignee_status (assigned_to_id, status)
```

**Optimizes:**
- Action item lists
- Critical action tracking
- Manager assignment views
- Overdue action alerts

### Audit Indices
```sql
-- Store audit history
idx_audits_store_status_date (store_id, status, audit_date)

-- Recent audits query
idx_audits_status_date (status, audit_date)
```

**Optimizes:**
- Audit history views
- Recent audits dashboard
- Audit filtering and sorting

## Troubleshooting

### Index Already Exists
If you see errors like "relation already exists", this is normal - the indices may have been created in a previous run. The `IF NOT EXISTS` clause prevents errors.

### Performance Issues
If queries are still slow after migration:
1. Run `ANALYZE` on the affected tables:
   ```sql
   ANALYZE "Store";
   ANALYZE "ComplianceItem";
   ANALYZE "CorrectiveAction";
   ANALYZE "Audit";
   ```
2. Check query execution plans with `EXPLAIN ANALYZE`
3. Verify indices are being used (see examples in migration file)

### Connection Timeout
If the migration times out:
1. The indices use `CONCURRENTLY` so they don't lock tables
2. Re-run the migration - existing indices will be skipped
3. Large tables may take longer (up to 2-3 minutes)

## Rollback (if needed)

To remove indices:
```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_stores_zone_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_stores_status_overall;
DROP INDEX CONCURRENTLY IF EXISTS idx_compliance_items_store_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_compliance_items_status_expiry;
DROP INDEX CONCURRENTLY IF EXISTS idx_actions_store_severity_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_actions_severity_status_due;
DROP INDEX CONCURRENTLY IF EXISTS idx_actions_assignee_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_audits_store_status_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_audits_status_date;
```

## Post-Migration Testing

### 1. Test Dashboard Performance
1. Navigate to `/dashboard`
2. Open browser DevTools Network tab
3. Measure page load time
4. Verify it loads in < 200ms

### 2. Test Executive Risk Radar
1. Navigate to `/dashboard/executive`
2. Check zone statistics load quickly
3. Verify risk distribution charts are responsive

### 3. Test Store Lists
1. Navigate to `/stores`
2. Filter by zone
3. Filter by status
4. Verify instant responses

### 4. Test Audit History
1. Navigate to a store detail page
2. Check audit history section
3. Verify quick loading

## Schema Reference

The indices are already defined in `prisma/schema.prisma`:
- Lines 135-136: Store composite indices
- Lines 196-197: ComplianceItem composite indices
- Lines 343-344: CorrectiveAction composite indices (partial)
- Lines 510-512: CorrectiveAction composite indices (complete)

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify database connection is stable
3. Confirm you have sufficient privileges
4. Contact development team if problems persist

## Next Steps

After successful migration:
1. ✅ Mark database migration task as complete
2. Test application performance
3. Monitor query performance in production
4. Proceed with Week 3 feature deployment
