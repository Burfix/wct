#!/bin/bash

# Quick Database Setup Script
# Helps you quickly set up and configure the database

echo "🗄️  V&A Waterfront - Quick Database Setup"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local from template..."
    cp .env.example .env.local
fi

echo "Choose your database option:"
echo ""
echo "1. Supabase (Current configuration)"
echo "2. Vercel Postgres (Recommended)"
echo "3. Test existing connection"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📋 Supabase Setup Instructions:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Go to: https://supabase.com/dashboard"
        echo "2. Select your project or create a new one"
        echo "3. Go to Settings → Database"
        echo "4. Find 'Connection Pooling' section"
        echo "5. Copy the connection string"
        echo ""
        echo "Format:"
        echo "postgresql://postgres.[REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
        echo ""
        read -p "Paste your Supabase connection string: " db_url
        
        if [ ! -z "$db_url" ]; then
            # Update .env.local
            sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$db_url\"|g" .env.local
            # Also update DIRECT_URL (change port to 5432)
            direct_url=$(echo "$db_url" | sed 's/:6543/:5432/')
            sed -i.bak "s|DIRECT_URL=.*|DIRECT_URL=\"$direct_url\"|g" .env.local
            echo "✅ Updated .env.local"
            
            # Test connection
            echo ""
            echo "Testing connection..."
            npm run test:db
        fi
        ;;
        
    2)
        echo ""
        echo "📋 Vercel Postgres Setup:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Go to: https://vercel.com/burfix-8745s-projects/vawct/stores"
        echo "2. Click 'Create Database'"
        echo "3. Select 'Postgres'"
        echo "4. Choose 'Hobby (Free)' plan"
        echo "5. Click 'Create'"
        echo ""
        echo "After creation:"
        echo "6. Go to the '.env.local' tab"
        echo "7. Copy POSTGRES_PRISMA_URL value"
        echo ""
        read -p "Paste your POSTGRES_PRISMA_URL: " db_url
        
        if [ ! -z "$db_url" ]; then
            # Update .env.local
            sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$db_url\"|g" .env.local
            echo "✅ Updated .env.local"
            
            # Also ask for DIRECT_URL
            echo ""
            read -p "Paste your POSTGRES_URL (direct connection): " direct_url
            if [ ! -z "$direct_url" ]; then
                sed -i.bak "s|DIRECT_URL=.*|DIRECT_URL=\"$direct_url\"|g" .env.local
            fi
            
            # Test connection
            echo ""
            echo "Testing connection..."
            npm run test:db
        fi
        ;;
        
    3)
        echo ""
        echo "Testing existing connection..."
        npm run test:db
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# If connection is successful, offer to push schema and seed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection successful!"
    echo ""
    read -p "Would you like to push the schema and seed data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📤 Pushing database schema..."
        npm run db:push
        
        echo ""
        echo "🌱 Seeding database..."
        npm run db:seed
        
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo "✅ Setup Complete!"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "Your database is ready! You can now:"
        echo ""
        echo "  npm run dev          → Start development server"
        echo "  npm run db:studio    → Open database GUI"
        echo "  vercel --prod        → Deploy to production"
        echo ""
    fi
else
    echo ""
    echo "❌ Connection failed. Please check your credentials and try again."
    echo "See SUPABASE-VERCEL-STATUS.md for detailed troubleshooting."
fi
