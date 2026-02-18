import { NextResponse } from 'next/server';

/**
 * One-off seeded endpoint protected by a secret.
 * POST /api/admin/run-seed
 * Header: x-seed-secret: <secret>
 */
export async function POST(req: Request) {
  try {
    const secretHeader = req.headers.get('x-seed-secret') || '';
    const expected = process.env.SEED_SECRET || process.env.VERCEL_SEED_SECRET;

    if (!expected) {
      return NextResponse.json({ success: false, error: 'Server not configured (no SEED_SECRET)' }, { status: 500 });
    }

    if (!secretHeader || secretHeader !== expected) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Dynamically import the seed function
    const seedModule = await import('../../../../../prisma/seed');
    // `prisma/seed.ts` exports `seed` — use a safe any-cast to avoid TS build error
    const seed = (seedModule as any).seed ?? (seedModule as any).default;

    if (typeof seed !== 'function') {
      return NextResponse.json({ success: false, error: 'Seed function not found' }, { status: 500 });
    }

    await seed();

    return NextResponse.json({ success: true, message: 'Seed completed' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
