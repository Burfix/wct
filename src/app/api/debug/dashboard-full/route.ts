import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const secret = process.env.SEED_SECRET;
    const header = req.headers.get('x-debug-secret');
    if (!secret || header !== secret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const actionsMod = await import('../../../dashboard/actions');
    const execMod = await import('../../../dashboard/actions-executive');
    const riskMod = await import('@/lib/risk-radar').catch(() => null);

    const results: Record<string, unknown> = {};

    try {
      results.stats = await actionsMod.getDashboardStats();
    } catch (e) {
      results.statsError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.priority = await actionsMod.getPriorityStores(20);
    } catch (e) {
      results.priorityError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.zones = await actionsMod.getZoneHotspots();
    } catch (e) {
      results.zonesError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.category = await actionsMod.getCategoryBreakdown();
    } catch (e) {
      results.categoryError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.officer = await actionsMod.getOfficerWorkload();
    } catch (e) {
      results.officerError = e instanceof Error ? e.message : String(e);
    }

    try {
      const rm = riskMod;
      if (rm && 'getRiskRadarTop3' in rm && typeof rm.getRiskRadarTop3 === 'function') {
        results.riskTop = await rm.getRiskRadarTop3(7);
      } else {
        results.riskTop = null;
      }
    } catch (e) {
      results.riskTopError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.execRadar = await execMod.getExecutiveRiskRadar();
    } catch (e) {
      results.execRadarError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
