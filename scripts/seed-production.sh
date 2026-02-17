#!/bin/bash

# Run seed script against production database
# Usage: ./scripts/seed-production.sh

echo "⚠️  WARNING: This will seed your PRODUCTION database!"
echo "Make sure you have set DATABASE_URL environment variable to your Supabase URL"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please run: export DATABASE_URL='your-supabase-connection-string'"
    exit 1
fi

echo "🌱 Seeding production database..."
npx tsx prisma/seed.ts

if [ $? -eq 0 ]; then
    echo "✅ Seed completed successfully!"
else
    echo "❌ Seed failed. Check the error messages above."
    exit 1
fi
