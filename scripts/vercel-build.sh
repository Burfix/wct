#!/usr/bin/env bash
set -euo pipefail

LOG="/tmp/vercel_build.log"
rm -f "$LOG"

echo "=== Vercel build wrapper started ===" | tee -a "$LOG"

echo "-> Running: npx prisma db push --schema prisma/schema.prisma" | tee -a "$LOG"
npx prisma db push --schema prisma/schema.prisma 2>&1 | tee -a "$LOG"

echo "-> Running: npx tsx prisma/seed.ts" | tee -a "$LOG"
npx tsx prisma/seed.ts 2>&1 | tee -a "$LOG"

echo "-> Running: npx prisma generate" | tee -a "$LOG"
npx prisma generate 2>&1 | tee -a "$LOG"

echo "-> Running: npx next build" | tee -a "$LOG"
npx next build 2>&1 | tee -a "$LOG"

echo "=== Vercel build wrapper finished ===" | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "=== Build log (start) ==="
cat "$LOG"
echo "=== Build log (end) ==="

exit 0
