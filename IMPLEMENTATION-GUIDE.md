# Phase 2 Implementation Guide

## Overview
This document outlines how to implement the remaining features for the V&A Waterfront Compliance Tracker.

## Priority 1: Core Operational Features

### 1. Evidence Upload & Management

**Backend: `/src/app/api/evidence/upload/route.ts`**
```typescript
// POST /api/evidence/upload
// Accept multipart/form-data
// Store file locally or S3
// Create Evidence record
// Update ComplianceItem status based on new evidence
// Return evidence ID and URL
```

**Frontend: Evidence Upload Component**
- File drag-and-drop
- Image preview
- PDF support
- Metadata input (title, issue date, expiry date)
- Verification status display

### 2. Audit Workflows

**Pages:**
- `/audits` - List all audits (filterable by store, date, status)
- `/audits/new` - Create new audit (select store, template)
- `/audits/[id]` - Conduct audit (checklist, photos, findings)
- `/audits/[id]/review` - Review and finalize

**Key Features:**
- Select audit template based on store type
- Checklist with pass/fail/N/A for each item
- Photo upload for non-compliant items
- Auto-generate corrective actions from findings
- Calculate overall audit score
- Email notification to store manager

### 3. Corrective Actions Management

**Pages:**
- `/actions` - All actions dashboard
- `/actions/new` - Create action manually
- `/actions/[id]` - Action detail and resolution

**Features:**
- Assign to officer
- Set severity and due date
- Track status (Open → In Progress → Resolved → Closed)
- Photo evidence of completion
- Auto-escalation for overdue critical actions
- Bulk actions (assign, close, escalate)

## Priority 2: Automation & Notifications

### 4. Notification System

**Backend: Scheduled job or cron**
```typescript
// Daily at 8 AM:
// - Check expiring items (30, 14, 7 days)
// - Check overdue actions
// - Generate escalations for critical actions
// - Send email notifications
// - Create in-app notifications
```

**Notification Types:**
- Expiry warnings (30/14/7 days)
- Expired items
- Overdue actions
- Action assignments
- Escalations
- Weekly digest for managers

**Implementation:**
- Use Vercel Cron or similar
- Email via SendGrid/Resend
- In-app notification center component
- Mark as read functionality

### 5. Escalation Workflows

**Automatic Escalation Rules:**
```typescript
// If:
// - Action severity = CRITICAL and overdue > 7 days
// - Any RED item remains for > X days (configurable)
// - Repeat offender (>= 3 RED items in 90 days)
// Then:
// - Create Escalation record
// - Assign to manager
// - Send notification
// - Add to priority queue with extra weight
```

**Manual Escalation:**
- Officer can escalate any action
- Provide escalation reason
- Manager reviews and resolves

## Priority 3: Reporting & Analytics

### 6. Reporting & Exports

**Monthly Compliance Pack:**
- Portfolio KPIs
- Top 20 risk stores
- Zone hotspots
- Category breakdown
- Officer performance
- Trend analysis (last 90 days)

**Export Formats:**
- CSV (raw data for Excel analysis)
- PDF (formatted report for stakeholders)

**Implementation:**
```typescript
// /api/reports/monthly
// - Generate data
// - Use Puppeteer for PDF generation
// - Or use react-pdf for client-side PDF
// - Email to stakeholders
```

### 7. Historical Trend Tracking

**Enhance ActivityLog:**
- Track status changes with before/after values
- Track compliance score over time
- Track action resolution time
- Track officer workload changes

**Visualizations:**
- Line charts for compliance trends
- Bar charts for category breakdowns
- Heatmaps for zone risk over time
- Use Recharts or Chart.js

### 8. Advanced Analytics

**KPIs to Add:**
- Mean time to resolve actions (by severity, officer, store type)
- Compliance score trend (portfolio, zone, store)
- Repeat offender tracking
- Peak period impact analysis
- Officer efficiency metrics

**Dashboard Enhancements:**
- Drill-down filters (click zone → show stores)
- Date range selector
- Export dashboards to PDF
- Scheduled email reports

## Priority 4: Tenant Portal (Phase 2)

### 9. Tenant User Role

**Tenant Capabilities:**
- View their store(s) only
- Upload evidence documents
- View open actions assigned to them
- Receive notifications
- View audit history

