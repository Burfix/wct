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
    const riskMod = await import('../../../../src/lib/risk-radar').catch(() => null);

    const results: Record<string, any> = {};

    try {
      results.stats = await (actionsMod as any).getDashboardStats();
    } catch (e) {
      results.statsError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.priority = await (actionsMod as any).getPriorityStores(20);
    } catch (e) {
      results.priorityError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.zones = await (actionsMod as any).getZoneHotspots();
    } catch (e) {
      results.zonesError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.category = await (actionsMod as any).getCategoryBreakdown();
    } catch (e) {
      results.categoryError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.officer = await (actionsMod as any).getOfficerWorkload();
    } catch (e) {
      results.officerError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.riskTop = await (await import('../../../dashboard/actions')).getRiskRadarTop3?.(7);
    } catch (e) {
      results.riskTopError = e instanceof Error ? e.message : String(e);
    }

    try {
      results.execRadar = await (execMod as any).getExecutiveRiskRadar();
    } catch (e) {
      results.execRadarError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
