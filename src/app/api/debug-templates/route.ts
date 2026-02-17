import { NextResponse } from 'next/server';
import { getAuditTemplates } from '@/app/audits/actions';

export async function GET() {
  try {
    const templates = await getAuditTemplates();

    return NextResponse.json({
      count: templates.length,
      templates: templates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
