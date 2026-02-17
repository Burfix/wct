import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * Debug endpoint to check database connectivity and data
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check templates
    const templates = await prisma.auditTemplate.findMany({
      select: { id: true, name: true, active: true },
    });

    // Check stores
    const stores = await prisma.store.findMany({
      where: { storeType: 'FB', status: 'active' },
      select: { id: true, storeCode: true, name: true },
    });

    // Check if we can create an audit
    let auditTest = null;
    if (stores.length > 0 && templates.length > 0) {
      try {
        auditTest = await prisma.audit.create({
          data: {
            storeId: stores[0].id,
            templateId: templates[0].id,
            conductedById: session.user.id!,
            auditDate: new Date(),
            status: 'DRAFT',
          },
        });
        
        // Clean up test audit
        await prisma.audit.delete({ where: { id: auditTest.id } });
        auditTest = { success: true };
      } catch (error) {
        auditTest = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return NextResponse.json({
      success: true,
      database: 'connected',
      templates: {
        count: templates.length,
        items: templates,
      },
      stores: {
        count: stores.length,
        items: stores,
      },
      auditCreationTest: auditTest,
      session: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
