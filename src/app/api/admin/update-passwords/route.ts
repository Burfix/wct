import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { auth } from '@/lib/auth';

/**
 * Admin endpoint to update demo user passwords to meet new 12-char minimum
 * DELETE this file after running once in production!
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Security: Only allow ADMIN users
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔐 Updating demo user passwords...');

    const newPassword = 'password12345'; // Meets 12-char minimum
    const hashedPassword = await hash(newPassword, 12);

    // Update manager account
    await prisma.user.updateMany({
      where: { email: 'manager@vawaterfront.co.za' },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
      },
    });

    // Update officer account
    await prisma.user.updateMany({
      where: { email: 'officer@vawaterfront.co.za' },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
      },
    });

    console.log('✅ Demo user passwords updated');

    return NextResponse.json({
      success: true,
      message: 'Demo user passwords updated to meet new 12-character minimum',
      newPassword: newPassword,
    });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update passwords',
      },
      { status: 500 }
    );
  }
}
