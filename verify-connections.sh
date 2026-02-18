#!/bin/bash

# V&A Waterfront Compliance Tracker - Connection Verification Script
# This script helps verify and fix database and Vercel connections

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  V&A Waterfront - Connection Verification & Fix Script        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking Prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command_exists node; then
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

if command_exists npm; then
    echo -e "${GREEN}✓${NC} npm: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

if command_exists vercel; then
    echo -e "${GREEN}✓${NC} Vercel CLI installed"
else
    echo -e "${YELLOW}⚠${NC} Vercel CLI not found (optional)"
fi

echo ""
echo "🔍 Checking Configuration Files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    if grep -q "DATABASE_URL" .env.local; then
        echo -e "${GREEN}✓${NC} DATABASE_URL configured"
    else
        echo -e "${RED}✗${NC} DATABASE_URL not found in .env.local"
    fi
else
    echo -e "${RED}✗${NC} .env.local not found"
    echo -e "${YELLOW}→${NC} Creating from .env.example..."
    cp .env.example .env.local
fi

echo ""
echo "🗄️  Testing Database Connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test database connection
if npx tsx test-db-connection.ts 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Database connection successful!"
else
    echo -e "${RED}✗${NC} Database connection failed"
    echo ""
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ACTION REQUIRED: Fix Database Credentials            ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Choose an option:"
    echo ""
    echo "  1. Update Supabase credentials"
    echo "     → Go to: https://supabase.com/dashboard"
    echo "     → Get fresh connection string"
    echo "     → Update .env.local"
    echo ""
    echo "  2. Use Vercel Postgres (Recommended)"
    echo "     → Go to: https://vercel.com/burfix-8745s-projects/vawct/stores"
    echo "     → Click 'Create Database'"
    echo "     → Select 'Postgres' (Free Hobby plan)"
    echo "     → Copy connection string to .env.local"
    echo ""
    echo "See CONNECTION-STATUS.md for detailed instructions"
    echo ""
    
    read -p "Would you like to open CONNECTION-STATUS.md? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists code; then
            code CONNECTION-STATUS.md
        elif command_exists open; then
            open CONNECTION-STATUS.md
        else
            cat CONNECTION-STATUS.md
        fi
    fi
    exit 1
fi

echo ""
echo "☁️  Checking Vercel Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command_exists vercel; then
    if vercel env ls >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Vercel project linked"
        echo ""
        echo "Environment variables on Vercel:"
        vercel env ls | head -10
    else
        echo -e "${YELLOW}⚠${NC} Vercel not linked or not logged in"
        echo "  Run: vercel login && vercel link"
    fi
else
    echo -e "${YELLOW}⚠${NC} Vercel CLI not installed"
    echo "  Install: npm install -g vercel"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ All Checks Complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📝 Summary:"
echo "  • Database: Check test results above"
echo "  • Vercel: See environment variables above"
echo "  • Next.js: Ready to run (npm run dev)"
echo ""
echo "Quick Commands:"
echo "  npm run dev          - Start development server"
echo "  npm run db:push      - Push schema to database"
echo "  npm run db:seed      - Seed database with demo data"
echo "  vercel --prod        - Deploy to production"
echo ""
