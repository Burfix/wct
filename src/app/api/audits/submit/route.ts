import { NextRequest, NextResponse } from 'next/server';
import { submitAudit } from '@/app/audits/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const audit = await submitAudit(body);
    return NextResponse.json({ success: true, audit });
  } catch (error: unknown) {
    console.error('Submit audit error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
