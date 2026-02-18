# DEMO SETUP — V&A Waterfront Compliance Tracker

Quick guide to run the app locally and on Vercel for a demo session.

---

## 1. Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| PostgreSQL | ≥ 14 (or Vercel Postgres / Supabase) |

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env.local   # if example exists, otherwise create .env.local
```

Required variables in `.env.local`:

```env
# PostgreSQL connection string (Supabase / Vercel Postgres / local)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# Direct URL (needed for Prisma Migrate; same as DATABASE_URL if using pooler)
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# NextAuth secret — generate with: openssl rand -base64 32
AUTH_SECRET="replace-with-your-secret"

# Optional: seed protection secret (same value used in /api/admin/seed)
SEED_SECRET="replace-with-a-safe-random-string"
```

> On Vercel, set these in **Settings → Environment Variables**.
> `AUTH_SECRET` must match across all environments (Production / Preview / Development).

---

## 4. Prisma: generate client + migrate

```bash
# Generate the Prisma client types
npm run db:generate

# Apply migrations to your database
npm run db:migrate
# (dev alias for: prisma migrate dev)
```

If the database already has tables you can use `push` instead:

```bash
npm run db:push
```

---

## 5. Seed demo data

### Option A — CLI (local dev, DB reachable)

```bash
npm run db:seed
```

### Option B — HTTP endpoint (production / CI / when DB not reachable locally)

```bash
# Replace <SECRET> with the value of SEED_SECRET in your env
curl -X POST https://<your-vercel-url>/api/admin/seed \
  -H "x-seed-secret: <SECRET>"
```

Expected response:

```json
{ "success": true, "message": "Seed executed (header secret)." }
```

> **Security**: the seed route is protected by the `SEED_SECRET` header.
> It is safe to leave deployed but should only be called once.

---

## 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 7. Login with demo accounts

On the landing page, click any tile to log in without a password:

| Name | Email | Role |
|---|---|---|
| Mall Manager | manager@vawaterfront.co.za | ADMIN |
| Compliance Officer 1 | officer1@vawaterfront.co.za | OFFICER |
| Compliance Officer 2 | officer2@vawaterfront.co.za | OFFICER |
| Compliance Officer 3 | officer3@vawaterfront.co.za | OFFICER |

> These users are **upserted automatically** on first sign-in — no seed required for login to work.

---

## 8. Smoke tests

Run these after setup to verify everything works end-to-end.

### 8.0 Demo Quickstart (fastest path)

> **Requires:** app running (`npm run dev` or deployed) and demo data seeded.

1. Open [http://localhost:3000/login](http://localhost:3000/login) and sign in with:
   - Email: `manager@vawaterfront.co.za`
   - Password: `Manager2024!`

2. Navigate to [http://localhost:3000/demo](http://localhost:3000/demo).
   You should see:
   - ✅ green banner showing you are signed in as ADMIN
   - Seed status showing template + FB store counts

3. Click **📊 Manager Dashboard (Demo)** → redirects to `/dashboard`.
   Verify KPI cards render (Total Stores, risk breakdown, etc.).

4. Go back to [/demo](http://localhost:3000/demo) and click **📋 Start Audit (Demo)**.
   - If no template/stores exist, they are auto-created (idempotent).
   - You are redirected to `/audits/new?auditId=<id>` — the audit form opens immediately.

> ⚠️ `/demo` is only accessible in `NODE_ENV=development` or when `DEMO_MODE=true` is set.
> On production Vercel, add `DEMO_MODE=true` to environment variables to enable it.

---

### 8.1 Health check (DB connectivity)

```bash
curl http://localhost:3000/api/health
```

Expected:

```json
{ "ok": true, "time": "...", "version": "...", "latencyMs": 12 }
```

Returns `503` if the database is unreachable.

### 8.2 Seed status (ADMIN only)

```bash
curl http://localhost:3000/api/admin/seed-status \
  -H "x-seed-secret: <SECRET>"
```

Expected (after seeding):

```json
{
  "ok": true,
  "counts": { "templatesCount": 1, "storesCount": 400, "fbStoresCount": 80, "auditsCount": 0 },
  "issues": []
}
```

`ok: false` with `issues` listed means seed has not run.

### 8.3 Dashboard

1. Log in as any demo user.
2. Navigate to `/dashboard`.
3. Verify the page renders KPI cards (Total Stores, Non-Compliant, Expiring Items, Overdue Actions).

### 8.4 Start an audit

1. Log in as an OFFICER or ADMIN.
2. Navigate to `/audits/new`.
3. Verify the store and template dropdowns are populated.
4. Select a store + template and click **Start Audit**.
5. Verify you are redirected to the audit form (URL contains `?auditId=...`).
6. Check `/audits` — a new DRAFT audit should appear.

### 8.5 Verify RBAC

| Action | ADMIN | OFFICER | Expected |
|---|---|---|---|
| View `/dashboard` | ✅ | ✅ | 200 |
| View `/audits/new` | ✅ | ✅ | 200 |
| View `/settings` | ✅ | ❌ | Redirect to /unauthorized |
| View `/demo` | ✅ | ✅ | 200 (dev/DEMO_MODE only) |

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Login returns error | DB not reachable | Check `DATABASE_URL`; run `curl /api/health` |
| `/audits/new` shows "No templates" | Seed not run | POST to `/api/admin/seed` with secret |
| `/audits/new` shows "No FB stores" | Seed not run | POST to `/api/admin/seed` with secret |
| Dashboard page crashes | SQL mismatch or missing data | Check server logs; run `/api/health` |
| `AUTH_SECRET` warnings in logs | Missing env var | Set `AUTH_SECRET` in `.env.local` |
