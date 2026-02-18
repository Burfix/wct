import { NextResponse } from 'next/server';

/**
 * Protected debug endpoint to return dashboard stats.
 * Provide header `x-debug-secret: <SEED_SECRET>` (uses same secret) to access.
 */
export async function GET(req: Request) {
  try {
    const secret = process.env.SEED_SECRET;
    const header = req.headers.get('x-debug-secret');
    if (!secret || header !== secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Import dashboard action dynamically to avoid build issues
    const mod = await import('../../../dashboard/actions');
    const getDashboardStats = mod.getDashboardStats;
    if (typeof getDashboardStats !== 'function') {
      return NextResponse.json({ success: false, error: 'getDashboardStats not found' }, { status: 500 });
    }

    const stats = await getDashboardStats();
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
