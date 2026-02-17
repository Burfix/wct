import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Exact same query as SelectAuditForm
    const stores = await prisma.store.findMany({
      where: {
        status: 'active',
        storeType: 'FB',
      },
      select: {
        id: true,
        storeCode: true,
        name: true,
        zone: true,
      },
      orderBy: { storeCode: 'asc' },
    });

    // All stores
    const allStores = await prisma.store.findMany({
      select: {
        id: true,
        storeCode: true,
        name: true,
        zone: true,
        storeType: true,
        status: true,
      },
    });

    return NextResponse.json({
      activeStores: {
        count: stores.length,
        items: stores,
      },
      allStores: {
        count: allStores.length,
        items: allStores,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
