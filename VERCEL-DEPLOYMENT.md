# Vercel Deployment Guide

## Your Project is Linked! 🎉

Project: **vawct**
Vercel URL: https://vawct-l7n4njr7x-burfix-8745s-projects.vercel.app

## Next Steps to Complete Deployment

### 1. Add PostgreSQL Database

You have 3 options:

#### Option A: Vercel Postgres (Recommended - Free Tier Available)

1. Go to your Vercel project: https://vercel.com/burfix-8745s-projects/vawct
2. Click **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose **Free Hobby** plan
5. Click **Create**
6. Copy the `POSTGRES_PRISMA_URL` connection string
7. Go to **Settings** → **Environment Variables**
8. Add these variables:
   - `DATABASE_URL` = (paste the POSTGRES_PRISMA_URL)
   - `NEXTAUTH_URL` = `https://your-app-name.vercel.app`
   - `NEXTAUTH_SECRET` = (generate with command below)

#### Option B: Supabase (Free Forever)

1. Go to https://supabase.com
2. Create a new project
3. Get the connection string from Project Settings → Database
4. Add to Vercel environment variables as `DATABASE_URL`

#### Option C: Neon (Free Tier)

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Vercel environment variables as `DATABASE_URL`

### 2. Generate NEXTAUTH_SECRET

Run this command:
```bash
openssl rand -base64 32
```

Copy the output and add it as `NEXTAUTH_SECRET` in Vercel environment variables.

### 3. Setup Database Schema

After adding the database, you need to push the schema:

**Option A: Use Vercel CLI**
```bash
# Set the DATABASE_URL locally to your production database
export DATABASE_URL="your-production-database-url"
npx prisma db push
npx tsx prisma/seed.ts
```

**Option B: Add a deploy script** (Already done - see package.json)

The app will automatically run `prisma generate` during build.

### 4. Redeploy

After adding environment variables:

```bash
npx vercel --prod
```

Or just push to git and Vercel will auto-deploy:

```bash
git push
```

## Environment Variables Needed

Add these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL="postgresql://..." (from your database provider)
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-generated-secret"
NODE_ENV="production"
```

## Quick Setup (5 minutes)

1. **Add Vercel Postgres**:
   - Visit: https://vercel.com/burfix-8745s-projects/vawct/stores
   - Click "Create Database" → Postgres
   - Select Free plan
   - It will auto-add DATABASE_URL to environment variables ✅

2. **Add Auth Secret**:
   ```bash
   openssl rand -base64 32
   ```
   Add as `NEXTAUTH_SECRET` in environment variables

3. **Add App URL**:
   Set `NEXTAUTH_URL` to your Vercel URL (e.g., `https://vawct.vercel.app`)

4. **Seed Database**:
   After first deploy succeeds, run:
   ```bash
   # Install Vercel CLI globally if needed
   npm i -g vercel
   
   # Pull environment variables
   vercel env pull .env.production
   
   # Seed the database
   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npx tsx prisma/seed.ts
   ```

5. **Access Your App**:
   Visit your Vercel URL and login with:
   - Email: `manager@vawaterfront.co.za`
   - Password: `password123`

## Troubleshooting

### Build fails with Prisma errors
- Make sure DATABASE_URL is set in Vercel environment variables
- Check that the connection string is correct
- Prisma generate runs automatically during build

### Can't connect to database
- Verify DATABASE_URL format: `postgresql://user:pass@host:5432/dbname`
- Make sure the database allows connections from Vercel IPs

### NextAuth errors
- Make sure NEXTAUTH_SECRET is set
- Make sure NEXTAUTH_URL matches your deployed URL
- Check that environment variables are set for Production environment

## Auto-Deploy Setup

Vercel is now watching your git repository. Every push to `main` will automatically deploy!

```bash
git add .
git commit -m "Your changes"
git push
```

## Custom Domain (Optional)

1. Go to your project settings
2. Click **Domains**
3. Add your custom domain
4. Follow DNS configuration steps
5. Update NEXTAUTH_URL to your custom domain

---

**Current Status**: Project linked to Vercel ✅
**Next Step**: Add PostgreSQL database and environment variables
**Estimated Time**: 5 minutes

Visit your project: https://vercel.com/burfix-8745s-projects/vawct
