import { NextRequest, NextResponse } from 'next/server';
import { saveAuditResponse } from '@/app/audits/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await saveAuditResponse(body);
    return NextResponse.json({ success: true, response });
  } catch (error: unknown) {
    console.error('Save response error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
