# V&A Waterfront Mall Risk Compliance Tracker

Production-ready compliance management system tailored for the V&A Waterfront, tracking safety and risk compliance across ~400 stores.

## Features

### Manager Dashboard (Executive Focus View)
- **Portfolio KPIs**: Total stores, compliance status breakdown, expiring items, overdue actions
- **Priority Queue**: Ranked list of high-priority stores with risk scores and actionable insights
- **Zone Hotspots**: Heatmap showing compliance by zone/precinct
- **Category Breakdown**: What's driving non-compliance across compliance categories
- **Team Workload**: Officer assignments, capacity, and performance tracking
- **Trend Analysis**: Historical compliance trends and momentum

### Compliance Tracking
- 7 compliance categories:
  - OHS Risk Assessment
  - Extraction Certification (F&B)
  - Fire Suppression Certification (F&B)
  - Fire Equipment
  - Training
  - First Aid
  - Shop Audits
- Traffic-light status system: Green (compliant), Orange (expiring soon), Red (non-compliant), Grey (N/A)
- Priority scoring with weighted risk factors

### Role-Based Access Control (RBAC)
- **Admin (Compliance Manager)**: Full access, dashboard, settings, assignments
- **Officer**: Assigned stores, audits, actions, evidence management
- **Tenant**: (Phase 2) Document upload and task tracking

### Store Types & V&A Waterfront Tailoring
- Food & Beverage, Retail, Services, Luxury, Attraction, Pop-up
- Zone-based organization (Silo District, Victoria Wharf, Watershed, etc.)
- High foot-traffic designation
- Peak period tracking (holidays, cruise weeks, events)

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js (Credentials + JWT)
- **UI**: Tailwind CSS + shadcn/ui components
- **Validation**: Zod
- **Charts**: Recharts (for trends)

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd wct
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb wct_db
```

Or use a hosted database (Supabase, Neon, etc.)

### 3. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/wct_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
```

Generate a secret:

```bash
openssl rand -base64 32
```

### 4. Database Migration & Seed

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with demo data (400 stores, users, compliance items)
npm run db:seed
```

The seed creates:
- 1 manager account: `manager@vawaterfront.co.za` / `password123`
- 6 officer accounts: `officer1@vawaterfront.co.za` through `officer6@vawaterfront.co.za` / `password123`
- 400 stores across realistic V&A Waterfront zones
- Compliance items with mixed statuses (green/orange/red)
- Audit templates for retail and F&B

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You'll be redirected to `/login`. Use the demo credentials above.

## Project Structure

```
/src
  /app
    /dashboard          # Manager dashboard (KPIs, priority queue, hotspots)
    /login              # Authentication
    /stores             # Store management (TODO)
    /my-stores          # Officer view (TODO)
    /audits             # Audit management (TODO)
    /actions            # Corrective actions (TODO)
    /settings           # System settings (TODO)
    /api/auth           # NextAuth endpoints
  /components
    /ui                 # shadcn/ui components
    navigation.tsx      # Main navigation bar
    status-badge.tsx    # Compliance status badges
  /lib
    auth.ts             # NextAuth configuration
    auth-helpers.ts     # RBAC helpers
    compliance.ts       # Status & priority scoring library
    db.ts               # Prisma client
    utils.ts            # Utility functions
/prisma
  schema.prisma         # Database schema
  seed.ts               # Seed script
```

## Key Concepts

### Status Calculation

Compliance item status is determined by:
1. **Not Applicable**: Required = false → GREY
2. **Missing Evidence**: No evidence uploaded → RED
3. **Pending/Rejected Verification**: Awaiting review or rejected → ORANGE/RED
4. **Expired**: Past expiry date → RED
5. **Expiring Soon**: Within threshold (default 30 days) → ORANGE
6. **Compliant**: Valid and verified → GREEN

Store overall status = worst status across all compliance items.

### Priority Scoring

Priority score is calculated using weighted factors:

| Factor | Weight | Trigger |
|--------|--------|---------|
| RED expiry/missing | +50 per item | Any RED compliance item |
| Overdue action | +30 per action | Action past due date |
| Overdue >7 days | +10 extra | Action overdue >7 days |
| F&B fire issues | +25 | F&B with RED extraction/suppression |
| Repeat offender | +20 | ≥2 REDs in last 90 days |
| High foot traffic | +15 | Store flagged as high traffic |
| Peak period | +10 | Currently in peak period |

Stores are ranked by total priority score (descending).

### Business Logic

All status and priority logic lives in `/src/lib/compliance.ts` for consistency across server and UI.

## Development Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to DB (no migration)
npm run db:migrate       # Create and apply migration
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database (⚠️ deletes all data)
```

## Phase 2 Features (TODO)

- Store detail pages with evidence upload
- Audit creation and completion workflows
- Corrective action management
- Escalation workflows
- Notifications system (email/in-app)
- Reporting and CSV/PDF exports
- Tenant user role and portal
- File upload (local/S3/Supabase)
- Historical trend tracking
- Advanced analytics and charts

## Production Deployment

### Environment Variables (Production)

Add these in production:

```env
DATABASE_URL="<production-postgres-url>"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="<strong-random-secret>"
NODE_ENV="production"
```

### Deployment Platforms

Works seamlessly with:
- **Vercel**: Zero-config deployment, PostgreSQL via Vercel Postgres or Supabase
- **Railway**: Automatic PostgreSQL provisioning
- **Fly.io**: Docker-based deployment
- **AWS/Azure**: Traditional cloud deployment

## License

Proprietary - V&A Waterfront

## Support

For issues or questions, contact the development team.
