import { NextRequest, NextResponse } from 'next/server';
import { submitAudit } from '@/app/audits/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const audit = await submitAudit(body);
    return NextResponse.json({ success: true, audit });
  } catch (error: any) {
    console.error('Submit audit error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
