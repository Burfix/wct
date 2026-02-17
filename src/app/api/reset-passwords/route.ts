import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

/**
 * Public endpoint to reset demo passwords
 * This allows anyone to reset the demo account passwords
 */
export async function GET() {
  try {
    console.log('🔐 Resetting demo user passwords...');

    const password = 'password123';
    const hashedPassword = await hash(password, 12);

    // Update all user passwords
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`✅ Updated password for ${user.email}`);
    }

    return NextResponse.json({
      success: true,
      message: 'All user passwords reset to: password123',
      usersUpdated: users.length,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset passwords',
      },
      { status: 500 }
    );
  }
}
