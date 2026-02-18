import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Try to query users
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      userCount: users.length,
      users: users,
      dbConnected: true,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      dbConnected: false,
    }, { status: 500 });
  }
}
