# Quick Fix: Seed Production Database

## Problem
The production database doesn't have the audit template seeded, so you can't start new audits.

## Solution: One-Time Seed via Admin Endpoint

### Step 1: Login to Production
1. Go to https://vawct.vercel.app/login
2. Login with your ADMIN credentials

### Step 2: Seed the Database
Open this URL in a new tab (while logged in):
```
https://vawct.vercel.app/api/admin/seed
```

You should see a success message like:
```json
{
  "success": true,
  "message": "Audit template seeded successfully",
  "template": {
    "id": "...",
    "name": "Restaurant – Health & Safety (BOH)"
  }
}
```

### Step 3: Start an Audit
1. Go to https://vawct.vercel.app/audits/new
2. Select a store
3. Select the audit template
4. Click "Start Audit"

## Alternative: Seed via API Call

If you prefer to use curl or Postman:

```bash
# First get your session cookie by logging in via browser
# Then make a POST request to the seed endpoint

curl -X POST https://vawct.vercel.app/api/admin/seed \
  -H "Cookie: your-session-cookie-here"
```

## After Seeding

Once the audit template is created, **delete the seed endpoint** for security:
```bash
rm src/app/api/admin/seed/route.ts
git commit -m "chore: remove seed endpoint after use"
vercel --prod
```

## Troubleshooting

### Error: "Unauthorized"
- Make sure you're logged in as an ADMIN user
- Check that your session is active (try refreshing the page)

### Error: "Audit template already exists"
- The seed has already run successfully
- You can proceed to create audits

### Error: Database connection issues
- Check that DATABASE_URL is set in Vercel environment variables
- Verify your Supabase database is running

## Test Stores

If you don't have any test stores in the database, you may need to create some first. The seed endpoint only creates the audit template, not stores.

To create test stores, either:
1. Use the admin UI to add stores manually
2. Run the main seed script: `npm run db:seed` (after setting DATABASE_URL locally)
