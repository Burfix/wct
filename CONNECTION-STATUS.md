# Database & Vercel Connection Status

## Current Status: ⚠️ Needs Attention

### Issues Found:
1. **Supabase Database Connection Failed** - Authentication credentials are invalid
2. **Multiple DATABASE_URL configurations** - Need to consolidate

---

## Supabase Setup (Required)

Your Supabase connection string appears to be invalid. Here's how to fix it:

### Step 1: Get Fresh Supabase Credentials

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to **Settings** → **Database**
4. Scroll down to **Connection String**
5. Select **Connection Pooling** tab
6. Copy the connection string that looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
   ```

### Step 2: Update Local Environment Files

Update `.env.local` with your fresh credentials:

```bash
# Supabase Database (Connection Pooling for Serverless)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="H8a5A0XPamu+Snb2rNeneY/Hw2UomE9uhv/VgY84RqA="
AUTH_SECRET="H8a5A0XPamu+Snb2rNeneY/Hw2UomE9uhv/VgY84RqA="
NODE_ENV="development"
```

### Step 3: Test Database Connection

Run the test script:
```bash
npm run test:db
```

Or manually:
```bash
npx tsx test-db-connection.ts
```

---

## Vercel Setup

### Current Vercel Configuration ✅

Your project is linked to Vercel:
- **Project**: vawct
- **Team**: burfix-8745s-projects
- **URL**: https://vawct.vercel.app

### Environment Variables on Vercel ✅

Current variables configured:
- ✅ `AUTH_SECRET` (Production)
- ✅ `NEXTAUTH_SECRET` (Production)
- ✅ `AUTH_URL` (Production)
- ✅ `NEXTAUTH_URL` (Production)
- ✅ `POSTGRES_URL` (All environments)
- ✅ `PRISMA_DATABASE_URL` (All environments)

### Update Vercel Database URL

Since the Supabase credentials are invalid, you need to update Vercel:

1. Go to: https://vercel.com/burfix-8745s-projects/vawct/settings/environment-variables
2. Find `POSTGRES_URL` and `PRISMA_DATABASE_URL`
3. Click **Edit** and update with your fresh Supabase connection string
4. Make sure to update for all environments: Production, Preview, Development

**OR** use Vercel's built-in Postgres:
1. Go to: https://vercel.com/burfix-8745s-projects/vawct/stores
2. Click **Create Database** → **Postgres**
3. Select **Hobby (Free)**
4. This will automatically configure the DATABASE_URL

---

## Quick Fix Steps

### Option A: Use Supabase (Currently configured)

```bash
# 1. Get fresh credentials from Supabase
# 2. Update .env.local file
# 3. Update Vercel environment variables
# 4. Test locally
npx tsx test-db-connection.ts

# 5. Push schema to Supabase
npx prisma db push

# 6. Seed the database
npx tsx prisma/seed.ts

# 7. Deploy to Vercel
vercel --prod
```

### Option B: Switch to Vercel Postgres (Easier)

```bash
# 1. Create Vercel Postgres database (see above)
# 2. It auto-configures environment variables
# 3. Update local .env.local with Vercel DB URL
# 4. Push schema
npx prisma db push

# 5. Seed the database
npx tsx prisma/seed.ts

# 6. Test
npx tsx test-db-connection.ts
```

---

## Testing Checklist

After updating credentials, verify:

- [ ] Local database connection works
- [ ] Can query users table
- [ ] Development environment configured
- [ ] Vercel environment variables updated
- [ ] Production deployment successful
- [ ] Can login without password (new feature)

---

## Next Steps

1. **Fix Database Credentials** (choose Supabase or Vercel Postgres)
2. **Update .env.local** with correct credentials
3. **Push Database Schema**: `npx prisma db push`
4. **Seed Database**: `npx tsx prisma/seed.ts`
5. **Test Locally**: `npx tsx test-db-connection.ts`
6. **Update Vercel**: Update environment variables
7. **Deploy**: `vercel --prod`

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/database/connecting-to-postgres
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Prisma Connection**: https://www.prisma.io/docs/guides/database/supabase

---

## Current Configuration Files

- ✅ `.env` - Production Vercel URL configured
- ⚠️ `.env.local` - Supabase credentials need updating
- ✅ `.env.example` - Template available
- ✅ `vercel.json` - Build configuration ready
- ✅ `prisma/schema.prisma` - Database schema defined
