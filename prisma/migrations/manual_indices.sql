-- Database Performance Indices
-- Run these in Supabase SQL Editor

-- ComplianceItem composite indices
CREATE INDEX IF NOT EXISTS "idx_compliance_items_store_status" 
  ON "compliance_items"("storeId", "status");

CREATE INDEX IF NOT EXISTS "idx_compliance_items_status_expiry" 
  ON "compliance_items"("status", "expiryDate");

-- Store composite indices
CREATE INDEX IF NOT EXISTS "idx_stores_zone_status" 
  ON "stores"("zone", "overallStatus", "status");

CREATE INDEX IF NOT EXISTS "idx_stores_status_overall" 
  ON "stores"("status", "overallStatus");

-- CorrectiveAction composite indices
CREATE INDEX IF NOT EXISTS "idx_actions_store_severity_status" 
  ON "corrective_actions"("storeId", "severity", "status");

CREATE INDEX IF NOT EXISTS "idx_actions_severity_status_due" 
  ON "corrective_actions"("severity", "status", "dueDate");

CREATE INDEX IF NOT EXISTS "idx_actions_assignee_status" 
  ON "corrective_actions"("assignedToId", "status");

-- Audit composite indices
CREATE INDEX IF NOT EXISTS "idx_audits_store_status_date" 
  ON "audits"("storeId", "status", "auditDate");

CREATE INDEX IF NOT EXISTS "idx_audits_status_date" 
  ON "audits"("status", "auditDate");

-- Verify indices were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Performance check: Test query plans
EXPLAIN ANALYZE
SELECT 
  s.zone,
  COUNT(DISTINCT s.id) as total,
  COUNT(DISTINCT CASE WHEN s."overallStatus" = 'RED' THEN s.id END) as red
FROM stores s
WHERE s.status = 'active'
GROUP BY s.zone;
