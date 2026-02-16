# 🚀 Quick Deployment Checklist

## ✅ Done
- [x] Project created on Vercel
- [x] Code committed to git
- [x] Vercel project linked: `vawct`

## 📋 Next Steps (5 minutes)

### Step 1: Add PostgreSQL Database (FREE)

**Easiest Option - Vercel Postgres:**

1. Open: https://vercel.com/burfix-8745s-projects/vawct/stores
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose **"Hobby (Free)"** plan - includes:
   - 256 MB storage
   - 60 hours compute/month
   - Perfect for demo/development
5. Click **"Create"**
6. Database will auto-connect to your project ✅

**Alternative - Supabase (Free Forever):**

1. Go to https://supabase.com/dashboard
2. Click **"New project"**
3. Fill in:
   - Name: `vawct-db`
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
4. Wait 2 minutes for setup
5. Go to **Project Settings** → **Database**
6. Copy the **Connection String** (URI format)
7. In Vercel, go to: https://vercel.com/burfix-8745s-projects/vawct/settings/environment-variables
8. Add variable:
   - Key: `DATABASE_URL`
   - Value: (paste connection string)
   - Environment: **Production**

### Step 2: Add Authentication Secret

**Generate secret:**
```bash
openssl rand -base64 32
```

**Add to Vercel:**
1. Go to: https://vercel.com/burfix-8745s-projects/vawct/settings/environment-variables
2. Add variable:
   - Key: `NEXTAUTH_SECRET`
   - Value: (paste generated secret)
   - Environment: **Production**

### Step 3: Add App URL

1. In Vercel environment variables, add:
   - Key: `NEXTAUTH_URL`
   - Value: `https://vawct.vercel.app` (or your custom domain)
   - Environment: **Production**

### Step 4: Trigger Deployment

After adding all environment variables:

**Option A: Redeploy via Vercel Dashboard**
1. Go to: https://vercel.com/burfix-8745s-projects/vawct
2. Click **"Deployments"** tab
3. Find the latest deployment
4. Click **"⋯"** → **"Redeploy"**

**Option B: Redeploy via CLI**
```bash
npx vercel --prod
```

### Step 5: Seed Database (After First Successful Deploy)

```bash
# Generate a secret for NextAuth
export NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set your production database URL (get from Vercel dashboard)
export DATABASE_URL="your-production-postgres-url"

# Seed the database
npx tsx prisma/seed.ts
```

### Step 6: Access Your App! 🎉

1. Visit: https://vawct.vercel.app
2. Login with:
   - **Email**: `manager@vawaterfront.co.za`
   - **Password**: `password123`

---

## 📊 What You'll See

- **Dashboard** with 400 stores
- **Priority Queue** showing high-risk stores
- **Zone Hotspots** across V&A Waterfront
- **Team Workload** for 6 officers
- Fully functional compliance tracking

---

## 🔧 Environment Variables Summary

Add these in Vercel → Settings → Environment Variables:

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql://...` | Vercel Postgres or Supabase |
| `NEXTAUTH_SECRET` | (generated) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://vawct.vercel.app` | Your Vercel URL |

---

## 🆘 Need Help?

**Common Issues:**

1. **Build fails**: Make sure DATABASE_URL is added before deploying
2. **Can't login**: Check NEXTAUTH_SECRET and NEXTAUTH_URL are set
3. **Database empty**: Run the seed script (Step 5)

**Quick Links:**
- Project Dashboard: https://vercel.com/burfix-8745s-projects/vawct
- Environment Variables: https://vercel.com/burfix-8745s-projects/vawct/settings/environment-variables
- Deployments: https://vercel.com/burfix-8745s-projects/vawct/deployments
- Logs: https://vercel.com/burfix-8745s-projects/vawct/logs

---

## ⏱️ Estimated Time: 5 minutes

Once environment variables are added, deployment is automatic!
