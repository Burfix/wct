-- Create complete database schema
-- Run this FIRST in Supabase SQL Editor before running manual_indices.sql

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OFFICER', 'TENANT');
CREATE TYPE "StoreType" AS ENUM ('FB', 'RETAIL', 'SERVICES', 'LUXURY', 'ATTRACTION', 'POPUP');
CREATE TYPE "ComplianceStatus" AS ENUM ('GREEN', 'ORANGE', 'RED', 'GREY');
CREATE TYPE "ComplianceCategory" AS ENUM ('OHS_RISK_ASSESSMENT', 'EXTRACTION_CERT', 'FIRE_SUPPRESSION_CERT', 'FIRE_EQUIPMENT', 'TRAINING', 'FIRST_AID', 'SHOP_AUDIT');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "AuditStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'MEDIA_UPLOADING', 'COMPLETE', 'VERIFIED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "GeoStatus" AS ENUM ('CAPTURED', 'DENIED', 'UNAVAILABLE');
CREATE TYPE "AuditResult" AS ENUM ('YES', 'NO', 'NA');
CREATE TYPE "SignatureRole" AS ENUM ('OFFICER', 'MANAGER');
CREATE TYPE "ActionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED');
CREATE TYPE "NotificationType" AS ENUM ('EXPIRY_30_DAYS', 'EXPIRY_14_DAYS', 'EXPIRY_7_DAYS', 'EXPIRED', 'ACTION_OVERDUE', 'ACTION_ASSIGNED', 'ESCALATION', 'AUDIT_DUE', 'WEEKLY_DIGEST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OFFICER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "storeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "zone" TEXT NOT NULL,
    "floor" TEXT,
    "precinct" TEXT,
    "storeType" "StoreType" NOT NULL,
    "highFootTraffic" BOOLEAN NOT NULL DEFAULT false,
    "tradingHours" TEXT,
    "tenantContact" TEXT,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "overallStatus" "ComplianceStatus" NOT NULL DEFAULT 'GREY',
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "lastAuditDate" TIMESTAMP(3),
    "nextAuditDue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "store_assignments" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "store_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_items" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "category" "ComplianceCategory" NOT NULL,
    "subCategory" TEXT,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'GREY',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "expiryDate" TIMESTAMP(3),
    "lastVerifiedDate" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "compliance_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evidences" (
    "id" TEXT NOT NULL,
    "complianceItemId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "storeTypes" "StoreType"[],
    "version" TEXT NOT NULL DEFAULT '1.0',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "audit_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_sections" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "audit_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_questions" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "audit_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "conductedById" TEXT NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'DRAFT',
    "overallScore" DOUBLE PRECISION,
    "sectionScores" JSONB,
    "generalComments" TEXT,
    "tenantAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "tenantName" TEXT,
    "tenantRole" TEXT,
    "tenantContact" TEXT,
    "tenantSignatureUrl" TEXT,
    "officerSignatureUrl" TEXT,
    "officerSignedAt" TIMESTAMP(3),
    "managerSignatureUrl" TEXT,
    "managerSignedAt" TIMESTAMP(3),
    "managerVerifiedById" TEXT,
    "managerVerifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "geoProofCaptured" BOOLEAN NOT NULL DEFAULT false,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "geoAccuracyMeters" DOUBLE PRECISION,
    "geoStatus" "GeoStatus",
    "zoneMatch" BOOLEAN,
    "lastSyncedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_responses" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "result" "AuditResult" NOT NULL,
    "notes" TEXT,
    "severity" "ActionSeverity",
    "createdActionId" TEXT,
    "sectionScoreSnapshot" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "audit_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_photos" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "geoAccuracyMeters" DOUBLE PRECISION,
    "geoStatus" "GeoStatus",
    "deviceInfo" TEXT,
    CONSTRAINT "audit_photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_signatures" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "signedById" TEXT NOT NULL,
    "role" "SignatureRole" NOT NULL,
    "signatureUrl" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_signatures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_acknowledgements" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "role" TEXT,
    "contact" TEXT,
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_acknowledgements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_comments" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "store_qr_codes" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "qrImageUrl" TEXT,
    "publicToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "store_qr_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "corrective_actions" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "auditId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "ActionSeverity" NOT NULL,
    "category" "ComplianceCategory",
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "photoUrls" TEXT[],
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "corrective_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "peak_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "tag" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "peak_periods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX "stores_storeCode_key" ON "stores"("storeCode");
CREATE INDEX "stores_zone_idx" ON "stores"("zone");
CREATE INDEX "stores_storeType_idx" ON "stores"("storeType");
CREATE INDEX "stores_overallStatus_idx" ON "stores"("overallStatus");
CREATE INDEX "stores_priorityScore_idx" ON "stores"("priorityScore");
CREATE INDEX "stores_zone_overallStatus_status_idx" ON "stores"("zone", "overallStatus", "status");
CREATE INDEX "stores_status_overallStatus_idx" ON "stores"("status", "overallStatus");
CREATE INDEX "store_assignments_userId_idx" ON "store_assignments"("userId");
CREATE UNIQUE INDEX "store_assignments_storeId_userId_key" ON "store_assignments"("storeId", "userId");
CREATE INDEX "compliance_items_category_idx" ON "compliance_items"("category");
CREATE INDEX "compliance_items_status_idx" ON "compliance_items"("status");
CREATE INDEX "compliance_items_expiryDate_idx" ON "compliance_items"("expiryDate");
CREATE INDEX "compliance_items_storeId_status_idx" ON "compliance_items"("storeId", "status");
CREATE INDEX "compliance_items_status_expiryDate_idx" ON "compliance_items"("status", "expiryDate");
CREATE UNIQUE INDEX "compliance_items_storeId_category_subCategory_key" ON "compliance_items"("storeId", "category", "subCategory");
CREATE INDEX "evidences_complianceItemId_idx" ON "evidences"("complianceItemId");
CREATE INDEX "evidences_storeId_idx" ON "evidences"("storeId");
CREATE INDEX "evidences_verificationStatus_idx" ON "evidences"("verificationStatus");
CREATE INDEX "audit_sections_templateId_idx" ON "audit_sections"("templateId");
CREATE INDEX "audit_questions_sectionId_idx" ON "audit_questions"("sectionId");
CREATE INDEX "audits_storeId_idx" ON "audits"("storeId");
CREATE INDEX "audits_status_idx" ON "audits"("status");
CREATE INDEX "audits_auditDate_idx" ON "audits"("auditDate");
CREATE INDEX "audits_overallScore_idx" ON "audits"("overallScore");
CREATE INDEX "audits_storeId_status_auditDate_idx" ON "audits"("storeId", "status", "auditDate");
CREATE INDEX "audits_status_auditDate_idx" ON "audits"("status", "auditDate");
CREATE INDEX "audit_responses_auditId_idx" ON "audit_responses"("auditId");
CREATE INDEX "audit_responses_result_idx" ON "audit_responses"("result");
CREATE UNIQUE INDEX "audit_responses_auditId_questionId_key" ON "audit_responses"("auditId", "questionId");
CREATE INDEX "audit_photos_responseId_idx" ON "audit_photos"("responseId");
CREATE INDEX "audit_photos_auditId_idx" ON "audit_photos"("auditId");
CREATE INDEX "audit_signatures_auditId_idx" ON "audit_signatures"("auditId");
CREATE UNIQUE INDEX "audit_acknowledgements_auditId_key" ON "audit_acknowledgements"("auditId");
CREATE INDEX "audit_comments_auditId_idx" ON "audit_comments"("auditId");
CREATE UNIQUE INDEX "store_qr_codes_storeId_key" ON "store_qr_codes"("storeId");
CREATE UNIQUE INDEX "store_qr_codes_publicToken_key" ON "store_qr_codes"("publicToken");
CREATE INDEX "store_qr_codes_publicToken_idx" ON "store_qr_codes"("publicToken");
CREATE INDEX "corrective_actions_storeId_idx" ON "corrective_actions"("storeId");
CREATE INDEX "corrective_actions_status_idx" ON "corrective_actions"("status");
CREATE INDEX "corrective_actions_dueDate_idx" ON "corrective_actions"("dueDate");
CREATE INDEX "corrective_actions_severity_idx" ON "corrective_actions"("severity");
CREATE INDEX "corrective_actions_storeId_severity_status_idx" ON "corrective_actions"("storeId", "severity", "status");
CREATE INDEX "corrective_actions_severity_status_dueDate_idx" ON "corrective_actions"("severity", "status", "dueDate");
CREATE INDEX "corrective_actions_assignedToId_status_idx" ON "corrective_actions"("assignedToId", "status");
CREATE UNIQUE INDEX "escalations_actionId_key" ON "escalations"("actionId");
CREATE INDEX "escalations_status_idx" ON "escalations"("status");
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX "peak_periods_startDate_endDate_idx" ON "peak_periods"("startDate", "endDate");
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
CREATE UNIQUE INDEX "zones_name_key" ON "zones"("name");
CREATE INDEX "activity_logs_storeId_idx" ON "activity_logs"("storeId");
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX "activity_logs_entity_entityId_idx" ON "activity_logs"("entity", "entityId");
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "store_assignments" ADD CONSTRAINT "store_assignments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_assignments" ADD CONSTRAINT "store_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "compliance_items" ADD CONSTRAINT "compliance_items_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_complianceItemId_fkey" FOREIGN KEY ("complianceItemId") REFERENCES "compliance_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_sections" ADD CONSTRAINT "audit_sections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "audit_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_questions" ADD CONSTRAINT "audit_questions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "audit_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audits" ADD CONSTRAINT "audits_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audits" ADD CONSTRAINT "audits_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "audit_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audits" ADD CONSTRAINT "audits_conductedById_fkey" FOREIGN KEY ("conductedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_responses" ADD CONSTRAINT "audit_responses_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_responses" ADD CONSTRAINT "audit_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "audit_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_photos" ADD CONSTRAINT "audit_photos_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "audit_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_signatures" ADD CONSTRAINT "audit_signatures_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_acknowledgements" ADD CONSTRAINT "audit_acknowledgements_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_comments" ADD CONSTRAINT "audit_comments_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_comments" ADD CONSTRAINT "audit_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "corrective_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
