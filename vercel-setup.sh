#!/bin/bash
# Quick Vercel Setup Script

echo "🚀 V&A Waterfront Compliance Tracker - Vercel Setup"
echo "=================================================="
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "Step 1: Environment Variables"
echo "------------------------------"
echo ""
echo "You need to add these environment variables in Vercel:"
echo ""
echo "1. NEXTAUTH_SECRET (generated):"
echo "   AX69J3k7PMYBWzqA+eHki/fT4sd9oppk8bTUF1EYxwc="
echo ""
echo "2. NEXTAUTH_URL:"
echo "   https://vawct.vercel.app"
echo ""
echo "3. DATABASE_URL:"
echo "   You need to add a PostgreSQL database first!"
echo ""
echo "=================================================="
echo ""
echo "🎯 EASIEST OPTION: Use Vercel Postgres (Free)"
echo ""
echo "1. Open: https://vercel.com/burfix-8745s-projects/vawct/stores"
echo "2. Click 'Create Database'"
echo "3. Select 'Postgres'"
echo "4. Choose 'Hobby (Free)'"
echo "5. Click 'Create'"
echo "6. It will automatically add DATABASE_URL ✅"
echo ""
echo "Then add the other variables:"
echo "1. Go to: https://vercel.com/burfix-8745s-projects/vawct/settings/environment-variables"
echo "2. Click 'Add New'"
echo "3. Add NEXTAUTH_SECRET and NEXTAUTH_URL (values shown above)"
echo ""
echo "=================================================="
echo ""
read -p "Press Enter after you've added the environment variables..."
echo ""
echo "🔄 Triggering new deployment..."
vercel --prod
echo ""
echo "✅ Done! Your app will be live shortly at:"
echo "   https://vawct.vercel.app"