**Pages:**
- `/tenant/dashboard` - Simple store overview
- `/tenant/compliance` - Upload documents
- `/tenant/actions` - Tasks to complete

**Implementation:**
- Add tenant accounts (linked to Store)
- RBAC: restrict data access to assigned stores
- Simplified UI focused on tasks
- Mobile-responsive (tenants likely use phones)

## Priority 5: Production Enhancements

### 10. File Storage

**Options:**
- **Local**: Dev/testing only
- **S3**: Production-ready, scalable
- **Supabase Storage**: Good for small to medium scale

**Implementation:**
```typescript
// /src/lib/storage.ts
export async function uploadFile(file: File): Promise<string> {
  if (process.env.FILE_STORAGE_TYPE === 's3') {
    // Upload to S3
    // Return S3 URL
  } else {
    // Save locally
    // Return /uploads/[filename]
  }
}
```

### 11. Performance Optimization

**Database:**
- Add indexes (already done in schema)
- Use database views for complex queries
- Implement caching (Redis) for dashboard data
- Paginate long lists

**Frontend:**
- Use React.memo for expensive components
- Implement infinite scroll for store lists
- Lazy load images
- Optimize bundle size

### 12. Security Hardening

**Backend:**
- Rate limiting on API routes
- Input validation with Zod
- SQL injection protection (Prisma handles this)
- File upload validation (type, size)

**Frontend:**
- XSS protection (React handles this)
- CSRF tokens
- Content Security Policy headers

### 13. Testing

**Unit Tests:**
```typescript
// __tests__/lib/compliance.test.ts
// Test status calculation
// Test priority scoring
// Test date calculations
```

**Integration Tests:**
```typescript
// __tests__/api/stores.test.ts
// Test API endpoints
// Test authentication
// Test RBAC
```

**E2E Tests:**
```typescript
// Playwright or Cypress
// Test login flow
// Test dashboard loading
// Test store creation
// Test audit workflow
```

## Implementation Order

### Week 1:
1. Evidence upload API and UI
2. Store detail page enhancements
3. Basic corrective action management

### Week 2:
4. Audit creation workflow
5. Audit checklist and completion
6. Auto-generate actions from audits

### Week 3:
7. Notification system (email + in-app)
8. Escalation workflows
9. CSV export

### Week 4:
10. Historical trends
11. PDF reporting
12. Tenant portal MVP

### Ongoing:
- Testing
- Performance optimization
- Bug fixes
- User feedback iteration

## API Endpoints to Build

```typescript
// Evidence
POST   /api/evidence/upload
GET    /api/evidence/[id]
DELETE /api/evidence/[id]
POST   /api/evidence/[id]/verify

// Audits
GET    /api/audits
POST   /api/audits
GET    /api/audits/[id]
PUT    /api/audits/[id]
POST   /api/audits/[id]/complete

// Actions
GET    /api/actions
POST   /api/actions
GET    /api/actions/[id]
PUT    /api/actions/[id]
POST   /api/actions/[id]/resolve
POST   /api/actions/[id]/escalate

// Notifications
GET    /api/notifications
PUT    /api/notifications/[id]/read
POST   /api/notifications/mark-all-read

// Reports
GET    /api/reports/monthly
POST   /api/reports/export (CSV/PDF)

// Settings
GET    /api/settings
PUT    /api/settings
```

## Database Migrations

When adding new features, create migrations:

```bash
npm run db:migrate -- --name add-feature-name
```

## Deployment Checklist

Before deploying to production:

- [ ] Set strong NEXTAUTH_SECRET
- [ ] Configure production DATABASE_URL
- [ ] Set up file storage (S3/Supabase)
- [ ] Configure email service
- [ ] Set up monitoring (Sentry)
- [ ] Configure logging
- [ ] Set up backup strategy
- [ ] Test RBAC thoroughly
- [ ] Load test dashboard with 400+ stores
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS if needed
- [ ] Set up CI/CD pipeline
- [ ] Document admin procedures

## Support & Maintenance

**Regular Tasks:**
- Weekly: Review escalations
- Monthly: Compliance report
- Quarterly: System health check
- Annually: Data archival

**Monitoring:**
- Uptime monitoring (UptimeRobot)
- Error tracking (Sentry)
- Database performance
- User activity logs

---

This guide provides a roadmap for completing the V&A Waterfront Compliance Tracker. The foundation is solid, and these features can be added incrementally.
